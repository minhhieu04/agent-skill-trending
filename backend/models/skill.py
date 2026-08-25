from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean, Index
from datetime import datetime
from database import Base

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    title = Column(String(255), nullable=True)
    repository_url = Column(String(512), unique=True, index=True, nullable=False)
    author = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    
    # Rich explanation, visual & comparison fields
    use_cases = Column(JSON, default=list)
    comparison_notes = Column(Text, nullable=True)
    target_audience = Column(String(128), default="Fullstack Developers")
    readme_preview = Column(Text, nullable=True)
    demo_url = Column(String(512), nullable=True)
    
    # Categorization & taxonomy
    category = Column(String(64), index=True, default="uncategorized")
    tags = Column(JSON, default=list)
    runtimes = Column(JSON, default=list)
    difficulty = Column(String(32), default="intermediate")
    primary_language = Column(String(64), index=True, nullable=True)
    
    # Community & Quality Metrics
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    star_velocity_7d = Column(Float, default=0.0)
    
    # Social & Discussion signals
    reddit_mentions = Column(Integer, default=0)
    hackernews_mentions = Column(Integer, default=0)
    reddit_score = Column(Integer, default=0)
    hackernews_score = Column(Integer, default=0)
    
    # Computed Scoring
    quality_score = Column(Float, default=0.0)
    trending_score = Column(Float, default=0.0, index=True)
    relevance_score = Column(Float, default=0.0)
    
    # Security & Guardrail Audit
    security_rating = Column(String(32), default="safe")
    security_score = Column(Float, default=95.0)
    security_flags = Column(JSON, default=list)
    permission_level = Column(String(64), default="read_only")
    
    # Meta
    is_featured = Column(Boolean, default=False)
    is_bookmarked = Column(Boolean, default=False)
    source_type = Column(String(64), default="github")
    last_pushed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_skills_cat_trending", "category", "trending_score"),
        Index("ix_skills_lang_trending", "primary_language", "trending_score"),
    )
