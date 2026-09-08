from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from database import get_db
from models.user import User
from middleware.auth import get_optional_current_user
from services.agent_chat_service import AgentChatService
from api.skills import SkillResponse

router = APIRouter(prefix="/agent-chat", tags=["Agent Chat"])


class ChatMessageInput(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AgentChatRequest(BaseModel):
    query: str
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


@router.post("/message", response_model=AgentChatResponse)
async def chat_with_agent(
    payload: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    RAG Agent Chat endpoint.
    Scans the database of skills, retrieves the top 2-4 matching skills,
    and returns a direct conversational explanation with structured interactive cards.
    """
    history_dicts = [
        {"role": h.role, "content": h.content}
        for h in (payload.history or [])
    ]

    user_id = current_user.id if current_user else None

    result = await AgentChatService.chat(
        db=db,
        query=payload.query,
        history=history_dicts,
        language=payload.language or "vi",
        user_id=user_id
    )

    return result


@router.get("/suggestions", response_model=List[SuggestionItem])
def get_chat_suggestions(
    language: str = Query("vi", description="vi or en")
):
    """
    Returns curated quick-start prompt queries for the Agent Chat interface.
    """
    return AgentChatService.get_prompt_suggestions(language=language)
