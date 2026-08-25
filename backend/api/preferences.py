from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from database import get_db
from models.user_preference import UserPreference

router = APIRouter(prefix="/preferences", tags=["User Preferences"])

class PreferenceSchema(BaseModel):
    user_name: Optional[str] = "Hiếu"
    preferred_categories: List[str]
    preferred_languages: List[str]
    preferred_runtimes: List[str]
    interested_tags: List[str]
    min_stars: int = 50
    min_trending_score: int = 20
    only_recent_activity_days: int = 90

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=PreferenceSchema)
def get_user_preferences(db: Session = Depends(get_db)):
    pref = db.query(UserPreference).first()
    if not pref:
        pref = UserPreference(
            user_name="Hiếu",
            preferred_categories=["coding-agent", "mcp-server", "skill-file", "prompt-engineering", "workflow-automation"],
            preferred_languages=["Python", "TypeScript", "JavaScript", "Go", "Rust"],
            preferred_runtimes=["Claude Code", "Cursor", "Gemini CLI", "Aider", "Windsurf"],
            interested_tags=["agent", "skills", "automation", "mcp", "llm", "tools"]
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@router.put("", response_model=PreferenceSchema)
def update_user_preferences(data: PreferenceSchema, db: Session = Depends(get_db)):
    pref = db.query(UserPreference).first()
    if not pref:
        pref = UserPreference()
        db.add(pref)
    
    pref.user_name = data.user_name or "Hiếu"
    pref.preferred_categories = data.preferred_categories
    pref.preferred_languages = data.preferred_languages
    pref.preferred_runtimes = data.preferred_runtimes
    pref.interested_tags = data.interested_tags
    pref.min_stars = data.min_stars
    pref.min_trending_score = data.min_trending_score
    pref.only_recent_activity_days = data.only_recent_activity_days

    db.commit()
    db.refresh(pref)
    return pref
