from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Cuộc trò chuyện mới")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    # Relationships
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )
    user = relationship("User", backref="chat_sessions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    
    # Rich structured attributes for RAG
    recommended_skills = Column(JSON, default=list, nullable=True)
    suggested_followups = Column(JSON, default=list, nullable=True)
    retrieval_stats = Column(JSON, default=dict, nullable=True)
    model_used = Column(String(64), nullable=True)
    is_ai_powered = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
