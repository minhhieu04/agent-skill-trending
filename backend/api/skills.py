from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from database import get_db
from models.skill import Skill
from models.user_preference import UserPreference
from analyzer.relevance import RelevanceMatcher

router = APIRouter(prefix="/skills", tags=["Skills"])

class SkillResponse(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    repository_url: str
    author: Optional[str] = None
    description: Optional[str] = None
    ai_summary: Optional[str] = None
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
    is_featured: bool
    is_bookmarked: bool
    source_type: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StatsResponse(BaseModel):
    total_skills: int
    categories_count: Dict[str, int]
    runtimes_count: Dict[str, int]
    languages_count: Dict[str, int]
    total_stars: int
    bookmarked_count: int

@router.get("/trending", response_model=List[SkillResponse])
def get_trending_skills(
    category: Optional[str] = Query(None, description="Filter by category"),
    runtime: Optional[str] = Query(None, description="Filter by runtime (e.g. Cursor, Claude Code)"),
    language: Optional[str] = Query(None, description="Filter by programming language"),
    search: Optional[str] = Query(None, description="Search term in name, description, tags"),
    min_score: Optional[float] = Query(0.0, description="Minimum trending score"),
    sort_by: Optional[str] = Query("trending_score", description="Sort field: trending_score, stars, quality_score, created_at"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Skill)
    
    if category and category != "all":
        query = query.filter(Skill.category == category)
        
    if language and language != "all":
        query = query.filter(Skill.primary_language == language)
        
    if min_score > 0:
        query = query.filter(Skill.trending_score >= min_score)
        
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Skill.name.ilike(search_fmt),
                Skill.title.ilike(search_fmt),
                Skill.description.ilike(search_fmt),
                Skill.author.ilike(search_fmt)
            )
        )
        
    # Order by
    if sort_by == "stars":
        query = query.order_by(desc(Skill.stars))
    elif sort_by == "quality_score":
        query = query.order_by(desc(Skill.quality_score))
    elif sort_by == "created_at":
        query = query.order_by(desc(Skill.created_at))
    else:
        query = query.order_by(desc(Skill.trending_score))

    skills = query.offset(offset).limit(limit).all()
    
    # Filter in-memory for runtime if specified (stored as JSON array)
    if runtime and runtime != "all":
        skills = [s for s in skills if s.runtimes and runtime in s.runtimes]
        
    return skills

@router.get("/personalized", response_model=List[SkillResponse])
def get_personalized_skills(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    pref = db.query(UserPreference).first()
    if not pref:
        pref = UserPreference()
        db.add(pref)
        db.commit()
        db.refresh(pref)

    skills = db.query(Skill).all()
    for s in skills:
        item_dict = {
            "category": s.category,
            "primary_language": s.primary_language,
            "runtimes": s.runtimes or [],
            "tags": s.tags or [],
            "stars": s.stars
        }
        s.relevance_score = RelevanceMatcher.calculate_relevance(item_dict, pref)
        
    skills.sort(key=lambda x: (x.relevance_score * 0.6 + x.trending_score * 0.4), reverse=True)
    return skills[:limit]

@router.get("/bookmarked", response_model=List[SkillResponse])
def get_bookmarked_skills(db: Session = Depends(get_db)):
    return db.query(Skill).filter(Skill.is_bookmarked == True).order_by(desc(Skill.updated_at)).all()

@router.post("/{skill_id}/bookmark", response_model=SkillResponse)
def toggle_bookmark(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill.is_bookmarked = not skill.is_bookmarked
    db.commit()
    db.refresh(skill)
    return skill

@router.get("/stats", response_model=StatsResponse)
def get_skills_stats(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    total_skills = len(skills)
    total_stars = sum(s.stars for s in skills)
    bookmarked_count = sum(1 for s in skills if s.is_bookmarked)
    
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

@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill_detail(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill
