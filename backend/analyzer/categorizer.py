import json
import logging
from typing import Dict, Any, List
from config import settings

logger = logging.getLogger("Categorizer")

CATEGORIES = [
    "coding-agent",
    "mcp-server",
    "skill-file",
    "prompt-engineering",
    "workflow-automation",
    "local-llm",
    "devtools",
    "data-analysis",
    "security-safety"
]

class Categorizer:
    @staticmethod
    def rule_based_categorize(name: str, desc: str, tags: List[str]) -> Dict[str, Any]:
        """
        Fast, robust heuristic classifier for AI agent tools & skills.
        """
        text = f"{name} {desc} {' '.join(tags)}".lower()
        
        category = "devtools" # Default fallback
        difficulty = "intermediate"
        
        # 1. MCP Server detection
        if "mcp" in text or "model context protocol" in text or "mcp-server" in text:
            category = "mcp-server"
        # 2. Skill File / Rules detection
        elif "skill" in text or ".cursorrules" in text or "cursor-rules" in text or "skill.md" in text or "copilot-instructions" in text:
            category = "skill-file"
        # 3. Coding Agents
        elif any(k in text for k in ["coding agent", "code generator", "autonomous agent", "dev agent", "coder", "refactor"]):
            category = "coding-agent"
        # 4. Prompt engineering
        elif any(k in text for k in ["prompt", "system prompt", "few-shot", "jailbreak", "meta-prompt"]):
            category = "prompt-engineering"
        # 5. Workflow Automation
        elif any(k in text for k in ["workflow", "orchestration", "pipeline", "automation", "crewai", "langgraph", "autogen"]):
            category = "workflow-automation"
        # 6. Local LLM / Inference
        elif any(k in text for k in ["ollama", "vllm", "llama.cpp", "local llm", "quantization", "gguf"]):
            category = "local-llm"
        # 7. Data Analysis
        elif any(k in text for k in ["data analysis", "bigquery", "sql", "pandas", "data science"]):
            category = "data-analysis"

        # Difficulty inference
        if any(k in text for k in ["simple", "beginner", "easy", "starter", "template"]):
            difficulty = "beginner"
        elif any(k in text for k in ["framework", "distributed", "compiler", "runtime", "kernel", "advanced", "benchmark"]):
            difficulty = "advanced"

        # Generate standard summary
        summary = desc if desc else f"Open-source AI tool: {name}"
        if len(summary) > 200:
            summary = summary[:197] + "..."

        return {
            "category": category,
            "difficulty": difficulty,
            "ai_summary": summary
        }

    @staticmethod
    async def ai_categorize(name: str, desc: str, tags: List[str], primary_language: str) -> Dict[str, Any]:
        """
        Uses Google Gemini to accurately categorize, summarize use case, and recommend runtimes.
        Falls back to rule_based_categorize if no API key or on error.
        """
        heuristic_res = Categorizer.rule_based_categorize(name, desc, tags)
        
        if not settings.GEMINI_API_KEY:
            return heuristic_res

        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            prompt = f"""
            Analyze the following AI Agent project / skill and return a JSON object with:
            1. "category": one of {CATEGORIES}
            2. "difficulty": "beginner", "intermediate", or "advanced"
            3. "ai_summary": a 1-2 sentence Vietnamese concise summary of what this tool solves and why a developer should use it.
            4. "runtimes": list of supported agent runtimes (e.g. ["Cursor", "Claude Code", "Gemini CLI", "Aider", "Windsurf", "LangGraph"])

            Project Name: {name}
            Description: {desc}
            Tags: {', '.join(tags)}
            Language: {primary_language}

            Respond ONLY with valid JSON.
            """
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            data = json.loads(text.strip())
            
            return {
                "category": data.get("category", heuristic_res["category"]),
                "difficulty": data.get("difficulty", heuristic_res["difficulty"]),
                "ai_summary": data.get("ai_summary", heuristic_res["ai_summary"]),
                "runtimes": data.get("runtimes", [])
            }
        except Exception as e:
            logger.warning(f"Gemini AI Categorization skipped / failed ({e}), using heuristic.")
            return heuristic_res
