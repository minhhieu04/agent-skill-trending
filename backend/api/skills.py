from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from database import get_db
from models.skill import Skill
from models.user import User
from models.user_bookmark import UserBookmark
from models.audit_log import AuditLog
from middleware.auth import get_optional_current_user
from services.skill_service import SkillService
from services.exporter_service import ExporterService
from services.security_scanner import SecurityScanner
from services.learning_track_service import LearningTrackService

router = APIRouter(tags=["Skills"])

class SkillResponse(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    repository_url: str
    author: Optional[str] = None
    description: Optional[str] = None
    ai_summary: Optional[str] = None
    use_cases: List[str] = []
    comparison_notes: Optional[str] = None
    target_audience: Optional[str] = None
    readme_preview: Optional[str] = None
    demo_url: Optional[str] = None
    category: str
    tags: List[str]
    runtimes: List[str]
    difficulty: str
    primary_language: Optional[str] = None
    stars: int
    forks: int
    open_issues: int
    star_velocity_7d: float
    reddit_mentions: int
    hackernews_mentions: int
    quality_score: float
    trending_score: float
    relevance_score: float
    security_rating: Optional[str] = "safe"
    security_score: Optional[float] = 95.0
    security_flags: Optional[List[Dict[str, Any]]] = []
    permission_level: Optional[str] = "read_only"
    is_featured: bool
    is_bookmarked: bool
    source_type: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompareRequest(BaseModel):
    skill_ids: List[int]

class CategoryInfoResponse(BaseModel):
    key: str
    title: str
    description: str
    icon: str
    count: int

class RuntimeInfoResponse(BaseModel):
    name: str
    description: str
    count: int

class StatsResponse(BaseModel):
    total_skills: int
    categories_count: Dict[str, int]
    runtimes_count: Dict[str, int]
    languages_count: Dict[str, int]
    total_stars: int
    bookmarked_count: int

class AIRecommendTrackRequest(BaseModel):
    goal_query: str
    language: Optional[str] = "vi"
    max_skills: Optional[int] = 8

class RoadmapStageResponse(BaseModel):
    stage_number: int
    title: str
    description: str
    recommended_skill_ids: List[int] = []
    key_takeaways: List[str] = []

class RecommendedSkillItemResponse(BaseModel):
    skill: SkillResponse
    match_score: float
    reason: str
    stage_number: int

class AIRecommendationResponse(BaseModel):
    success: bool
    is_ai_powered: bool
    goal_query: str
    summary: str
    difficulty_level: str
    estimated_time: str
    target_technologies: List[str] = []
    roadmap: List[RoadmapStageResponse] = []
    recommended_skills: List[RecommendedSkillItemResponse] = []
    ai_tips: List[str] = []

CATEGORIES_META = [
    {"key": "coding-agent", "title": "Coding Agents", "description": "Autonomous developer agents (Devin, Cursor, Claude Code, Antigravity, Codex)", "icon": "Code2"},
    {"key": "mcp-server", "title": "MCP Servers", "description": "Model Context Protocol tools & integrations (Postgres, Git, Slack, Filesystem)", "icon": "Server"},
    {"key": "skill-file", "title": "Agent Skills & Rules", "description": "Procedural SKILL.md, .cursorrules, copilot-instructions, and prompt standards", "icon": "Sparkles"},
    {"key": "prompt-engineering", "title": "Prompt Engineering", "description": "Chain-of-thought, system prompts, few-shot coding templates", "icon": "MessageSquareText"},
    {"key": "workflow-automation", "title": "Workflow Automation", "description": "Multi-agent frameworks, n8n, LangGraph, CrewAI state machines", "icon": "Workflow"},
    {"key": "local-llm", "title": "Local LLM & Inference", "description": "Ollama, vLLM, DeepSeek-R1, llama.cpp offline coding engines", "icon": "Cpu"},
    {"key": "tool-integration", "title": "Tool & API Calling", "description": "Custom API wrappers, web scrapers, browser-use toolkits", "icon": "Wrench"},
    {"key": "eval-benchmark", "title": "Eval & Benchmarking", "description": "SWE-bench, AgentBench, code quality & test evaluation harnesses", "icon": "BarChart3"},
    {"key": "security-guardrail", "title": "Security & Guardrails", "description": "Code injection defense, secret scanners, safe command execution", "icon": "ShieldCheck"},
]

RUNTIMES_META = [
    {"name": "Google Antigravity", "description": "Google Deepmind & Gemini agentic IDE with .gemini/config/skills/"},
    {"name": "OpenAI Codex", "description": "OpenAI & GitHub Copilot CLI with .github/copilot-instructions.md"},
    {"name": "Cursor", "description": "AI-first Code Editor with .cursorrules and .cursor/rules/*.mdc"},
    {"name": "Claude Code", "description": "Anthropic's terminal & desktop agent with ~/.claude/skills/SKILL.md"},
    {"name": "Windsurf", "description": "Codeium agentic IDE with .windsurfrules and Cascade flows"},
    {"name": "Aider", "description": "Terminal pair programming agent with Git auto-commits"},
    {"name": "Model Context Protocol", "description": "Open standard for connecting AI to external tools & data sources"},
    {"name": "LangGraph", "description": "Cyclical state graph multi-agent orchestration framework"},
]

def _get_categories_data(db: Session):
    skills = db.query(Skill).all()
    counts = {}
    for s in skills:
        counts[s.category] = counts.get(s.category, 0) + 1
    return [
        CategoryInfoResponse(
            key=c["key"],
            title=c["title"],
            description=c["description"],
            icon=c["icon"],
            count=counts.get(c["key"], 0)
        )
        for c in CATEGORIES_META
    ]

def _get_runtimes_data(db: Session):
    skills = db.query(Skill).all()
    counts = {}
    for s in skills:
        if s.runtimes:
            for r in s.runtimes:
                counts[r] = counts.get(r, 0) + 1
    return [
        RuntimeInfoResponse(
            name=r["name"],
            description=r["description"],
            count=counts.get(r["name"], 0)
        )
        for r in RUNTIMES_META
    ]

# Categories & Runtimes routes (Support both /skills/categories and /categories)
@router.get("/skills/categories", response_model=List[CategoryInfoResponse])
@router.get("/categories", response_model=List[CategoryInfoResponse])
def get_categories(db: Session = Depends(get_db)):
    return _get_categories_data(db)

@router.get("/skills/runtimes", response_model=List[RuntimeInfoResponse])
@router.get("/runtimes", response_model=List[RuntimeInfoResponse])
def get_runtimes(db: Session = Depends(get_db)):
    return _get_runtimes_data(db)

@router.get("/skills/stats", response_model=StatsResponse)
def get_skills_stats(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    skills = db.query(Skill).all()
    total_skills = len(skills)
    total_stars = sum(s.stars for s in skills)

    if current_user:
        bookmarked_count = db.query(UserBookmark).filter(UserBookmark.user_id == current_user.id).count()
    else:
        user = db.query(User).filter(User.username == "hieu").first()
        bookmarked_count = db.query(UserBookmark).filter(UserBookmark.user_id == user.id).count() if user else 0

    categories_count = {}
    runtimes_count = {}
    languages_count = {}

    for s in skills:
        cat = s.category or "uncategorized"
        categories_count[cat] = categories_count.get(cat, 0) + 1

        lang = s.primary_language or "Other"
        languages_count[lang] = languages_count.get(lang, 0) + 1

        if s.runtimes:
            for r in s.runtimes:
                runtimes_count[r] = runtimes_count.get(r, 0) + 1

    return {
        "total_skills": total_skills,
        "categories_count": categories_count,
        "runtimes_count": runtimes_count,
        "languages_count": languages_count,
        "total_stars": total_stars,
        "bookmarked_count": bookmarked_count
    }

@router.get("/skills/trending", response_model=List[SkillResponse])
def get_trending_skills(
    category: Optional[str] = Query(None, description="Filter by category"),
    runtime: Optional[str] = Query(None, description="Filter by runtime"),
    language: Optional[str] = Query(None, description="Filter by programming language"),
    search: Optional[str] = Query(None, description="Search query"),
    min_score: Optional[float] = Query(0.0, description="Minimum trending score"),
    sort_by: Optional[str] = Query("trending_score", description="Sort field"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return SkillService.get_trending_skills(
        db=db,
        category=category,
        runtime=runtime,
        language=language,
        search=search,
        min_score=min_score,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
        user_id=current_user.id if current_user else None
    )

@router.get("/skills/personalized", response_model=List[SkillResponse])
def get_personalized_skills(
    limit: int = Query(30, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return SkillService.get_personalized_skills(
        db=db,
        user=current_user,
        limit=limit
    )

@router.post("/skills/compare", response_model=List[SkillResponse])
def compare_skills(
    data: CompareRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return SkillService.compare_skills(
        db=db,
        skill_ids=data.skill_ids,
        user_id=current_user.id if current_user else None
    )

@router.get("/skills/bookmarked", response_model=List[SkillResponse])
def get_bookmarked_skills(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or db.query(User).filter(User.username == "hieu").first()
    if user:
        bms = db.query(UserBookmark).filter(UserBookmark.user_id == user.id).all()
        skill_ids = [b.skill_id for b in bms]
        skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
        for s in skills:
            s.is_bookmarked = True
        return skills
    return []

@router.post("/skills/{skill_id}/bookmark", response_model=SkillResponse)
def toggle_bookmark(
    skill_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    user = current_user or db.query(User).filter(User.username == "hieu").first()
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    existing_bm = db.query(UserBookmark).filter(
        UserBookmark.user_id == user.id,
        UserBookmark.skill_id == skill_id
    ).first()

    if existing_bm:
        db.delete(existing_bm)
        skill.is_bookmarked = False
        action_name = "unbookmark"
    else:
        new_bm = UserBookmark(user_id=user.id, skill_id=skill_id)
        db.add(new_bm)
        skill.is_bookmarked = True
        action_name = "bookmark"

    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action=action_name,
        target_type="skill",
        target_id=skill.id,
        detail={"skill_name": skill.name}
    )
    db.add(audit)
    db.commit()
    db.refresh(skill)
    return skill

# 1-Click Multi-IDE Export Endpoints
@router.get("/skills/{skill_id}/export/{target_ide}")
def export_skill_config(
    skill_id: int,
    target_ide: str,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return ExporterService.export_skill_config(skill, target_ide)

@router.get("/skills/{skill_id}/export/{target_ide}/raw")
def export_skill_config_raw(
    skill_id: int,
    target_ide: str,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    data = ExporterService.export_skill_config(skill, target_ide)
    return Response(content=data["content"], media_type="text/plain; charset=utf-8")

# AI Security Guardrail Audit Endpoint
@router.get("/skills/{skill_id}/security")
def get_skill_security_report(
    skill_id: int,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return SecurityScanner.scan_skill(skill)

@router.get("/skills/{skill_id}", response_model=SkillResponse)
def get_skill_detail(
    skill_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if current_user:
        SkillService.populate_user_bookmarks([skill], current_user.id, db)
    return skill

# AI Learning Track & Goal Recommendation Endpoint
@router.post("/skills/ai-recommend-track", response_model=AIRecommendationResponse)
async def ai_recommend_track(
    req: AIRecommendTrackRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    return await LearningTrackService.recommend_track(
        db=db,
        goal_query=req.goal_query,
        language=req.language or "vi",
        user_id=user_id,
        max_skills=req.max_skills or 8
    )
