import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from config import settings

class Scorer:
    @staticmethod
    def calculate_quality_score(item: Dict[str, Any]) -> float:
        """
        Calculates a 0-100 quality score based on repo health signals.
        """
        score = 40.0 # Base score for being indexed
        
        stars = item.get("stars", 0)
        forks = item.get("forks", 0)
        open_issues = item.get("open_issues", 0)
        desc = item.get("description", "")
        raw_data = item.get("raw_data", {})
        
        # Star power (logarithmic scale)
        if stars > 0:
            star_points = min(30.0, math.log10(stars + 1) * 7.5)
            score += star_points
            
        # Has clear description
        if desc and len(desc) > 30:
            score += 10.0
            
        # License presence
        if raw_data.get("license"):
            score += 10.0
            
        # Fork to Star healthy ratio
        if stars > 50 and forks > 5:
            ratio = forks / stars
            if 0.05 <= ratio <= 0.3:
                score += 5.0
                
        # Issues health
        if stars > 100:
            issue_ratio = open_issues / (stars + 1)
            if issue_ratio < 0.1:
                score += 5.0
                
        return min(100.0, max(0.0, round(score, 1)))

    @staticmethod
    def calculate_trending_score(item: Dict[str, Any], quality_score: float) -> float:
        """
        Composite trending score (0-100) based on velocity, social buzz, recency, quality.
        """
        stars = item.get("stars", 0)
        forks = item.get("forks", 0)
        reddit_score = item.get("reddit_score", 0)
        reddit_mentions = item.get("reddit_mentions", 0)
        hn_score = item.get("hackernews_score", 0)
        hn_mentions = item.get("hackernews_mentions", 0)
        source_type = item.get("source_type", "")
        
        # 1. Star Velocity / Momentum factor (0-100)
        velocity_score = 30.0
        if "trending_daily" in source_type:
            velocity_score = 95.0
        elif "trending_weekly" in source_type:
            velocity_score = 80.0
        elif stars > 5000:
            velocity_score = 75.0
        elif stars > 1000:
            velocity_score = 65.0
        elif stars > 100:
            velocity_score = 50.0

        # 2. Community Engagement / Social Buzz (0-100)
        community_score = 20.0
        social_points = (reddit_mentions * 20) + (reddit_score * 0.1) + (hn_mentions * 25) + (hn_score * 0.15)
        if social_points > 0:
            community_score = min(100.0, 40.0 + social_points)
        if "awesome_list" in source_type:
            community_score = max(community_score, 60.0)

        # 3. Recency factor (0-100)
        recency_score = 70.0  # Default assuming recent push
        last_pushed = item.get("last_pushed_at")
        if last_pushed:
            try:
                if isinstance(last_pushed, str):
                    pushed_dt = datetime.fromisoformat(last_pushed.replace("Z", "+00:00"))
                else:
                    pushed_dt = last_pushed
                
                if isinstance(pushed_dt, datetime):
                    if pushed_dt.tzinfo is None:
                        pushed_dt = pushed_dt.replace(tzinfo=timezone.utc)
                    days_ago = max(0, (datetime.now(timezone.utc) - pushed_dt).days)
                    if days_ago <= 7:
                        recency_score = 95.0
                    elif days_ago <= 30:
                        recency_score = 85.0
                    elif days_ago <= 90:
                        recency_score = 65.0
                    else:
                        recency_score = max(20.0, 100.0 - days_ago * 0.5)
            except Exception:
                recency_score = 70.0

        # 4. Fork ratio (0-100)
        fork_score = min(100.0, (forks / (stars + 1)) * 500) if stars > 0 else 30.0

        # 5. Weighted combination
        trending = (
            velocity_score * settings.WEIGHT_STAR_VELOCITY +
            community_score * settings.WEIGHT_COMMUNITY_ENGAGEMENT +
            recency_score * settings.WEIGHT_RECENCY +
            quality_score * settings.WEIGHT_QUALITY_SIGNALS +
            fork_score * settings.WEIGHT_FORK_RATIO
        )

        return min(100.0, max(0.0, round(trending, 1)))
