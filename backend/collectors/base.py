from abc import ABC, abstractmethod
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Collector")

class BaseCollector(ABC):
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"Collector.{name}")

    @abstractmethod
    async def collect(self) -> List[Dict[str, Any]]:
        """
        Collect items from the specific source.
        Returns a list of standardized dictionary objects representing skills/tools.
        Expected format:
        {
            "name": "owner/repo-name",
            "title": "Clean Title / Name",
            "repository_url": "https://github.com/owner/repo-name",
            "author": "owner",
            "description": "Short description",
            "primary_language": "Python",
            "stars": 1200,
            "forks": 150,
            "open_issues": 12,
            "tags": ["agent", "mcp"],
            "runtimes": ["Claude Code", "Cursor"],
            "source_type": "github_trending",
            "raw_data": {...}
        }
        """
        pass
