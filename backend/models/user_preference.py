from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime
from datetime import datetime
from database import Base

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(64), default="default_user")
    
    # Filtering & Personalization Preferences
    preferred_categories = Column(JSON, default=lambda: ["coding-agent", "mcp-server", "skill-file", "prompt-engineering", "workflow-automation"])
    preferred_languages = Column(JSON, default=lambda: ["Python", "TypeScript", "JavaScript", "Go", "Rust"])
    preferred_runtimes = Column(JSON, default=lambda: ["Claude Code", "Cursor", "Gemini CLI", "Aider", "Windsurf"])
    interested_tags = Column(JSON, default=lambda: ["agent", "skills", "automation", "mcp", "llm", "code-generation"])
    
    min_stars = Column(Integer, default=50)
    min_trending_score = Column(Integer, default=20)
    only_recent_activity_days = Column(Integer, default=90) # Only show repos with updates in last 90 days
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
