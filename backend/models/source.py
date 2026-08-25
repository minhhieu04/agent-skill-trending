from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from datetime import datetime
from database import Base

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, index=True, nullable=False) # e.g. "github_trending", "reddit_ai_agents", "hackernews", "awesome_lists"
    source_type = Column(String(64), nullable=False)
    target_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    last_fetched_at = Column(DateTime, nullable=True)
    last_status = Column(String(32), default="pending") # success, failed, running
    items_collected_count = Column(Integer, default=0)
    extra_meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
