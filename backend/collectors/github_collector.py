import asyncio
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import datetime
from collectors.base import BaseCollector
from config import settings

class GitHubCollector(BaseCollector):
    def __init__(self):
        super().__init__("github")
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AgentSkillTrendingBot/1.0",
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    def _detect_runtimes(self, text: str) -> List[str]:
        """Detect compatible runtimes from text/readme/topics"""
        if not text:
            return []
        text_lower = text.lower()
        runtimes = []
        mapping = {
            "claude code": "Claude Code",
            "claude": "Claude Code",
            "cursor": "Cursor",
            "gemini": "Gemini CLI",
            "windsurf": "Windsurf",
            "aider": "Aider",
            "mcp": "Model Context Protocol",
            "model context protocol": "Model Context Protocol",
            "crewai": "CrewAI",
            "langgraph": "LangGraph",
            "autogen": "AutoGen",
            "openclaw": "OpenClaw",
            "copilot": "GitHub Copilot",
            "trae": "Trae",
        }
        for kw, runtime in mapping.items():
            if kw in text_lower and runtime not in runtimes:
                runtimes.append(runtime)
        return runtimes

    async def collect_from_search(self, query: str, sort: str = "stars", max_results: int = 15) -> List[Dict[str, Any]]:
        """Search GitHub repositories matching AI agent skills / tools queries"""
        url = f"https://api.github.com/search/repositories?q={query}&sort={sort}&order=desc&per_page={max_results}"
        items = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for repo in data.get("items", []):
                        repo_name = repo.get("full_name")
                        desc = repo.get("description") or ""
                        topics = repo.get("topics", [])
                        runtimes = self._detect_runtimes(f"{desc} {' '.join(topics)} {repo.get('name')}")
                        
                        tags = list(set(topics + [t.lower() for t in runtimes]))
                        
                        items.append({
                            "name": repo_name,
                            "title": repo.get("name", "").replace("-", " ").replace("_", " ").title(),
                            "repository_url": repo.get("html_url"),
                            "author": repo.get("owner", {}).get("login"),
                            "description": desc,
                            "primary_language": repo.get("language") or "Other",
                            "stars": repo.get("stargazers_count", 0),
                            "forks": repo.get("forks_count", 0),
                            "open_issues": repo.get("open_issues_count", 0),
                            "tags": tags[:8],
                            "runtimes": runtimes,
                            "source_type": "github_search",
                            "last_pushed_at": repo.get("pushed_at"),
                            "raw_data": {
                                "license": repo.get("license", {}).get("name") if repo.get("license") else None,
                                "created_at": repo.get("created_at"),
                                "watchers": repo.get("watchers_count", 0)
                            }
                        })
                elif resp.status_code == 403:
                    self.logger.warning(f"GitHub API Rate limit exceeded: {resp.text}")
                else:
                    self.logger.warning(f"GitHub Search API returned status {resp.status_code}")
        except Exception as e:
            self.logger.error(f"Error fetching from GitHub search ({query}): {e}")
        return items

    async def collect_trending_page(self, since: str = "daily") -> List[Dict[str, Any]]:
        """Scrape GitHub trending page for AI / developer tool repositories"""
        url = f"https://github.com/trending?since={since}"
        items = []
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    articles = soup.find_all("article", class_="Box-row")
                    for art in articles:
                        h2 = art.find("h2")
                        if not h2:
                            continue
                        a_tag = h2.find("a")
                        if not a_tag:
                            continue
                        repo_path = a_tag.get("href", "").strip().lstrip("/")
                        if not repo_path:
                            continue
                        
                        desc_p = art.find("p", class_="col-9")
                        desc = desc_p.text.strip() if desc_p else ""
                        
                        full_text = f"{repo_path} {desc}".lower()
                        keywords = ["agent", "skill", "mcp", "llm", "ai", "prompt", "cursor", "claude", "copilot", "gpt", "model", "bot", "tool", "workflow"]
                        if not any(kw in full_text for kw in keywords):
                            continue
                        
                        stars_tag = art.find("a", href=lambda x: x and x.endswith("/stargazers"))
                        stars_count = 0
                        if stars_tag:
                            try:
                                stars_count = int(stars_tag.text.strip().replace(",", ""))
                            except:
                                stars_count = 0
                        
                        lang_span = art.find("span", itemprop="programmingLanguage")
                        lang = lang_span.text.strip() if lang_span else "Other"
                        
                        parts = repo_path.split("/")
                        author = parts[0] if len(parts) > 0 else "unknown"
                        repo_name = parts[1] if len(parts) > 1 else repo_path
                        
                        runtimes = self._detect_runtimes(f"{repo_path} {desc}")
                        tags = ["trending", since] + [r.lower() for r in runtimes]
                        
                        items.append({
                            "name": repo_path,
                            "title": repo_name.replace("-", " ").replace("_", " ").title(),
                            "repository_url": f"https://github.com/{repo_path}",
                            "author": author,
                            "description": desc,
                            "primary_language": lang,
                            "stars": stars_count,
                            "forks": 0,
                            "open_issues": 0,
                            "tags": tags,
                            "runtimes": runtimes,
                            "source_type": f"github_trending_{since}",
                            "last_pushed_at": datetime.datetime.utcnow().isoformat(),
                            "raw_data": {"trending_period": since}
                        })
        except Exception as e:
            self.logger.error(f"Error scraping GitHub trending: {e}")
        return items

    async def collect(self) -> List[Dict[str, Any]]:
        self.logger.info("Starting GitHub collection concurrently...")
        all_items: Dict[str, Dict[str, Any]] = {}

        queries = [
            "ai agent skills",
            "agent skill in:name,description,readme",
            "mcp-server in:name,description,readme",
            "cursor-rules OR .cursorrules",
            "claude-code skills",
            "awesome-ai-agents",
            "autonomous coding agent",
        ]
        
        # Parallel search queries and trending scrapes
        search_tasks = [self.collect_from_search(q, sort="stars", max_results=10) for q in queries]
        trending_tasks = [self.collect_trending_page(since="daily"), self.collect_trending_page(since="weekly")]
        
        results_list = await asyncio.gather(*search_tasks, *trending_tasks, return_exceptions=True)

        for res in results_list:
            if isinstance(res, list):
                for item in res:
                    repo_url = item.get("repository_url")
                    if not repo_url:
                        continue
                    if repo_url in all_items:
                        all_items[repo_url]["tags"] = list(set(
                            all_items[repo_url].get("tags", []) + item.get("tags", [])
                        ))
                    else:
                        all_items[repo_url] = item

        self.logger.info(f"GitHub collection finished with {len(all_items)} unique repositories.")
        return list(all_items.values())
