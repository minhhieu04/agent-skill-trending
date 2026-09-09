from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
import re
import logging

logger = logging.getLogger("SkillsAPI")

from database import get_db
from models.skill import Skill
from models.user import User
from models.user_bookmark import UserBookmark
from models.audit_log import AuditLog
from middleware.auth import get_optional_current_user, get_current_user
from middleware.ip_helper import get_client_ip

from services.skill_service import SkillService
from services.exporter_service import ExporterService
from services.security_scanner import SecurityScanner
from services.learning_track_service import LearningTrackService
from services.readme_service import ReadmeService, SUPPORTED_LANGUAGES
from config import settings

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
    readme_translations: Optional[Dict[str, Any]] = {}
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

class TranslateReadmeRequest(BaseModel):
    target_language: str = "vi"
    preferred_provider: Optional[str] = "auto"
    force_refresh: bool = False

class ReadmeResponse(BaseModel):
    skill_id: int
    readme: str
    is_fallback: bool
    translations: Dict[str, Any] = {}
    source: str

class TranslateReadmeResponse(BaseModel):
    skill_id: int
    target_language: str
    translated_text: str
    provider: str
    model_used: str
    cached: bool

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
        bookmarked_count = 0

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
    if not current_user:
        return []
    bms = db.query(UserBookmark).filter(UserBookmark.user_id == current_user.id).all()
    skill_ids = [b.skill_id for b in bms]
    skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
    for s in skills:
        s.is_bookmarked = True
    return skills

@router.post("/skills/{skill_id}/bookmark", response_model=SkillResponse)
def toggle_bookmark(
    skill_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    client_ip = get_client_ip(request)

    existing_bm = db.query(UserBookmark).filter(
        UserBookmark.user_id == current_user.id,
        UserBookmark.skill_id == skill_id
    ).first()

    if existing_bm:
        db.delete(existing_bm)
        skill.is_bookmarked = False
        action_name = "unbookmark"
    else:
        new_bm = UserBookmark(user_id=current_user.id, skill_id=skill_id)
        db.add(new_bm)
        skill.is_bookmarked = True
        action_name = "bookmark"

    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action=action_name,
        target_type="skill",
        target_id=skill.id,
        detail={"skill_name": skill.name},
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()
    db.refresh(skill)
    return skill


# List available translation providers and live status
@router.get("/skills/translation-providers")
async def get_translation_providers():
    return await ReadmeService.get_available_providers()

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
async def get_skill_detail(
    skill_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    SkillService.ensure_enriched(skill)

    # Auto-fetch real README from GitHub if missing or placeholder
    is_placeholder = (
        not skill.readme_preview
        or len(skill.readme_preview.strip()) < 100
        or (skill.readme_preview.startswith("# " + (skill.title or skill.name)) and "Xem thêm chi tiết" in skill.readme_preview)
    )
    if is_placeholder and skill.repository_url:
        try:
            fetched_readme = await ReadmeService.fetch_github_readme(skill.repository_url)
            if fetched_readme:
                skill.readme_preview = fetched_readme
                skill.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(skill)
        except Exception as e:
            pass

    # Auto-translate CJK/foreign summary to natural Vietnamese
    cjk_regex = re.compile(r"[\u4e00-\u9fff]")
    text_to_check = skill.ai_summary or skill.description or ""
    if text_to_check and cjk_regex.search(text_to_check):
        try:
            vi_summary = await ReadmeService.translate_summary_to_vietnamese(text_to_check, name=skill.name)
            if vi_summary and not cjk_regex.search(vi_summary):
                skill.ai_summary = vi_summary
                skill.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(skill)
        except Exception as trans_err:
            logger.warning(f"Could not auto-translate CJK summary for skill {skill_id}: {trans_err}")

    if current_user:
        SkillService.populate_user_bookmarks([skill], current_user.id, db)
    return skill

# Quick on-demand summary translation endpoint
@router.post("/skills/{skill_id}/summary/translate")
async def translate_skill_summary(
    skill_id: int,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    cjk_regex = re.compile(r"[\u4e00-\u9fff]")
    text_to_check = skill.description or skill.ai_summary or ""
    vi_summary = await ReadmeService.translate_summary_to_vietnamese(text_to_check, name=skill.name)
    if vi_summary and not cjk_regex.search(vi_summary):
        skill.ai_summary = vi_summary
        skill.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(skill)
    return {"skill_id": skill.id, "ai_summary": skill.ai_summary}

# Official GitHub README retrieval
@router.get("/skills/{skill_id}/readme", response_model=ReadmeResponse)
async def get_skill_readme(
    skill_id: int,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    source = "db"
    is_placeholder = (
        not skill.readme_preview
        or len(skill.readme_preview.strip()) < 100
        or (skill.readme_preview.startswith("# " + (skill.title or skill.name)) and "Xem thêm chi tiết" in skill.readme_preview)
    )
    if is_placeholder and skill.repository_url:
        fetched_readme = await ReadmeService.fetch_github_readme(skill.repository_url)
        if fetched_readme:
            skill.readme_preview = fetched_readme
            skill.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(skill)
            source = "github"

    readme_content = (
        skill.readme_preview
        or f"# {skill.title or skill.name}\n\n{skill.description or 'No description available.'}\n\nXem thêm chi tiết tại: {skill.repository_url}"
    )
    is_fallback = not bool(skill.readme_preview)

    return {
        "skill_id": skill.id,
        "readme": readme_content,
        "is_fallback": is_fallback,
        "translations": skill.readme_translations or {},
        "source": source
    }

# Force refresh README from GitHub
@router.post("/skills/{skill_id}/readme/refresh", response_model=ReadmeResponse)
async def refresh_skill_readme(
    skill_id: int,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if not skill.repository_url:
        raise HTTPException(status_code=400, detail="Skill has no repository URL")
    
    fetched = await ReadmeService.fetch_github_readme(skill.repository_url)
    if not fetched:
        raise HTTPException(status_code=404, detail="Could not fetch README from GitHub repository")
    
    skill.readme_preview = fetched
    skill.updated_at = datetime.utcnow()
    # Reset cached translations because base README changed
    skill.readme_translations = {}
    db.commit()
    db.refresh(skill)

    return {
        "skill_id": skill.id,
        "readme": skill.readme_preview,
        "is_fallback": False,
        "translations": {},
        "source": "github_refresh"
    }

# AI Multi-Tier README Translation
@router.post("/skills/{skill_id}/readme/translate", response_model=TranslateReadmeResponse)
async def translate_skill_readme(
    skill_id: int,
    payload: TranslateReadmeRequest,
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    target_lang = (payload.target_language or "vi").lower()
    pref_provider = (payload.preferred_provider or "auto").lower()
    translations = skill.readme_translations or {}

    # Check cache if not forcing refresh
    if not payload.force_refresh and target_lang in translations:
        cached_entry = translations[target_lang]
        cached_model = str(cached_entry.get("model_used", "")).lower()
        cached_provider = str(cached_entry.get("provider", "")).lower()

        # If cache is from degraded translation_engine, but user requested auto or an AI provider,
        # check if real AI is available and upgrade rather than serving degraded cache
        has_ollama, _ = await ReadmeService.check_ollama_status()
        ai_available = bool(settings.GEMINI_API_KEY) or has_ollama

        if cached_provider == "translation_engine" and pref_provider in ("auto", "local_llm", "gemini") and ai_available:
            provider_matches = False
        else:
            provider_matches = (
                pref_provider == "auto"
                or (pref_provider == "local_llm" and cached_provider == "local_llm")
                or (pref_provider == "translation_engine" and cached_provider == "translation_engine")
                or ((pref_provider == "gemini" or pref_provider.startswith("gemini")) and (cached_provider == "gemini" or pref_provider in cached_model))
            )

        if provider_matches and cached_entry.get("content"):
            return {
                "skill_id": skill.id,
                "target_language": target_lang,
                "translated_text": cached_entry.get("content", ""),
                "provider": cached_entry.get("provider", "cache"),
                "model_used": cached_entry.get("model_used", "cache"),
                "cached": True
            }

    # Ensure authentic README content
    content_to_translate = skill.readme_preview
    if not content_to_translate or len(content_to_translate.strip()) < 100:
        if skill.repository_url:
            fetched = await ReadmeService.fetch_github_readme(skill.repository_url)
            if fetched:
                skill.readme_preview = fetched
                content_to_translate = fetched

    if not content_to_translate:
        content_to_translate = f"# {skill.title or skill.name}\n\n{skill.description or ''}"

    res = await ReadmeService.translate_markdown_content(
        content=content_to_translate,
        target_lang=target_lang,
        preferred_provider=pref_provider,
    )

    if not res.get("success"):
        raise HTTPException(
            status_code=500,
            detail=res.get("error") or "Không thể hoàn thành dịch thuật với mô hình đã chọn."
        )

    # Persist in DB only on genuine success
    new_translations = dict(skill.readme_translations or {})
    new_translations[target_lang] = {
        "content": res.get("translated_text"),
        "provider": res.get("provider"),
        "model_used": res.get("model_used"),
        "translated_at": datetime.utcnow().isoformat()
    }
    skill.readme_translations = new_translations
    db.commit()
    db.refresh(skill)

    return {
        "skill_id": skill.id,
        "target_language": target_lang,
        "translated_text": res.get("translated_text"),
        "provider": res.get("provider"),
        "model_used": res.get("model_used"),
        "cached": False
    }

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
