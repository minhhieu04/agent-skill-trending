from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from datetime import datetime
from database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    username = Column(String(64), nullable=True)
    action = Column(String(64), index=True, nullable=False) # "login", "register", "bookmark", "unbookmark", "update_preferences", "trigger_collection"
    target_type = Column(String(64), nullable=True) # "skill", "user", "collection_run", "preference"
    target_id = Column(Integer, nullable=True)
    detail = Column(JSON, default=dict)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
