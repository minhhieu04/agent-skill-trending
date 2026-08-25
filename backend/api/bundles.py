from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from database import get_db
from models.bundle import SkillBundle
from models.skill import Skill
from models.user import User
from models.user_bookmark import UserBookmark
from models.audit_log import AuditLog
from middleware.auth import get_optional_current_user
from services.skill_service import SkillService
from services.exporter_service import ExporterService

router = APIRouter(prefix="/bundles", tags=["Bundles"])

class BundleResponse(BaseModel):
    id: int
    slug: str
    name: str
    title: str
    description: str
    icon: str
    badge: str
    category: str
    target_stack: str
    tags: List[str]
    skill_ids: List[int]
    stars_total: int
    created_at: datetime
    skills: List[Dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[BundleResponse])
def get_bundles(db: Session = Depends(get_db)):
    bundles = db.query(SkillBundle).all()
    results = []
    for b in bundles:
        # Resolve skill previews
        skills_in_b = db.query(Skill).filter(Skill.id.in_(b.skill_ids or [])).all()
        b_dict = {
            "id": b.id,
            "slug": b.slug,
            "name": b.name,
            "title": b.title,
            "description": b.description,
            "icon": b.icon,
            "badge": b.badge,
            "category": b.category,
            "target_stack": b.target_stack,
            "tags": b.tags or [],
            "skill_ids": b.skill_ids or [],
            "stars_total": sum(s.stars for s in skills_in_b) or b.stars_total,
            "created_at": b.created_at,
            "skills": [
                {
                    "id": s.id,
                    "name": s.name,
                    "title": s.title or s.name,
                    "category": s.category,
                    "stars": s.stars,
                    "trending_score": s.trending_score,
                    "primary_language": s.primary_language
                }
                for s in skills_in_b
            ]
        }
        results.append(b_dict)
    return results

@router.get("/{slug}", response_model=BundleResponse)
def get_bundle_by_slug(slug: str, db: Session = Depends(get_db)):
    bundle = db.query(SkillBundle).filter(SkillBundle.slug == slug).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
        
    skills_in_b = db.query(Skill).filter(Skill.id.in_(bundle.skill_ids or [])).all()
    return {
        "id": bundle.id,
        "slug": bundle.slug,
        "name": bundle.name,
        "title": bundle.title,
        "description": bundle.description,
        "icon": bundle.icon,
        "badge": bundle.badge,
        "category": bundle.category,
        "target_stack": bundle.target_stack,
        "tags": bundle.tags or [],
        "skill_ids": bundle.skill_ids or [],
        "stars_total": sum(s.stars for s in skills_in_b),
        "created_at": bundle.created_at,
        "skills": [
            {
                "id": s.id,
                "name": s.name,
                "title": s.title or s.name,
                "category": s.category,
                "stars": s.stars,
                "trending_score": s.trending_score,
                "primary_language": s.primary_language
            }
            for s in skills_in_b
        ]
    }

@router.post("/{slug}/bookmark-all")
def bookmark_all_in_bundle(
    slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    bundle = db.query(SkillBundle).filter(SkillBundle.slug == slug).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
        
    user = current_user or db.query(User).filter(User.username == "hieu").first()
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    added = 0
    for sid in (bundle.skill_ids or []):
        exists = db.query(UserBookmark).filter(
            UserBookmark.user_id == user.id,
            UserBookmark.skill_id == sid
        ).first()
        if not exists:
            db.add(UserBookmark(user_id=user.id, skill_id=sid))
            added += 1
            
    db.add(AuditLog(
        user_id=user.id,
        username=user.username,
        action="bookmark_bundle",
        target_type="bundle",
        target_id=bundle.id,
        detail={"bundle_slug": slug, "skills_added": added}
    ))
    db.commit()
    return {"message": f"Successfully bookmarked {added} skills from bundle {bundle.title}", "added_count": added}

@router.get("/{slug}/export/{target_ide}")
def export_bundle_config(
    slug: str,
    target_ide: str,
    db: Session = Depends(get_db)
):
    bundle = db.query(SkillBundle).filter(SkillBundle.slug == slug).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
        
    skills = db.query(Skill).filter(Skill.id.in_(bundle.skill_ids or [])).all()
    exported_skills = [ExporterService.export_skill_config(s, target_ide) for s in skills]
    
    combined_content = f"# Tech Stack Starter Pack: {bundle.title}\n# Target Stack: {bundle.target_stack}\n# Description: {bundle.description}\n\n"
    for exp in exported_skills:
        combined_content += f"\n--- \n### Skill: {exp['file_path']}\n\n{exp['content']}\n"
        
    return {
        "bundle_slug": slug,
        "bundle_title": bundle.title,
        "target_ide": target_ide,
        "skills_count": len(skills),
        "exported_files": exported_skills,
        "combined_content": combined_content.strip()
    }
