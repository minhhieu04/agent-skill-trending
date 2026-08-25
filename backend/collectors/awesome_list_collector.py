import httpx
import re
from typing import List, Dict, Any
from collectors.base import BaseCollector

class AwesomeListCollector(BaseCollector):
    def __init__(self):
        super().__init__("awesome_lists")
        # Direct raw readme URLs of top curated lists
        self.awesome_sources = [
            {
                "name": "VoltAgent/awesome-agent-skills",
                "raw_url": "https://raw.githubusercontent.com/VoltAgent/awesome-agent-skills/main/README.md",
                "fallback_url": "https://raw.githubusercontent.com/VoltAgent/awesome-agent-skills/master/README.md",
            },
            {
                "name": "anthropics/skills",
                "raw_url": "https://raw.githubusercontent.com/anthropics/skills/main/README.md",
                "fallback_url": "https://raw.githubusercontent.com/anthropics/skills/master/README.md",
            },
            {
                "name": "caramaschiHG/awesome-ai-agents-2026",
                "raw_url": "https://raw.githubusercontent.com/caramaschiHG/awesome-ai-agents-2026/main/README.md",
                "fallback_url": "https://raw.githubusercontent.com/caramaschiHG/awesome-ai-agents-2026/master/README.md",
            }
        ]

    def _parse_markdown_links(self, md_content: str) -> List[Dict[str, str]]:
        """Extract markdown links formatted like [Title](https://github.com/owner/repo) - Description"""
        results = []
        # Pattern for markdown link: [Text](URL) - Description or : Description
        lines = md_content.splitlines()
        link_pattern = re.compile(r"\[([^\]]+)\]\((https?://github\.com/[a-zA-Z0-9_\-\.]+/[a-zA-Z0-9_\-\.]+/?)\)(?:\s*[:-]\s*(.*))?")
        
        for line in lines:
            line_str = line.strip()
            match = link_pattern.search(line_str)
            if match:
                title = match.group(1).strip()
                url = match.group(2).strip().rstrip("/")
                desc = match.group(3).strip() if match.group(3) else ""
                
                # Exclude root links or license links
                if not any(url.endswith(x) for x in ["/issues", "/pulls", "/blob", "/tree", "/releases"]):
                    results.append({
                        "title": title,
                        "url": url,
                        "description": desc
                    })
        return results

    async def collect(self) -> List[Dict[str, Any]]:
        self.logger.info("Starting Awesome Lists collection...")
        items = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            for src in self.awesome_sources:
                content = None
                for url in [src["raw_url"], src["fallback_url"]]:
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            content = resp.text
                            break
                    except Exception as e:
                        self.logger.debug(f"Could not load {url}: {e}")

                if not content:
                    continue

                links = self._parse_markdown_links(content)
                for l in links:
                    parts = l["url"].replace("https://github.com/", "").split("/")
                    if len(parts) >= 2:
                        author, repo_name = parts[0], parts[1]
                        items.append({
                            "name": f"{author}/{repo_name}",
                            "title": l["title"],
                            "repository_url": l["url"],
                            "author": author,
                            "description": l["description"] or f"Curated in {src['name']}",
                            "tags": ["curated", "awesome-list", "verified-skill"],
                            "runtimes": ["Claude Code", "Cursor"],
                            "source_type": "awesome_list",
                            "raw_data": {"curated_by": src["name"]}
                        })

        self.logger.info(f"Awesome Lists collection finished with {len(items)} items.")
        return items
