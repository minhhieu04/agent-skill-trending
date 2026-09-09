import secrets
import time
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models.user import User
from models.agent_chat import ChatSession, ChatMessage
from middleware.auth import get_current_user
from services.agent_chat_service import AgentChatService
from api.skills import SkillResponse

router = APIRouter(prefix="/agent-chat", tags=["Agent Chat"])


# --- Schemas ---

class ChatMessageInput(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AgentChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    history: Optional[List[ChatMessageInput]] = []
    language: Optional[str] = "vi"


class AgentChatRecommendedSkill(BaseModel):
    skill: SkillResponse
    relevance_score: float
    match_reasons: List[str]
    quick_tip: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RetrievalStats(BaseModel):
    total_skills_scanned: int
    candidates_matched: int
    top_selected: int


class AgentChatResponse(BaseModel):
    success: bool = True
    session_id: str
    message: str
    recommended_skills: List[AgentChatRecommendedSkill]
    suggested_followups: List[str]
    retrieval_stats: RetrievalStats
    model_used: str
    is_ai_powered: bool


class SuggestionItem(BaseModel):
    title: str
    query: str
    icon: str
    category: str


class ChatMessageDetail(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    recommended_skills: Optional[List[AgentChatRecommendedSkill]] = []
    suggested_followups: Optional[List[str]] = []
    retrieval_stats: Optional[RetrievalStats] = None
    model_used: Optional[str] = None
    is_ai_powered: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionSummary(BaseModel):
    id: str
    title: str
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionDetail(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageDetail]

    model_config = ConfigDict(from_attributes=True)


class CreateSessionRequest(BaseModel):
    title: Optional[str] = "Cuộc trò chuyện mới"


class UpdateSessionRequest(BaseModel):
    title: str


# --- Helper Functions ---

def _serialize_recommended_skills(recs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    serialized = []
    for r in recs:
        s = r.get("skill")
        if hasattr(s, "id"):
            skill_dict = SkillResponse.model_validate(s).model_dump(mode="json")
        elif isinstance(s, dict):
            skill_dict = s
        else:
            skill_dict = {}
        serialized.append({
            "skill": skill_dict,
            "relevance_score": float(r.get("relevance_score", 0.0)),
            "match_reasons": list(r.get("match_reasons", [])),
            "quick_tip": r.get("quick_tip")
        })
    return serialized


def _generate_session_title(query: str) -> str:
    clean = (query or "").strip().replace("\n", " ")
    if not clean:
        return "Cuộc trò chuyện mới"
    return clean[:45] + ("..." if len(clean) > 45 else "")


# --- Endpoints ---

@router.get("/sessions", response_model=List[ChatSessionSummary])
def get_user_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all chat sessions for the authenticated user, sorted by last updated time.
    Filters out empty sessions that have zero messages.
    """
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(desc(ChatSession.updated_at))
        .all()
    )

    summaries = []
    for s in sessions:
        msg_count = len(s.messages)
        # Only return sessions with at least 1 message
        if msg_count > 0:
            summaries.append(
                ChatSessionSummary(
                    id=s.id,
                    title=s.title,
                    message_count=msg_count,
                    created_at=s.created_at,
                    updated_at=s.updated_at
                )
            )

    return summaries


@router.post("/sessions", response_model=ChatSessionDetail)
def create_chat_session(
    payload: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explicitly creates a new chat session for the authenticated user.
    """
    session_id = f"session-{int(time.time() * 1000)}-{secrets.token_hex(3)}"
    new_session = ChatSession(
        id=session_id,
        user_id=current_user.id,
        title=payload.title or "Cuộc trò chuyện mới",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return ChatSessionDetail(
        id=new_session.id,
        title=new_session.title,
        created_at=new_session.created_at,
        updated_at=new_session.updated_at,
        messages=[]
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_chat_session_detail(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full message history of a specific chat session belonging to the user.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phiên trò chuyện không tồn tại hoặc không thuộc quyền sở hữu của bạn"
        )

    # Format messages
    messages_detail = []
    for m in session.messages:
        messages_detail.append(
            ChatMessageDetail(
                id=m.id,
                session_id=m.session_id,
                role=m.role,
                content=m.content,
                recommended_skills=m.recommended_skills or [],
                suggested_followups=m.suggested_followups or [],
                retrieval_stats=m.retrieval_stats or None,
                model_used=m.model_used,
                is_ai_powered=bool(m.is_ai_powered),
                created_at=m.created_at
            )
        )

    return ChatSessionDetail(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages_detail
    )


@router.patch("/sessions/{session_id}", response_model=ChatSessionSummary)
def update_chat_session(
    session_id: str,
    payload: UpdateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Renames the title of an existing chat session.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phiên trò chuyện không tồn tại"
        )

    clean_title = (payload.title or "").strip()
    if clean_title:
        session.title = clean_title
        session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(session)

    return ChatSessionSummary(
        id=session.id,
        title=session.title,
        message_count=len(session.messages),
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes a chat session and all its associated messages from the database.
    """
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phiên trò chuyện không tồn tại"
        )

    db.delete(session)
    db.commit()
    return {"success": True, "message": "Đã xóa phiên trò chuyện thành công"}


@router.post("/message", response_model=AgentChatResponse)
async def chat_with_agent(
    payload: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated RAG Agent Chat endpoint.
    Retrieves top matching skills, generates contextual synthesis,
    and atomically stores both user and assistant messages into the database.
    """
    # 1. Resolve or create chat session in DB
    session = None
    if payload.session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == payload.session_id, ChatSession.user_id == current_user.id)
            .first()
        )

    if not session:
        # Generate new session ID or use provided one
        sess_id = payload.session_id or f"session-{int(time.time() * 1000)}-{secrets.token_hex(3)}"
        session = ChatSession(
            id=sess_id,
            user_id=current_user.id,
            title=_generate_session_title(payload.query),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(session)
        db.flush()
    else:
        # If session has default title, update it with first meaningful user query
        if session.title in ["Cuộc trò chuyện mới", "New Chat", ""]:
            session.title = _generate_session_title(payload.query)

    # 2. Save user message to database
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=payload.query.strip(),
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.flush()

    # 3. Retrieve multi-turn history for RAG context
    history_dicts = []
    if payload.history:
        history_dicts = [
            {"role": h.role, "content": h.content}
            for h in payload.history
        ]
    else:
        # Fall back to fetching recent DB messages for this session
        db_recent = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.id, ChatMessage.id != user_msg.id)
            .order_by(desc(ChatMessage.created_at))
            .limit(4)
            .all()
        )
        for prev in reversed(db_recent):
            history_dicts.append({"role": prev.role, "content": prev.content})

    # 4. Execute RAG & LLM Synthesis
    result = await AgentChatService.chat(
        db=db,
        query=payload.query,
        history=history_dicts,
        language=payload.language or "vi",
        user_id=current_user.id
    )

    # 5. Serialize recommended skills for database JSON storage
    raw_recs = result.get("recommended_skills", [])
    serialized_recs = _serialize_recommended_skills(raw_recs)

    # 6. Save assistant message to database
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=result.get("message", ""),
        recommended_skills=serialized_recs,
        suggested_followups=result.get("suggested_followups", []),
        retrieval_stats=result.get("retrieval_stats", {}),
        model_used=result.get("model_used", "gemini"),
        is_ai_powered=bool(result.get("is_ai_powered", False)),
        created_at=datetime.utcnow()
    )
    db.add(assistant_msg)

    # 7. Update session timestamp & commit
    session.updated_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "session_id": session.id,
        "message": result.get("message", ""),
        "recommended_skills": serialized_recs,
        "suggested_followups": result.get("suggested_followups", []),
        "retrieval_stats": result.get("retrieval_stats", {
            "total_skills_scanned": 0,
            "candidates_matched": 0,
            "top_selected": 0
        }),
        "model_used": result.get("model_used", ""),
        "is_ai_powered": bool(result.get("is_ai_powered", False))
    }


@router.get("/suggestions", response_model=List[SuggestionItem])
def get_chat_suggestions(
    language: str = Query("vi", description="vi or en")
):
    """
    Returns curated quick-start prompt queries for the Agent Chat interface.
    Publicly accessible so users can preview capabilities.
    """
    return AgentChatService.get_prompt_suggestions(language=language)
