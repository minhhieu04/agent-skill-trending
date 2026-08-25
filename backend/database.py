import logging
from sqlalchemy import create_engine, text, inspect
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

def auto_migrate_schema(eng=None):
    """
    Self-healing automated schema migration.
    Creates missing tables and adds missing columns without requiring external migration tools.
    """
    if eng is None:
        eng = engine

    # 1. Create all missing tables first
    Base.metadata.create_all(bind=eng)

    # 2. Inspect existing tables and ensure newly added columns exist
    try:
        inspector = inspect(eng)
        tables = inspector.get_table_names()
        is_pg = eng.dialect.name == 'postgresql'

        with eng.begin() as conn:
            # Check skills table for new columns
            if 'skills' in tables:
                cols = [c['name'] for c in inspector.get_columns('skills')]
                
                if 'security_rating' not in cols:
                    logger.info("Auto-migrating: adding 'security_rating' to skills...")
                    conn.execute(text("ALTER TABLE skills ADD COLUMN security_rating VARCHAR(50) DEFAULT 'safe'"))

                if 'security_score' not in cols:
                    logger.info("Auto-migrating: adding 'security_score' to skills...")
                    conn.execute(text("ALTER TABLE skills ADD COLUMN security_score FLOAT DEFAULT 95.0"))

                if 'security_flags' not in cols:
                    logger.info("Auto-migrating: adding 'security_flags' to skills...")
                    if is_pg:
                        conn.execute(text("ALTER TABLE skills ADD COLUMN security_flags JSON DEFAULT '[]'::json"))
                    else:
                        conn.execute(text("ALTER TABLE skills ADD COLUMN security_flags JSON DEFAULT '[]'"))

                if 'permission_level' not in cols:
                    logger.info("Auto-migrating: adding 'permission_level' to skills...")
                    conn.execute(text("ALTER TABLE skills ADD COLUMN permission_level VARCHAR(50) DEFAULT 'read-only'"))

        logger.info("✅ Database auto-migration & schema sync completed.")
    except Exception as e:
        logger.warning(f"Auto-migration inspection note: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
