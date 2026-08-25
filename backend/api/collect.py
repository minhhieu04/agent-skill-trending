from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import asyncio

from database import get_db, SessionLocal
from models.skill import Skill
from models.source import DataSource
from models.user_preference import UserPreference
from collectors import (
    GitHubCollector,
    RedditCollector,
    HackerNewsCollector,
    AwesomeListCollector
)
from analyzer import Scorer, Categorizer, RelevanceMatcher

router = APIRouter(prefix="/collect", tags=["Data Collection"])

async def run_full_collection_pipeline():
    """
    Orchestrates the data collection from all sources, performs analysis & scoring,
    and updates the database.
    """
    db = SessionLocal()
    try:
        collectors = [
            GitHubCollector(),
            AwesomeListCollector(),
            RedditCollector(),
            HackerNewsCollector(),
        ]
        
        pref = db.query(UserPreference).first()

        for col in collectors:
            # Update DataSource state to running
            source_rec = db.query(DataSource).filter(DataSource.name == col.name).first()
            if not source_rec:
                source_rec = DataSource(name=col.name, source_type=col.name)
                db.add(source_rec)
            
            source_rec.last_status = "running"
            db.commit()

            try:
                raw_items = await col.collect()
                collected_count = 0

                for item in raw_items:
                    repo_url = item.get("repository_url")
                    if not repo_url:
                        continue

                    # Categorize item (Heuristic / AI)
                    cat_res = Categorizer.rule_based_categorize(
                        name=item.get("name", ""),
                        desc=item.get("description", ""),
                        tags=item.get("tags", [])
                    )

                    category = cat_res["category"]
                    difficulty = cat_res["difficulty"]
                    ai_summary = cat_res["ai_summary"]

                    # Compute quality & trending scores
                    quality_score = Scorer.calculate_quality_score(item)
                    trending_score = Scorer.calculate_trending_score(item, quality_score)
                    
                    # Compute personalized relevance
                    relevance_dict = {
                        "category": category,
                        "primary_language": item.get("primary_language"),
                        "runtimes": item.get("runtimes", []),
                        "tags": item.get("tags", []),
                        "stars": item.get("stars", 0)
                    }
                    relevance_score = RelevanceMatcher.calculate_relevance(relevance_dict, pref) if pref else 50.0

                    # Find or create skill record
                    existing = db.query(Skill).filter(Skill.repository_url == repo_url).first()
                    if existing:
                        # Update stats
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
                        
                        # Merge tags & runtimes
                        existing.tags = list(set((existing.tags or []) + (item.get("tags") or [])))
                        existing.runtimes = list(set((existing.runtimes or []) + (item.get("runtimes") or [])))
                        
                        existing.quality_score = max(existing.quality_score, quality_score)
                        existing.trending_score = max(existing.trending_score, trending_score)
                        existing.relevance_score = relevance_score
                        existing.updated_at = datetime.utcnow()
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
                    
                    collected_count += 1

                source_rec.last_status = "success"
                source_rec.last_fetched_at = datetime.utcnow()
                source_rec.items_collected_count = collected_count
                db.commit()

            except Exception as e:
                source_rec.last_status = "failed"
                db.commit()

    finally:
        db.close()

@router.post("/trigger")
async def trigger_collection(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_full_collection_pipeline)
    return {
        "status": "triggered",
        "message": "Data collection pipeline launched in background."
    }

@router.get("/status")
def get_sources_status(db: Session = Depends(get_db)):
    sources = db.query(DataSource).all()
    return sources
