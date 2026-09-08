from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float
from database import Base


class DailyDigest(Base):
    __tablename__ = "daily_digests"

    id = Column(Integer, primary_key=True, index=True)
    digest_date = Column(String(10), unique=True, index=True, nullable=False)  # YYYY-MM-DD
    title = Column(String(255), nullable=False)
    episode_number = Column(Integer, default=1)
    
    # Executive overview & podcast dialogue script
    summary_markdown = Column(Text, nullable=False)
    podcast_script = Column(Text, nullable=False)
    highlights = Column(JSON, default=list)  # List of string highlights
    
    # Audio synthesis
    podcast_audio_base64 = Column(Text, nullable=True)
    podcast_duration_sec = Column(Float, default=0.0)
    podcast_voice = Column(String(64), default="vi-VN-NamMinhNeural")
    
    # Breakdown of each skill: what it does, pain point solved, target audience, quick prompt
    skill_summaries = Column(JSON, default=list)
    total_skills_count = Column(Integer, default=0)
    
    # Metadata
    source_model = Column(String(64), default="gemini-flash")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
