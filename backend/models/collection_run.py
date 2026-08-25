from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from database import Base

class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id = Column(Integer, primary_key=True, index=True)
    triggered_by = Column(String(64), default="scheduler") # "scheduler", "manual", or username
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="running") # "running", "completed", "failed"
    total_new_skills = Column(Integer, default=0)
    total_updated_skills = Column(Integer, default=0)
    total_sources_scanned = Column(Integer, default=0)
    sources_summary = Column(JSON, default=dict) # breakdown per source
    summary = Column(Text, nullable=True)
    error_detail = Column(Text, nullable=True)
