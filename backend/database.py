import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

logger = logging.getLogger("Database")

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("sqlite"):
            return create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            # Try PostgreSQL
            eng = create_engine(db_url, pool_pre_ping=True)
            with eng.connect() as conn:
                pass
            return eng
    except Exception as e:
        logger.warning(f"Could not connect to primary database ({db_url}): {e}. Falling back to SQLite for local development.")
        return create_engine("sqlite:///./agent_skills.db", connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
