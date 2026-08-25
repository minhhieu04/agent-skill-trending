import httpx
import re
from typing import List, Dict, Any
from collectors.base import BaseCollector
from config import settings

class RedditCollector(BaseCollector):
    def __init__(self):
        super().__init__("reddit")
        self.subreddits = ["AI_Agents", "LocalLLaMA", "ChatGPTCoding", "ClaudeAI"]

    def _extract_github_urls(self, text: str) -> List[str]:
        if not text:
            return []
        pattern = r"https?://github\.com/([a-zA-Z0-9_\-\.]+/[a-zA-Z0-9_\-\.]+)"
        matches = re.findall(pattern, text)
        return list(set(matches))

    async def collect(self) -> List[Dict[str, Any]]:
        self.logger.info("Starting Reddit collection...")
        items = []
        headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AgentSkillTrending/1.0"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            for sub in self.subreddits:
                url = f"https://www.reddit.com/r/{sub}/hot.json?limit=25"
                try:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        posts = data.get("data", {}).get("children", [])
                        for p in posts:
                            post_data = p.get("data", {})
                            title = post_data.get("title", "")
                            selftext = post_data.get("selftext", "")
                            url_field = post_data.get("url", "")
                            score = post_data.get("score", 0)
                            num_comments = post_data.get("num_comments", 0)

                            full_content = f"{title} {selftext} {url_field}"
                            gh_repos = self._extract_github_urls(full_content)

                            for gh_path in gh_repos:
                                gh_clean = gh_path.rstrip("/").rstrip(".git")
                                parts = gh_clean.split("/")
                                if len(parts) >= 2:
                                    author, repo_name = parts[0], parts[1]
                                    items.append({
                                        "name": f"{author}/{repo_name}",
                                        "title": title[:100],
                                        "repository_url": f"https://github.com/{author}/{repo_name}",
                                        "author": author,
                                        "description": f"Shared on r/{sub}: {title}",
                                        "reddit_mentions": 1,
                                        "reddit_score": score,
                                        "tags": ["reddit", f"r/{sub.lower()}", "community-pick"],
                                        "runtimes": [],
                                        "source_type": "reddit",
                                        "raw_data": {
                                            "subreddit": sub,
                                            "post_score": score,
                                            "num_comments": num_comments,
                                            "post_url": f"https://reddit.com{post_data.get('permalink', '')}"
                                        }
                                    })
                    elif resp.status_code == 429:
                        # Reddit enforces 429 when rate-limited (without OAuth)
                        retry_after = resp.headers.get("Retry-After", "60")
                        self.logger.warning(
                            f"[QUOTA] Reddit r/{sub} rate limited (429) — "
                            f"retry after {retry_after}s. "
                            f"Consider adding REDDIT_CLIENT_ID/SECRET env vars for higher limits."
                        )
                    elif resp.status_code == 403:
                        self.logger.warning(
                            f"[AUTH] Reddit r/{sub} returned 403 Forbidden — "
                            f"subreddit may be private or quarantined."
                        )
                    elif resp.status_code in (500, 503):
                        self.logger.warning(f"[SERVER] Reddit r/{sub} server error {resp.status_code} — skipping.")
                    else:
                        self.logger.warning(f"Reddit r/{sub} unexpected status {resp.status_code}")
                except Exception as e:
                    self.logger.error(f"Error fetching from Reddit r/{sub}: {e}")

        self.logger.info(f"Reddit collection finished with {len(items)} mentions.")
        return items
