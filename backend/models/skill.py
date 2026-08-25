from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean
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
    ai_summary = Column(Text, nullable=True) # AI generated concise summary
    
    # Categorization & taxonomy
    category = Column(String(64), index=True, default="uncategorized") # coding-agent, mcp-server, skill-file, prompt-engineering, etc.
    tags = Column(JSON, default=list) # e.g. ["cursor", "claude-code", "gemini", "automation"]
    runtimes = Column(JSON, default=list) # e.g. ["Cursor", "Claude Code", "Gemini CLI", "Aider"]
    difficulty = Column(String(32), default="intermediate") # beginner, intermediate, advanced
    primary_language = Column(String(64), nullable=True) # Python, TypeScript, etc.
    
    # Community & Quality Metrics
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    star_velocity_7d = Column(Float, default=0.0) # stars gained per day/week
    
    # Social & Discussion signals
    reddit_mentions = Column(Integer, default=0)
    hackernews_mentions = Column(Integer, default=0)
    reddit_score = Column(Integer, default=0)
    hackernews_score = Column(Integer, default=0)
    
    # Computed Scoring
    quality_score = Column(Float, default=0.0) # 0 to 100
    trending_score = Column(Float, default=0.0, index=True) # 0 to 100 composite score
    relevance_score = Column(Float, default=0.0) # personalized score based on user preferences
    
    # Meta
    is_featured = Column(Boolean, default=False)
    is_bookmarked = Column(Boolean, default=False)
    source_type = Column(String(64), default="github") # github_trending, github_search, awesome_list, reddit, hackernews
    last_pushed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
