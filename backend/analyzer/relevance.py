from typing import Dict, Any
from models.user_preference import UserPreference

class RelevanceMatcher:
    @staticmethod
    def calculate_relevance(item: Dict[str, Any], pref: UserPreference) -> float:
        """
        Calculates a personalized 0-100 relevance score for a given user preference.
        """
        if not pref:
            return 50.0

        score = 20.0
        
        category = item.get("category", "")
        lang = item.get("primary_language", "")
        runtimes = item.get("runtimes", []) or []
        tags = item.get("tags", []) or []
        stars = item.get("stars", 0)
        
        # 1. Preferred Categories match (+30 pts)
        if pref.preferred_categories and category in pref.preferred_categories:
            score += 30.0
            
        # 2. Preferred Tech Stack / Language match (+20 pts)
        if pref.preferred_languages and lang in pref.preferred_languages:
            score += 20.0
            
        # 3. Preferred Runtimes match (e.g. Cursor, Claude Code) (+20 pts)
        if pref.preferred_runtimes:
            matched_runtimes = [r for r in runtimes if r in pref.preferred_runtimes]
            if matched_runtimes:
                score += min(20.0, len(matched_runtimes) * 10.0)
                
        # 4. Interested Tags match (+15 pts)
        if pref.interested_tags:
            matched_tags = [t for t in tags if any(it.lower() in t.lower() for it in pref.interested_tags)]
            if matched_tags:
                score += min(15.0, len(matched_tags) * 5.0)

        # 5. Star Threshold penalty or boost
        if pref.min_stars and stars < pref.min_stars:
            score *= 0.7

        return min(100.0, max(0.0, round(score, 1)))
