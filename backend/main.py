from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

from config import settings
from database import engine, Base, SessionLocal
from models import Skill, DataSource, UserPreference
from api import skills_router, categories_router, preferences_router, collect_router
from scheduler.jobs import start_scheduler, stop_scheduler

# Create tables
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Main")

def seed_initial_curated_skills():
    """Seed top AI agent skills into database if empty so user has immediate rich data."""
    db = SessionLocal()
    try:
        count = db.query(Skill).count()
        if count == 0:
            logger.info("Seeding initial high-quality AI Agent Skills & Solutions...")
            
            # Default user preference
            pref = UserPreference(
                user_name="Hiếu",
                preferred_categories=["coding-agent", "mcp-server", "skill-file", "workflow-automation", "devtools"],
                preferred_languages=["Python", "TypeScript", "Go", "Rust"],
                preferred_runtimes=["Claude Code", "Cursor", "Gemini CLI", "Windsurf", "Aider"],
                interested_tags=["agent", "skills", "automation", "mcp", "llm", "code-generation"],
                min_stars=50,
                min_trending_score=20
            )
            db.add(pref)

            curated = [
                {
                    "name": "VoltAgent/awesome-agent-skills",
                    "title": "Awesome Agent Skills",
                    "repository_url": "https://github.com/VoltAgent/awesome-agent-skills",
                    "author": "VoltAgent",
                    "description": "A curated collection of 1,000+ production-ready agent skills for Claude Code, Cursor, and Gemini CLI.",
                    "ai_summary": "Thư viện tổng hợp hơn 1,000 skills thực chiến cho Claude Code, Cursor và các AI coding agents.",
                    "category": "skill-file",
                    "tags": ["agent-skills", "cursor", "claude-code", "gemini", "curated"],
                    "runtimes": ["Claude Code", "Cursor", "Gemini CLI"],
                    "difficulty": "beginner",
                    "primary_language": "Markdown",
                    "stars": 4820,
                    "forks": 510,
                    "quality_score": 96.0,
                    "trending_score": 98.5,
                    "is_featured": True,
                    "source_type": "awesome_list"
                },
                {
                    "name": "anthropics/skills",
                    "title": "Official Anthropic Agent Skills",
                    "repository_url": "https://github.com/anthropics/skills",
                    "author": "anthropics",
                    "description": "Official reference skills and procedural definitions for Claude Code and Anthropic agent workflows.",
                    "ai_summary": "Bộ chuẩn SKILL.md chính thức từ Anthropic dành cho Claude Code và các agent tự động hóa.",
                    "category": "skill-file",
                    "tags": ["anthropic", "claude-code", "skill.md", "official"],
                    "runtimes": ["Claude Code"],
                    "difficulty": "intermediate",
                    "primary_language": "Python",
                    "stars": 6300,
                    "forks": 720,
                    "quality_score": 99.0,
                    "trending_score": 97.0,
                    "is_featured": True,
                    "source_type": "github_trending_weekly"
                },
                {
                    "name": "modelcontextprotocol/servers",
                    "title": "Model Context Protocol Reference Servers",
                    "repository_url": "https://github.com/modelcontextprotocol/servers",
                    "author": "modelcontextprotocol",
                    "description": "Official MCP servers collection: Postgres, GitHub, Slack, SQLite, Google Drive, Git, and Brave Search.",
                    "ai_summary": "Tập hợp các MCP Servers chính thức kết nối LLM với Postgres, GitHub, Slack, SQLite, v.v.",
                    "category": "mcp-server",
                    "tags": ["mcp", "mcp-server", "tools", "integrations"],
                    "runtimes": ["Claude Code", "Cursor", "Model Context Protocol"],
                    "difficulty": "intermediate",
                    "primary_language": "TypeScript",
                    "stars": 18500,
                    "forks": 1950,
                    "quality_score": 98.0,
                    "trending_score": 96.0,
                    "is_featured": True,
                    "source_type": "github_search"
                },
                {
                    "name": "paul-gauthier/aider",
                    "title": "Aider: AI Pair Programming in Your Terminal",
                    "repository_url": "https://github.com/paul-gauthier/aider",
                    "author": "paul-gauthier",
                    "description": "Aider is AI pair programming in your terminal. It pairs with Claude 3.5 Sonnet, GPT-4o, and local models to edit code in your local git repo.",
                    "ai_summary": "Công cụ lập trình cặp qua terminal hỗ trợ Git repository, tự động tạo commit message và refactor code.",
                    "category": "coding-agent",
                    "tags": ["cli", "pair-programming", "git", "terminal"],
                    "runtimes": ["Aider"],
                    "difficulty": "intermediate",
                    "primary_language": "Python",
                    "stars": 28400,
                    "forks": 2700,
                    "quality_score": 99.0,
                    "trending_score": 94.0,
                    "is_featured": True,
                    "source_type": "github_search"
                },
                {
                    "name": "mendableai/firecrawl",
                    "title": "Firecrawl: Turn Entire Websites into Clean Markdown for LLMs",
                    "repository_url": "https://github.com/mendableai/firecrawl",
                    "author": "mendableai",
                    "description": "Crawl and convert any website into LLM-ready markdown. Built-in MCP server support for Agent workflows.",
                    "ai_summary": "Crawl và chuyển đổi toàn bộ website thành Markdown tối ưu cho AI Agent, có sẵn MCP server.",
                    "category": "mcp-server",
                    "tags": ["scraping", "markdown", "mcp", "agent-context"],
                    "runtimes": ["Claude Code", "Cursor", "Model Context Protocol"],
                    "difficulty": "beginner",
                    "primary_language": "TypeScript",
                    "stars": 21300,
                    "forks": 1780,
                    "quality_score": 95.0,
                    "trending_score": 93.0,
                    "is_featured": True,
                    "source_type": "github_trending_daily"
                },
                {
                    "name": "langchain-ai/langgraph",
                    "title": "LangGraph: Multi-Agent Workflow Orchestration",
                    "repository_url": "https://github.com/langchain-ai/langgraph",
                    "author": "langchain-ai",
                    "description": "Build resilient language agents as graphs with stateful multi-actor workflows, human-in-the-loop, and memory.",
                    "ai_summary": "Framework xây dựng luồng multi-agent có state, hỗ trợ human-in-the-loop và persistent memory.",
                    "category": "workflow-automation",
                    "tags": ["orchestration", "multi-agent", "graph", "state-machine"],
                    "runtimes": ["LangGraph"],
                    "difficulty": "advanced",
                    "primary_language": "Python",
                    "stars": 14200,
                    "forks": 1890,
                    "quality_score": 94.0,
                    "trending_score": 91.0,
                    "is_featured": True,
                    "source_type": "github_search"
                },
                {
                    "name": "PatrickJS/awesome-cursorrules",
                    "title": "Awesome Cursor Rules",
                    "repository_url": "https://github.com/PatrickJS/awesome-cursorrules",
                    "author": "PatrickJS",
                    "description": "A curated list of awesome .cursorrules files for popular frameworks: Next.js, React, FastAPI, Flutter, etc.",
                    "ai_summary": "Tổng hợp các file .cursorrules tối ưu cho Next.js, FastAPI, NestJS, Tailwind, Flutter giúp Cursor code chuẩn xác.",
                    "category": "skill-file",
                    "tags": ["cursor", "cursorrules", "prompts", "frameworks"],
                    "runtimes": ["Cursor"],
                    "difficulty": "beginner",
                    "primary_language": "Markdown",
                    "stars": 11500,
                    "forks": 1400,
                    "quality_score": 92.0,
                    "trending_score": 90.5,
                    "is_featured": False,
                    "source_type": "awesome_list"
                },
                {
                    "name": "ollama/ollama",
                    "title": "Ollama: Get up and running with Llama 3.3, DeepSeek-R1, and Mistral locally",
                    "repository_url": "https://github.com/ollama/ollama",
                    "author": "ollama",
                    "description": "Get up and running with large language models locally. Run agents completely offline with full privacy.",
                    "ai_summary": "Nền tảng chạy các mô hình AI mã nguồn mở (DeepSeek, Llama) trực tiếp trên máy cục bộ bảo mật và miễn phí.",
                    "category": "local-llm",
                    "tags": ["local-llm", "offline-ai", "privacy", "inference"],
                    "runtimes": ["Aider", "Cursor"],
                    "difficulty": "beginner",
                    "primary_language": "Go",
                    "stars": 112000,
                    "forks": 9800,
                    "quality_score": 99.5,
                    "trending_score": 98.0,
                    "is_featured": True,
                    "source_type": "github_search"
                }
            ]

            for c in curated:
                skill_obj = Skill(**c)
                db.add(skill_obj)
            
            db.commit()
            logger.info("Successfully seeded curated AI Agent skills.")
    except Exception as e:
        logger.error(f"Error seeding initial data: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    seed_initial_curated_skills()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agent Skill Trending & Recommendation Engine API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(skills_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(preferences_router, prefix=settings.API_V1_STR)
app.include_router(collect_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
