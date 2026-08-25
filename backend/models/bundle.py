from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from datetime import datetime
from database import Base

class SkillBundle(Base):
    __tablename__ = "skill_bundles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(128), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(64), default="Sparkles")
    badge = Column(String(64), default="Starter Pack")
    category = Column(String(64), default="fullstack")
    target_stack = Column(String(128), default="Antigravity / Cursor / Codex")
    tags = Column(JSON, default=list)
    skill_ids = Column(JSON, default=list)
    stars_total = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
