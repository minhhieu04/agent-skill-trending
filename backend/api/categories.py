from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from database import get_db
from models.skill import Skill
from analyzer.categorizer import CATEGORIES

router = APIRouter(tags=["Categories & Taxonomies"])

CATEGORY_METADATA = {
    "coding-agent": {
        "title": "Coding Agents",
        "description": "Autonomous agents, IDEs, and CLI tools for writing and refactoring code",
        "icon": "Code2"
    },
    "mcp-server": {
        "title": "MCP Servers",
        "description": "Model Context Protocol servers providing real-world tools & integrations to LLMs",
        "icon": "Server"
    },
    "skill-file": {
        "title": "Agent Skills & Rules",
        "description": "SKILL.md, .cursorrules, system prompts, and procedural skill collections",
        "icon": "Sparkles"
    },
    "prompt-engineering": {
        "title": "Prompt Engineering",
        "description": "Advanced prompts, system directives, and meta-prompts for AI workflows",
        "icon": "MessageSquareText"
    },
    "workflow-automation": {
        "title": "Workflow Automation",
        "description": "Multi-agent orchestration, LangGraph, CrewAI, and pipeline frameworks",
        "icon": "Workflow"
    },
    "local-llm": {
        "title": "Local LLM & Inference",
        "description": "Ollama tools, local model managers, quantization, and offline AI execution",
        "icon": "Cpu"
    },
    "devtools": {
        "title": "AI Developer Tools",
        "description": "Debugging, testing, observability, and evaluation suites for AI agents",
        "icon": "Wrench"
    },
    "data-analysis": {
        "title": "Data & Analytics Agents",
        "description": "AI agents for SQL, BigQuery, Pandas data exploration and visualization",
        "icon": "BarChart3"
    },
    "security-safety": {
        "title": "Agent Security & Guardrails",
        "description": "Security scanning, prompt injection defense, and sandbox isolation",
        "icon": "ShieldCheck"
    }
}

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    counts = {}
    for s in skills:
        cat = s.category or "uncategorized"
        counts[cat] = counts.get(cat, 0) + 1

    result = []
    for cat in CATEGORIES:
        meta = CATEGORY_METADATA.get(cat, {
            "title": cat.replace("-", " ").title(),
            "description": f"AI Agent skills in {cat}",
            "icon": "Folder"
        })
        result.append({
            "key": cat,
            "title": meta["title"],
            "description": meta["description"],
            "icon": meta["icon"],
            "count": counts.get(cat, 0)
        })
    return result

@router.get("/runtimes")
def get_runtimes(db: Session = Depends(get_db)):
    standard_runtimes = [
        "Claude Code",
        "Cursor",
        "Gemini CLI",
        "Windsurf",
        "Aider",
        "Model Context Protocol",
        "LangGraph",
        "CrewAI",
        "GitHub Copilot",
        "OpenClaw"
    ]
    skills = db.query(Skill).all()
    counts = {}
    for s in skills:
        if s.runtimes:
            for r in s.runtimes:
                counts[r] = counts.get(r, 0) + 1

    return [
        {"name": r, "count": counts.get(r, 0)}
        for r in standard_runtimes
    ]
