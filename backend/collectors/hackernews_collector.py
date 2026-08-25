import httpx
import re
from typing import List, Dict, Any
from collectors.base import BaseCollector

class HackerNewsCollector(BaseCollector):
    def __init__(self):
        super().__init__("hackernews")
        self.queries = ["AI agent", "MCP server", "Cursor rules", "coding agent", "Claude Code", "LLM tool"]

    def _extract_github_urls(self, text: str) -> List[str]:
        if not text:
            return []
        pattern = r"https?://github\.com/([a-zA-Z0-9_\-\.]+/[a-zA-Z0-9_\-\.]+)"
        matches = re.findall(pattern, text)
        return list(set(matches))

    async def collect(self) -> List[Dict[str, Any]]:
        self.logger.info("Starting HackerNews collection...")
        items = []
        base_url = "https://hn.algolia.com/api/v1/search"

        async with httpx.AsyncClient(timeout=15.0) as client:
            for query in self.queries:
                params = {
                    "query": query,
                    "tags": "story",
                    "numericFilters": "points>20",
                    "hitsPerPage": 15
                }
                try:
                    resp = await client.get(base_url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        for hit in data.get("hits", []):
                            title = hit.get("title", "")
                            url_field = hit.get("url", "")
                            story_text = hit.get("story_text", "") or ""
                            points = hit.get("points", 0)
                            num_comments = hit.get("num_comments", 0)

                            full_content = f"{title} {url_field} {story_text}"
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
                                        "description": f"Featured on HackerNews: {title}",
                                        "hackernews_mentions": 1,
                                        "hackernews_score": points,
                                        "tags": ["hackernews", "trending", "hn-featured"],
                                        "runtimes": [],
                                        "source_type": "hackernews",
                                        "raw_data": {
                                            "hn_points": points,
                                            "num_comments": num_comments,
                                            "story_id": hit.get("objectID")
                                        }
                                    })
                    elif resp.status_code == 429:
                        retry_after = resp.headers.get("Retry-After", "60")
                        self.logger.warning(
                            f"[QUOTA] HackerNews Algolia API rate limited (429) for query={query!r} "
                            f"— retry after {retry_after}s."
                        )
                    elif resp.status_code in (500, 503):
                        self.logger.warning(f"[SERVER] HackerNews Algolia server error {resp.status_code} for query={query!r} — skipping.")
                    else:
                        self.logger.warning(f"HackerNews unexpected status {resp.status_code} for query={query!r}")
                except Exception as e:
                    self.logger.error(f"Error searching HN for '{query}': {e}")

        self.logger.info(f"HackerNews collection finished with {len(items)} mentions.")
        return items
