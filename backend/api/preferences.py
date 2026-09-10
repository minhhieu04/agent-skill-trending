from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from database import get_db
from models.user_preference import UserPreference
from models.user import User
from models.audit_log import AuditLog
from middleware.auth import get_optional_current_user, get_current_user
from middleware.ip_helper import get_client_ip

router = APIRouter(prefix="/preferences", tags=["User Preferences"])

class PreferenceSchema(BaseModel):
    user_name: Optional[str] = None
    preferred_categories: List[str]
    preferred_languages: List[str]
    preferred_runtimes: List[str]
    interested_tags: List[str]
    min_stars: int = 50
    min_trending_score: int = 20
    only_recent_activity_days: int = 90

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=PreferenceSchema)
def get_user_preferences(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if current_user:
        pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
        if not pref:
            pref = UserPreference(
                user_id=current_user.id,
                user_name=current_user.display_name,
                preferred_categories=["coding-agent", "mcp-server", "skill-file", "prompt-engineering", "workflow-automation"],
                preferred_languages=["Python", "TypeScript", "JavaScript", "Go", "Rust"],
                preferred_runtimes=["Claude Code", "Cursor", "Gemini CLI", "Aider", "Windsurf"],
                interested_tags=["agent", "skills", "automation", "mcp", "llm", "tools"]
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref
    
    # Return stateless default preferences for anonymous visitors without binding to any DB user
    return PreferenceSchema(
        user_name=None,
        preferred_categories=["coding-agent", "mcp-server", "skill-file", "prompt-engineering", "workflow-automation"],
        preferred_languages=["Python", "TypeScript", "JavaScript", "Go", "Rust"],
        preferred_runtimes=["Claude Code", "Cursor", "Gemini CLI", "Aider", "Windsurf"],
        interested_tags=["agent", "skills", "automation", "mcp", "llm", "tools"],
        min_stars=50,
        min_trending_score=20,
        only_recent_activity_days=90
    )

@router.put("", response_model=PreferenceSchema)
def update_user_preferences(
    data: PreferenceSchema,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
    
    pref.user_name = data.user_name or current_user.display_name
    pref.preferred_categories = data.preferred_categories
    pref.preferred_languages = data.preferred_languages
    pref.preferred_runtimes = data.preferred_runtimes
    pref.interested_tags = data.interested_tags
    pref.min_stars = data.min_stars
    pref.min_trending_score = data.min_trending_score
    pref.only_recent_activity_days = data.only_recent_activity_days

    client_ip = get_client_ip(request)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="update_preferences",
        target_type="preference",
        target_id=pref.id,
        detail={"categories": pref.preferred_categories, "runtimes": pref.preferred_runtimes},
        ip_address=client_ip
    )
    db.add(audit)

    db.commit()
    db.refresh(pref)
    return pref

