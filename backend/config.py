import os
import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent Skill Trending"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8899
    
    # Database: Default SQLite for local dev, override via env for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agent_skills.db")
    
    # Auth & Security — MUST be overridden via env in production
    JWT_SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(64))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS — comma-separated origins via env, defaults to permissive for local dev
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    
    # API Keys & Credentials
    GITHUB_TOKEN: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    REDDIT_CLIENT_ID: Optional[str] = None
    REDDIT_CLIENT_SECRET: Optional[str] = None
    REDDIT_USER_AGENT: str = "AgentSkillTrendingBot/1.0"
    
    # Scheduler Settings
    COLLECTION_INTERVAL_HOURS: int = 6
    AUTO_SCHEDULE_ENABLED: bool = True
    
    # Scoring weights
    WEIGHT_STAR_VELOCITY: float = 0.30
    WEIGHT_COMMUNITY_ENGAGEMENT: float = 0.25
    WEIGHT_RECENCY: float = 0.20
    WEIGHT_QUALITY_SIGNALS: float = 0.15
    WEIGHT_FORK_RATIO: float = 0.10

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
