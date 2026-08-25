import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from config import settings
from api.collect import run_full_collection_pipeline

logger = logging.getLogger("Scheduler")

scheduler = AsyncIOScheduler()

def start_scheduler():
    if not settings.AUTO_SCHEDULE_ENABLED:
        logger.info("Scheduler is disabled by config.")
        return

    # Schedule collection every X hours
    scheduler.add_job(
        run_full_collection_pipeline,
        trigger=IntervalTrigger(hours=settings.COLLECTION_INTERVAL_HOURS),
        id="full_collection_job",
        name="Scheduled Data Collection Pipeline",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info(f"Scheduler started. Next run in {settings.COLLECTION_INTERVAL_HOURS} hours.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
