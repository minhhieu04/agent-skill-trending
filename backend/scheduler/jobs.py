import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from config import settings
from database import SessionLocal

logger = logging.getLogger("Scheduler")

scheduler = AsyncIOScheduler()


async def run_daily_podcast_auto_job():
    """
    Cron job triggered every morning and midday:
    1. Runs collection pipeline to get fresh trending skills.
    2. Automatically generates and synthesizes Daily Podcast digest & audio for today.
    """
    logger.info("Executing scheduled daily podcast & data collection job...")
    try:
        from api.collect import run_full_collection_pipeline
        from services.daily_digest_service import DailyDigestService

        # 1. Run collection
        await run_full_collection_pipeline(triggered_by="cron_daily_podcast")

        # 2. Auto-generate daily digest for today
        today_str = datetime.now().strftime("%Y-%m-%d")
        with SessionLocal() as db:
            digest = await DailyDigestService.generate_digest(
                db=db,
                date_str=today_str,
                force_regenerate=True
            )
            logger.info(f"Daily podcast digest auto-generated for {today_str}: '{digest.title}'")

            # 3. Pre-synthesize default Vietnamese neural audio if missing
            if not digest.podcast_audio_base64 or len(digest.podcast_audio_base64) < 1000:
                try:
                    await DailyDigestService.synthesize_podcast_audio(
                        db=db,
                        date_str=today_str,
                        voice="vi-VN-NamMinhNeural",
                        rate="+5%",
                        force_regenerate=False
                    )
                    logger.info(f"Daily podcast audio pre-synthesized for {today_str}.")
                except Exception as audio_err:
                    logger.warning(f"Could not pre-synthesize audio in cron job: {audio_err}")

    except Exception as e:
        logger.error(f"Error in scheduled daily podcast cron job: {e}")


def start_scheduler():
    if not settings.AUTO_SCHEDULE_ENABLED:
        logger.info("Scheduler is disabled by config.")
        return

    from api.collect import run_full_collection_pipeline

    # 1. Periodic data collection interval (every X hours, default 6)
    scheduler.add_job(
        run_full_collection_pipeline,
        trigger=IntervalTrigger(hours=settings.COLLECTION_INTERVAL_HOURS),
        id="full_collection_job",
        name="Scheduled Data Collection Pipeline",
        replace_existing=True
    )

    # 2. Morning Cron at 06:30 AM (Daily fresh morning podcast edition)
    scheduler.add_job(
        run_daily_podcast_auto_job,
        trigger=CronTrigger(hour=6, minute=30),
        id="daily_podcast_morning_cron",
        name="Daily Morning Podcast & Data Refresh",
        replace_existing=True
    )

    # 3. Midday Cron at 12:30 PM (Midday tech radar update)
    scheduler.add_job(
        run_daily_podcast_auto_job,
        trigger=CronTrigger(hour=12, minute=30),
        id="daily_podcast_noon_cron",
        name="Daily Noon Podcast & Data Refresh",
        replace_existing=True
    )

    scheduler.start()
    logger.info(
        f"Scheduler started with Interval ({settings.COLLECTION_INTERVAL_HOURS}h) "
        f"and Daily Podcast Cron (06:30 & 12:30)."
    )


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
