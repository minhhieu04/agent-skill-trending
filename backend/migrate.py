#!/usr/bin/env python3
"""
Agent Skill Trending - Database Migration Runner
Can be executed as Render Pre-Deploy command, Docker entrypoint, or manual CLI.
"""
import sys
import logging
from database import engine, auto_migrate_schema, SessionLocal, Base
from models.user import User
from models.user_preference import UserPreference
from models.skill import Skill
from models.bundle import SkillBundle

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Migrate")

def run_migrations():
    logger.info("🚀 Starting database schema migrations...")
    try:
        auto_migrate_schema(engine)
        logger.info("🎉 All migrations and schema sync completed successfully!")
        return 0
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(run_migrations())
