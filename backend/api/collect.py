import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models.skill import Skill
from models.source import DataSource
from models.user_preference import UserPreference
from models.collection_run import CollectionRun
from models.audit_log import AuditLog
from models.user import User
from middleware.auth import get_optional_current_user
from collectors import (
    GitHubCollector,
    RedditCollector,
    HackerNewsCollector,
    AwesomeListCollector,
    BaseCollector
)
from collectors.github_collector import QuotaExceededError
from analyzer import Scorer, Categorizer, RelevanceMatcher

logger = logging.getLogger("CollectPipeline")

router = APIRouter(prefix="/collect", tags=["Data Collection"])

async def _fetch_single_collector(collector: BaseCollector) -> Dict[str, Any]:
    """Helper to safely fetch items from a single collector with strict 15s timeout."""
    try:
        items = await asyncio.wait_for(collector.collect(), timeout=15.0)
        return {"name": collector.name, "status": "success", "items": items, "error": None}
    except asyncio.TimeoutError:
        logger.warning(f"Collector '{collector.name}' timed out after 15s.")
        return {"name": collector.name, "status": "failed", "items": [], "error": "Timeout after 15s"}
    except Exception as e:
        logger.error(f"Collector '{collector.name}' failed: {e}")
        return {"name": collector.name, "status": "failed", "items": [], "error": str(e)}

async def run_full_collection_pipeline(triggered_by: str = "scheduler", user_id: Optional[int] = None):
    """
    High-performance parallel data collection pipeline using asyncio.gather.
    Saves results to DB safely with per-item isolation, calculates scores, and records CollectionRun & AuditLog.
    """
    db = SessionLocal()
    
    run_entry = CollectionRun(
        triggered_by=triggered_by,
        started_at=datetime.utcnow(),
        status="running",
        total_sources_scanned=4
    )
    db.add(run_entry)
    db.commit()
    db.refresh(run_entry)
    run_id = run_entry.id

    total_new = 0
    total_updated = 0
    sources_summary = {}

    try:
        collectors = [
            GitHubCollector(),
            AwesomeListCollector(),
            RedditCollector(),
            HackerNewsCollector(),
        ]
        
        pref = db.query(UserPreference).first()

        # Update all data sources to 'running'
        for col in collectors:
            s_rec = db.query(DataSource).filter(DataSource.name == col.name).first()
            if not s_rec:
                s_rec = DataSource(name=col.name, source_type=col.name)
                db.add(s_rec)
            s_rec.last_status = "running"
        db.commit()

        # Parallel asynchronous execution of all collectors with hard timeout
        raw_results = await asyncio.gather(*[_fetch_single_collector(c) for c in collectors], return_exceptions=True)

        for i, res in enumerate(raw_results):
            is_quota = False
            if isinstance(res, QuotaExceededError):
                col_name = res.source
                status_str = "quota_exceeded"
                items = []
                err = res.reason
                is_quota = True
                # Write dedicated quota AuditLog
                try:
                    quota_audit = AuditLog(
                        user_id=user_id,
                        username=triggered_by,
                        action="quota_exceeded",
                        target_type="data_source",
                        detail={
                            "source": res.source,
                            "reason": res.reason,
                            "retry_after": res.retry_after,
                            "run_id": run_id
                        }
                    )
                    db.add(quota_audit)
                    db.commit()
                    logger.warning(f"[AUDIT] Quota exceeded for source={res.source}: {res.reason}")
                except Exception:
                    db.rollback()
            elif isinstance(res, Exception) or not isinstance(res, dict):
                col_name = collectors[i].name if i < len(collectors) else "unknown"
                status_str = "failed"
                items = []
                err = str(res)
            else:
                col_name = res.get("name", "unknown")
                status_str = res.get("status", "failed")
                items = res.get("items", [])
                err = res.get("error")

            source_rec = db.query(DataSource).filter(DataSource.name == col_name).first()
            source_new = 0
            source_upd = 0

            if status_str == "success":
                for item in items:
                    repo_url = item.get("repository_url")
                    if not repo_url:
                        continue

                    try:
                        cat_res = Categorizer.rule_based_categorize(
                            name=item.get("name", ""),
                            desc=item.get("description", ""),
                            tags=item.get("tags", [])
                        )

                        category = cat_res["category"]
                        difficulty = cat_res["difficulty"]
                        ai_summary = cat_res["ai_summary"]

                        quality_score = Scorer.calculate_quality_score(item)
                        trending_score = Scorer.calculate_trending_score(item, quality_score)
                        
                        relevance_dict = {
                            "category": category,
                            "primary_language": item.get("primary_language"),
                            "runtimes": item.get("runtimes", []),
                            "tags": item.get("tags", []),
                            "stars": item.get("stars", 0)
                        }
                        relevance_score = RelevanceMatcher.calculate_relevance(relevance_dict, pref) if pref else 50.0

                        existing = db.query(Skill).filter(Skill.repository_url == repo_url).first()
                        if existing:
                            if item.get("stars", 0) > 0:
                                existing.stars = item.get("stars", 0)
                            if item.get("forks", 0) > 0:
                                existing.forks = item.get("forks", 0)
                            if item.get("open_issues", 0) > 0:
                                existing.open_issues = item.get("open_issues", 0)
                            
                            existing.reddit_mentions += item.get("reddit_mentions", 0)
                            existing.hackernews_mentions += item.get("hackernews_mentions", 0)
                            existing.reddit_score += item.get("reddit_score", 0)
                            existing.hackernews_score += item.get("hackernews_score", 0)
                            
                            existing.tags = list(set((existing.tags or []) + (item.get("tags") or [])))
                            existing.runtimes = list(set((existing.runtimes or []) + (item.get("runtimes") or [])))
                            
                            existing.quality_score = max(existing.quality_score, quality_score)
                            existing.trending_score = max(existing.trending_score, trending_score)
                            existing.relevance_score = relevance_score
                            existing.updated_at = datetime.utcnow()
                            db.commit()
                            total_updated += 1
                            source_upd += 1
                        else:
                            new_skill = Skill(
                                name=item.get("name"),
                                title=item.get("title") or item.get("name"),
                                repository_url=repo_url,
                                author=item.get("author"),
                                description=item.get("description"),
                                ai_summary=ai_summary,
                                category=category,
                                tags=item.get("tags", []),
                                runtimes=item.get("runtimes", []),
                                difficulty=difficulty,
                                primary_language=item.get("primary_language"),
                                stars=item.get("stars", 0),
                                forks=item.get("forks", 0),
                                open_issues=item.get("open_issues", 0),
                                reddit_mentions=item.get("reddit_mentions", 0),
                                hackernews_mentions=item.get("hackernews_mentions", 0),
                                reddit_score=item.get("reddit_score", 0),
                                hackernews_score=item.get("hackernews_score", 0),
                                quality_score=quality_score,
                                trending_score=trending_score,
                                relevance_score=relevance_score,
                                source_type=item.get("source_type", "github"),
                                created_at=datetime.utcnow(),
                                updated_at=datetime.utcnow()
                            )
                            db.add(new_skill)
                            db.commit()
                            total_new += 1
                            source_new += 1
                    except Exception as item_err:
                        db.rollback()
                        logger.warning(f"Error saving skill {repo_url}: {item_err}")
                        continue

                if source_rec:
                    source_rec.last_status = "success"
                    source_rec.last_fetched_at = datetime.utcnow()
                    source_rec.items_collected_count = len(items)
                sources_summary[col_name] = {"status": "success", "total": len(items), "new": source_new, "updated": source_upd}
            else:
                if source_rec:
                    source_rec.last_status = "failed"
                sources_summary[col_name] = {"status": "failed", "error": err}
            
            try:
                db.commit()
            except Exception:
                db.rollback()

        # Update run summary
        run_record = db.query(CollectionRun).filter(CollectionRun.id == run_id).first()
        if run_record:
            run_record.status = "completed"
            run_record.finished_at = datetime.utcnow()
            run_record.total_new_skills = total_new
            run_record.total_updated_skills = total_updated
            run_record.sources_summary = sources_summary
            run_record.summary = f"Thu thập song song hoàn tất: phát hiện {total_new} skills mới, cập nhật {total_updated} skills."

            audit = AuditLog(
                user_id=user_id,
                username=triggered_by,
                action="collection_completed",
                target_type="collection_run",
                target_id=run_record.id,
                detail={"new": total_new, "updated": total_updated, "parallel": True}
            )
            db.add(audit)
            db.commit()

    except Exception as e:
        logger.error(f"Collection pipeline error: {e}")
        db.rollback()
        try:
            run_record = db.query(CollectionRun).filter(CollectionRun.id == run_id).first()
            if run_record:
                run_record.status = "failed"
                run_record.finished_at = datetime.utcnow()
                run_record.error_detail = str(e)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()

@router.post("/trigger")
async def trigger_collection(
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    triggered_by = current_user.username if current_user else "manual"
    user_id = current_user.id if current_user else None

    audit = AuditLog(
        user_id=user_id,
        username=triggered_by,
        action="trigger_collection",
        target_type="system",
        detail={"triggered_at": datetime.utcnow().isoformat()}
    )
    db.add(audit)
    db.commit()

    background_tasks.add_task(run_full_collection_pipeline, triggered_by, user_id)
    return {
        "status": "triggered",
        "message": f"Data collection pipeline launched concurrently for {triggered_by}."
    }

@router.get("/status")
def get_sources_status(db: Session = Depends(get_db)):
    return db.query(DataSource).all()
