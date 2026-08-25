from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func, cast, String
from typing import List, Optional, Dict, Any
from models.skill import Skill
from models.user import User
from models.user_preference import UserPreference
from models.user_bookmark import UserBookmark
from models.audit_log import AuditLog
from analyzer.relevance import RelevanceMatcher

class SkillService:
    @staticmethod
    def populate_user_bookmarks(skills: List[Skill], user_id: Optional[int], db: Session):
        if not user_id:
            return
        bookmarked_ids = set(
            r[0] for r in db.query(UserBookmark.skill_id).filter(UserBookmark.user_id == user_id).all()
        )
        for s in skills:
            s.is_bookmarked = s.id in bookmarked_ids

    @staticmethod
    def get_trending_skills(
        db: Session,
        category: Optional[str] = None,
        runtime: Optional[str] = None,
        language: Optional[str] = None,
        search: Optional[str] = None,
        min_score: float = 0.0,
        sort_by: str = "trending_score",
        limit: int = 50,
        offset: int = 0,
        user_id: Optional[int] = None
    ) -> List[Skill]:
        query = db.query(Skill)

        if category and category != "all":
            query = query.filter(Skill.category == category)

        if language and language != "all":
            query = query.filter(Skill.primary_language == language)

        if runtime and runtime != "all":
            # Database-level filtering for JSON array (Compatible with SQLite and PostgreSQL)
            query = query.filter(cast(Skill.runtimes, String).ilike(f'%"{runtime}"%'))

        if min_score > 0:
            query = query.filter(Skill.trending_score >= min_score)

        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    Skill.name.ilike(search_fmt),
                    Skill.title.ilike(search_fmt),
                    Skill.description.ilike(search_fmt),
                    Skill.author.ilike(search_fmt),
                    Skill.target_audience.ilike(search_fmt),
                    cast(Skill.tags, String).ilike(search_fmt)
                )
            )

        # Ordering
        if sort_by == "stars":
            query = query.order_by(desc(Skill.stars))
        elif sort_by == "quality_score":
            query = query.order_by(desc(Skill.quality_score))
        elif sort_by == "created_at":
            query = query.order_by(desc(Skill.created_at))
        else:
            query = query.order_by(desc(Skill.trending_score))

        skills = query.offset(offset).limit(limit).all()

        if user_id:
            SkillService.populate_user_bookmarks(skills, user_id, db)

        return skills

    @staticmethod
    def get_personalized_skills(
        db: Session,
        user: Optional[User] = None,
        limit: int = 30
    ) -> List[Skill]:
        pref = None
        if user:
            pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
        if not pref:
            pref = db.query(UserPreference).first()

        # Efficient Candidate pre-filtering at DB level instead of loading entire table
        candidate_query = db.query(Skill)
        if pref and pref.preferred_categories:
            # Query items from preferred categories or high trending score
            candidate_query = candidate_query.filter(
                or_(
                    Skill.category.in_(pref.preferred_categories),
                    Skill.trending_score >= (pref.min_trending_score or 20)
                )
            )
        
        candidates = candidate_query.order_by(desc(Skill.trending_score)).limit(limit * 3).all()

        for s in candidates:
            item_dict = {
                "category": s.category,
                "primary_language": s.primary_language,
                "runtimes": s.runtimes or [],
                "tags": s.tags or [],
                "stars": s.stars
            }
            s.relevance_score = RelevanceMatcher.calculate_relevance(item_dict, pref)

        # Sort by combined score
        candidates.sort(key=lambda x: (x.relevance_score * 0.6 + x.trending_score * 0.4), reverse=True)
        selected = candidates[:limit]

        if user:
            SkillService.populate_user_bookmarks(selected, user.id, db)

        return selected

    @staticmethod
    def compare_skills(
        db: Session,
        skill_ids: List[int],
        user_id: Optional[int] = None
    ) -> List[Skill]:
        if not skill_ids:
            return []
        skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
        if user_id:
            SkillService.populate_user_bookmarks(skills, user_id, db)
        return skills
