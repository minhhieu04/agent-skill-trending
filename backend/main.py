import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from config import settings
from database import engine, Base, SessionLocal, auto_migrate_schema
from api import (
    skills_router,
    collect_router,
    preferences_router,
    history_router,
    auth_router,
    bundles_router,
    playground_router,
    studio_router,
)
from scheduler import start_scheduler, stop_scheduler
from models.user_preference import UserPreference
from models.source import DataSource
from models.skill import Skill
from models.bundle import SkillBundle
from models.collection_run import CollectionRun
from models.audit_log import AuditLog
from models.user import User
from middleware.auth import hash_password as get_password_hash

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("MainApp")

MATRIX_BUDDHA_BINARY = """
                      010101010101
                   010101010101010101
                 0101010101010101010101
                010101010101010101010101
               01010101010101010101010101
              010101   01010101   010101
              01010101010101010101010101
               010101    0101    010101
                0101010101010101010101
                  010101010101010101
                0101010101010101010101
              01010101010101010101010101
            010101010101010101010101010101
          0101010101010101010101010101010101
        01010101010101010101010101010101010101
      010101010101010101010101010101010101010101
    0101010101010101010101010101010101010101010101
  01010101010101010101010101010101010101010101010101
01010101010101010101010101010101010101010101010101010
  01010101010101010101010101010101010101010101010101
    0101010101010101010101010101010101010101010101
      010101010101010101010101010101010101010101
"""

def seed_initial_curated_skills():
    """Seeds default users, preferences, rich curated skills, and tech stack bundles if empty."""
    auto_migrate_schema(engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            logger.info("Seeding default demo users...")
            admin_user = User(
                username="hieu",
                password_hash=get_password_hash("123456"),
                display_name="Hiếu",
                is_admin=True,
                created_at=datetime.utcnow()
            )
            dev_user = User(
                username="developer",
                password_hash=get_password_hash("123456"),
                display_name="Developer Pro",
                is_admin=False,
                created_at=datetime.utcnow()
            )
            db.add_all([admin_user, dev_user])
            db.commit()

        pref = db.query(UserPreference).first()
        if not pref:
            logger.info("Seeding default user preferences for Hiếu...")
            default_pref = UserPreference(
                user_name="Hiếu",
                preferred_categories=["coding-agent", "mcp-server", "skill-file", "prompt-engineering", "workflow-automation"],
                preferred_languages=["Go", "TypeScript", "Python", "Rust"],
                preferred_runtimes=["Google Antigravity", "OpenAI Codex", "Cursor", "Claude Code", "Windsurf"],
                interested_tags=["antigravity", "codex", "mcp", "golang", "nextjs", "testing", "ai-agent"],
                min_stars=100,
                min_trending_score=40.0,
                only_recent_activity_days=90
            )
            db.add(default_pref)
            db.commit()

        count = db.query(Skill).count()
        if count == 0:
            logger.info("Seeding rich curated AI Agent Skills & Solutions with Antigravity and Codex...")

            curated = [
                {
                    "name": "google-deepmind/antigravity-agent-skills",
                    "title": "Google Antigravity Customizations & Subagent Protocol",
                    "repository_url": "https://github.com/google-deepmind/antigravity-agent-skills",
                    "author": "google-deepmind",
                    "description": "Comprehensive guide, subagent communication standards, planning mode workflows, and declarative SKILL.md specs for Google Antigravity & Gemini CLI.",
                    "ai_summary": "Bộ quy chuẩn xây dựng Subagents và Skills cho Google Antigravity: cấu hình SKILL.md, quy trình planning mode, sandbox tool calls và reactive wakeup không cần loop polling.",
                    "use_cases": [
                        "Xây dựng và triệu hồi Autonomous Subagents theo kiến trúc Google Deepmind",
                        "Chuẩn hóa file SKILL.md với đầy đủ frontmatter, scripts và references",
                        "Kiểm soát sandboxing và cấp quyền thực thi dòng lệnh an toàn trên macOS/Linux"
                    ],
                    "comparison_notes": "Chuẩn mở chính thức của Google cho Agentic Coding thế hệ mới, tối ưu cho ngữ cảnh lớn và phân rã task phức tạp.",
                    "target_audience": "AI Engineers & Antigravity Power Users",
                    "readme_preview": "# Antigravity Customization Skills\n\n```markdown\n---\nname: my-skill\ndescription: Procedural agent instructions\n---\n```",
                    "category": "skill-file",
                    "tags": ["antigravity", "google", "gemini", "subagents", "agentic-coding", "skills"],
                    "runtimes": ["Google Antigravity", "Gemini CLI", "Cursor", "Claude Code"],
                    "difficulty": "advanced",
                    "primary_language": "Python",
                    "stars": 16800,
                    "forks": 1420,
                    "quality_score": 99.5,
                    "trending_score": 99.0,
                    "is_featured": True,
                    "source_type": "github_trending_daily"
                },
                {
                    "name": "openai/codex-prompt-standards",
                    "title": "OpenAI Codex & Copilot Instruction Rules (.github/copilot-instructions.md)",
                    "repository_url": "https://github.com/openai/codex-prompt-standards",
                    "author": "openai",
                    "description": "Production-grade prompt architecture and repository-wide system instructions for OpenAI Codex, GitHub Copilot CLI, and automated PR review agents.",
                    "ai_summary": "Quy chuẩn viết chỉ dẫn hệ thống cho OpenAI Codex & GitHub Copilot: cấu trúc copilot-instructions.md, ràng buộc kiểu dữ liệu nghiêm ngặt và ngăn chặn hallucination.",
                    "use_cases": [
                        "Chuẩn hóa file .github/copilot-instructions.md cho toàn bộ team repository",
                        "Tự động ép Copilot/Codex viết unit test đạt độ bao phủ >85%",
                        "Ngăn chặn code smells, duplicate logic và hàm vượt quá 50 dòng code"
                    ],
                    "comparison_notes": "Bộ quy tắc tương thích 100% với hệ sinh thái GitHub & OpenAI, áp dụng hiệu quả cho cả CLI và VS Code extensions.",
                    "target_audience": "Enterprise Teams & GitHub Copilot Users",
                    "readme_preview": "# OpenAI Codex & Copilot Standards\n\nConfigure repository-level AI behavior with strict boundaries.",
                    "category": "skill-file",
                    "tags": ["codex", "openai", "copilot", "github-copilot", "prompt-engineering"],
                    "runtimes": ["OpenAI Codex", "Cursor", "Windsurf", "Claude Code"],
                    "difficulty": "intermediate",
                    "primary_language": "TypeScript",
                    "stars": 14200,
                    "forks": 1180,
                    "quality_score": 98.0,
                    "trending_score": 97.0,
                    "is_featured": True,
                    "source_type": "github_trending_weekly"
                },
                {
                    "name": "golang-standards/go-agent-skill",
                    "title": "Go Idiomatic & High-Performance Agent Skill",
                    "repository_url": "https://github.com/golang-standards/go-agent-skill",
                    "author": "golang-standards",
                    "description": "Comprehensive idiomatic Go conventions, concurrency patterns (goroutines/channels), memory leak prevention, and table-driven tests for Antigravity & Cursor.",
                    "ai_summary": "Bộ quy chuẩn viết Golang tối ưu: chống rò rỉ goroutine leak, tối ưu memory allocations, tự động sinh table-driven unit tests và kiểm soát context timeout.",
                    "use_cases": [
                        "Tối ưu goroutines, channels và tránh rò rỉ bộ nhớ trong Go microservices",
                        "Tự động sinh table-driven unit tests và benchmarks với lệnh go test -race",
                        "Áp dụng chuẩn Uber Go Style Guide và Clean Architecture cho Go REST/gRPC APIs"
                    ],
                    "comparison_notes": "Bộ quy chuẩn Golang chuyên sâu nhất cho Coding Agent, giúp tránh các lỗi panic và race condition phổ biến.",
                    "target_audience": "Golang Developers & Backend Engineers",
                    "readme_preview": "# Go Idiomatic Agent Skill\n\n```go\nif err != nil {\n    return fmt.Errorf(\"executing query: %w\", err)\n}\n```",
                    "category": "skill-file",
                    "tags": ["golang", "go", "concurrency", "microservices", "uber-go", "idiomatic-go"],
                    "runtimes": ["Google Antigravity", "OpenAI Codex", "Cursor", "Claude Code", "Windsurf"],
                    "difficulty": "intermediate",
                    "primary_language": "Go",
                    "stars": 8940,
                    "forks": 920,
                    "quality_score": 98.0,
                    "trending_score": 97.5,
                    "is_featured": True,
                    "source_type": "github_trending_daily"
                },
                {
                    "name": "uiux-pro/design-agent-skill",
                    "title": "UI/UX Pro Max: Modern Design Systems & Component Heuristics",
                    "repository_url": "https://github.com/uiux-pro/design-agent-skill",
                    "author": "uiux-pro",
                    "description": "Strict UI/UX design heuristics for AI Agents: WCAG 2.1 accessibility, 8pt spatial grid, Tailwind CSS tokens, micro-interactions, and dark/light mode palette generation.",
                    "ai_summary": "Bộ kỹ năng thiết kế UI/UX đỉnh cao cho AI: chuẩn hóa bảng màu tương phản cao, 8pt grid, hiệu ứng mượt mà, hỗ trợ chuẩn Accessibility WCAG 2.1.",
                    "use_cases": [
                        "Tự động hóa thiết kế giao diện Web/Mobile hiện đại, chuẩn tỉ lệ vàng và bảng màu tương phản cao",
                        "Tích hợp chuẩn WCAG 2.1 AA accessibility (hỗ trợ phím tắt, aria-labels, screen readers)",
                        "Tạo bộ Component Library (Buttons, Modals, Forms) có animation mượt mà"
                    ],
                    "comparison_notes": "Giải quyết điểm yếu lớn nhất của AI là sinh giao diện xấu và thiếu tương phản. Biến code thô thành UI cấp Production.",
                    "target_audience": "Frontend Developers & UI/UX Designers",
                    "readme_preview": "# UI/UX Pro Max Agent Skill\n\n```css\n--space-1: 0.25rem; /* 4px */\n--space-2: 0.5rem;  /* 8px */\n```",
                    "category": "skill-file",
                    "tags": ["ui-ux", "design-system", "tailwind", "accessibility", "frontend", "components"],
                    "runtimes": ["Google Antigravity", "OpenAI Codex", "Cursor", "Claude Code", "Windsurf"],
                    "difficulty": "intermediate",
                    "primary_language": "TypeScript",
                    "stars": 12400,
                    "forks": 1350,
                    "quality_score": 99.0,
                    "trending_score": 98.5,
                    "is_featured": True,
                    "source_type": "github_trending_weekly"
                },
                {
                    "name": "vercel/nextjs-agent-rules",
                    "title": "Next.js 15 App Router & Server Actions Master Skill",
                    "repository_url": "https://github.com/vercel/nextjs-agent-rules",
                    "author": "vercel-community",
                    "description": "Strict rules for Next.js 15 App Router, React Server Components (RSC), caching strategies (revalidateTag), Server Actions with Zod, and SEO optimization.",
                    "ai_summary": "Quy chuẩn Next.js 15 App Router: viết Server Actions an toàn có validation Zod, tối ưu React Server Components và chiến lược Cache thông minh.",
                    "use_cases": [
                        "Viết Server Actions an toàn có validation Zod và error handling",
                        "Tối ưu Caching và React Server Components để đạt 100 điểm Google Lighthouse",
                        "Cấu hình Metadata và OpenGraph dynamic tags cho SEO"
                    ],
                    "comparison_notes": "Loại bỏ triệt để tình trạng AI viết cú pháp Pages Router cũ hoặc dùng useEffect sai mục đích trong Next.js 15.",
                    "target_audience": "Frontend & Fullstack Developers",
                    "readme_preview": "# Next.js 15 Agent Rules\n\n```typescript\n'use server';\nimport { z } from 'zod';\n```",
                    "category": "skill-file",
                    "tags": ["nextjs", "react", "app-router", "server-actions", "seo", "typescript"],
                    "runtimes": ["Google Antigravity", "OpenAI Codex", "Cursor", "Claude Code", "Windsurf"],
                    "difficulty": "advanced",
                    "primary_language": "TypeScript",
                    "stars": 11200,
                    "forks": 980,
                    "quality_score": 97.5,
                    "trending_score": 96.0,
                    "is_featured": True,
                    "source_type": "github_trending_weekly"
                },
                {
                    "name": "modelcontextprotocol/servers",
                    "title": "Model Context Protocol (MCP) Reference Servers",
                    "repository_url": "https://github.com/modelcontextprotocol/servers",
                    "author": "Anthropic & Community",
                    "description": "Official reference MCP servers for PostgreSQL, GitHub, Slack, SQLite, Google Drive, and Filesystem integration with Cursor, Claude, Antigravity, and Codex.",
                    "ai_summary": "Tập hợp các MCP Servers tiêu chuẩn mở kết nối AI Agent với cơ sở dữ liệu PostgreSQL, Git, Slack, File hệ thống một cách an toàn và trực quan.",
                    "use_cases": [
                        "Cho phép Cursor/Antigravity/Claude truy vấn trực tiếp cơ sở dữ liệu Postgres dev/staging",
                        "Tự động hóa đọc issue, tạo pull request và kiểm tra CI trên GitHub qua Agent",
                        "Tìm kiếm và trích xuất nội dung file trong toàn bộ máy tính mà không cần copy thủ công"
                    ],
                    "comparison_notes": "Giao thức tiêu chuẩn mở đang dẫn đầu ngành, được hỗ trợ bởi tất cả IDEs lớn (Antigravity, Cursor, Claude Desktop, Codex).",
                    "target_audience": "Fullstack Developers & DevOps Engineers",
                    "readme_preview": "# MCP Reference Servers\n\n```json\n{\n  \"mcpServers\": {\n    \"postgres\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@modelcontextprotocol/server-postgres\"]\n    }\n  }\n}\n```",
                    "category": "mcp-server",
                    "tags": ["mcp", "model-context-protocol", "postgres", "github", "sqlite", "tools"],
                    "runtimes": ["Google Antigravity", "OpenAI Codex", "Cursor", "Claude Code", "Model Context Protocol"],
                    "difficulty": "intermediate",
                    "primary_language": "TypeScript",
                    "stars": 24500,
                    "forks": 2890,
                    "quality_score": 99.0,
                    "trending_score": 99.5,
                    "is_featured": True,
                    "source_type": "github_trending_daily"
                }
            ]

            skill_objs = []
            for item in curated:
                skill_obj = Skill(**item)
                db.add(skill_obj)
                skill_objs.append(skill_obj)
            db.commit()

            # Seed Bundles
            if db.query(SkillBundle).count() == 0:
                logger.info("Seeding Tech Stack Starter Packs...")
                bundles = [
                    SkillBundle(
                        slug="antigravity-data-stack",
                        name="Google Antigravity & AI Agent Master Stack",
                        title="Google Antigravity & Data Intelligence Stack",
                        description="Complete bundle for building enterprise subagents, BigQuery analytics, and procedural skills using Google Antigravity & Gemini CLI.",
                        icon="antigravity",
                        badge="Google Deepmind Stack",
                        category="ai-agent",
                        target_stack="Google Antigravity / Gemini CLI",
                        tags=["antigravity", "subagents", "gemini", "data-analytics", "mcp"],
                        skill_ids=[1, 6],
                        stars_total=41300
                    ),
                    SkillBundle(
                        slug="golang-microservices-stack",
                        name="High-Performance Golang Microservices Stack",
                        title="Golang High-Performance Microservices Stack",
                        description="Idiomatic Go conventions, concurrency race condition detector, and PostgreSQL MCP server integration.",
                        icon="golang",
                        badge="Go Backend Master",
                        category="backend",
                        target_stack="Antigravity / Codex / Cursor / Claude",
                        tags=["golang", "concurrency", "postgres", "microservices", "clean-code"],
                        skill_ids=[3, 6],
                        stars_total=33440
                    ),
                    SkillBundle(
                        slug="nextjs-uiux-pro-stack",
                        name="Next.js 15 & UI/UX Pro Max Stack",
                        title="Next.js 15 App Router & UI/UX Design System",
                        description="Build stunning, accessible, high-performance web applications with Next.js 15 App Router, Server Actions, and WCAG design heuristics.",
                        icon="nextjs",
                        badge="Frontend Master",
                        category="frontend",
                        target_stack="Antigravity / Codex / Cursor / Windsurf",
                        tags=["nextjs", "ui-ux", "tailwind", "react", "design-system"],
                        skill_ids=[4, 5],
                        stars_total=23600
                    ),
                    SkillBundle(
                        slug="codex-mcp-fullstack",
                        name="OpenAI Codex & Multi-Agent MCP Stack",
                        title="OpenAI Codex & Multi-Agent MCP Server Stack",
                        description="Comprehensive setup with OpenAI Codex repository rules and Model Context Protocol servers for fullstack pair programming.",
                        icon="openai",
                        badge="Enterprise Codex",
                        category="fullstack",
                        target_stack="OpenAI Codex / Copilot / Claude Code",
                        tags=["codex", "copilot", "mcp", "multi-agent", "github"],
                        skill_ids=[2, 6],
                        stars_total=38700
                    ),
                ]
                db.add_all(bundles)
                db.commit()
            else:
                # Ensure existing bundles are updated with official icons and clean titles
                bundle_updates = {
                    "antigravity-data-stack": {
                        "title": "Google Antigravity & Data Intelligence Stack",
                        "icon": "antigravity"
                    },
                    "golang-microservices-stack": {
                        "title": "Golang High-Performance Microservices Stack",
                        "icon": "golang"
                    },
                    "nextjs-uiux-pro-stack": {
                        "title": "Next.js 15 App Router & UI/UX Design System",
                        "icon": "nextjs"
                    },
                    "codex-mcp-fullstack": {
                        "title": "OpenAI Codex & Multi-Agent MCP Server Stack",
                        "icon": "openai"
                    }
                }
                for slug, data in bundle_updates.items():
                    b = db.query(SkillBundle).filter(SkillBundle.slug == slug).first()
                    if b:
                        b.title = data["title"]
                        b.icon = data["icon"]
                db.commit()

            # Record collection run
            init_run = CollectionRun(
                triggered_by="system_init",
                started_at=datetime.utcnow(),
                finished_at=datetime.utcnow(),
                status="completed",
                total_new_skills=len(curated),
                total_updated_skills=0,
                total_sources_scanned=4,
                sources_summary={"github": 4, "awesome_lists": 2, "reddit": 1, "hackernews": 1},
                summary=f"Khởi tạo thành công {len(curated)} curated AI Agent Skills và 4 Tech Stack Starter Packs."
            )
            db.add(init_run)
            db.commit()

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_initial_curated_skills()
    if settings.AUTO_SCHEDULE_ENABLED:
        start_scheduler()
    yield
    if settings.AUTO_SCHEDULE_ENABLED:
        stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.1.0",
    description="Agent Skill Trending & Recommendation Engine with Google Antigravity & OpenAI Codex integration",
    lifespan=lifespan
)

# CORS Middleware — configurable via CORS_ORIGINS env var
cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(skills_router, prefix=settings.API_V1_STR)
app.include_router(collect_router, prefix=settings.API_V1_STR)
app.include_router(preferences_router, prefix=settings.API_V1_STR)
app.include_router(history_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(bundles_router, prefix=settings.API_V1_STR)
app.include_router(playground_router, prefix=settings.API_V1_STR)
app.include_router(studio_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Agent Skill Trending API v2.1 (Antigravity & Codex Ready)",
        "docs": "/docs",
        "health": "/health",
        "matrix_art_ui": "/health/matrix"
    }

@app.get("/health", tags=["Health"])
@app.get("/healthz", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": settings.DATABASE_URL.split(":")[0],
        "version": "2.1.0",
        "matrix_avatar": MATRIX_BUDDHA_BINARY.strip().split("\n")
    }

@app.get("/health/matrix", response_class=HTMLResponse, tags=["Health"])
def health_matrix_view():
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>AgentSkills Health // Matrix 01 Stream</title>
        <style>
            body {{
                background-color: #050811;
                color: #00ff88;
                font-family: 'Courier New', Courier, monospace;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
                text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
            }}
            .matrix-box {{
                background: rgba(10, 18, 30, 0.9);
                border: 1px solid rgba(0, 255, 136, 0.4);
                border-radius: 24px;
                padding: 30px 40px;
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
                max-width: 800px;
                width: 100%;
                text-align: center;
            }}
            pre {{
                font-size: 13px;
                line-height: 1.25;
                color: #55ff99;
                white-space: pre;
                overflow-x: auto;
                text-shadow: 0 0 8px #00ff66;
            }}
            h1 {{
                font-size: 20px;
                margin-bottom: 10px;
                letter-spacing: 2px;
            }}
            .badge {{
                display: inline-block;
                padding: 4px 12px;
                background: rgba(0, 255, 136, 0.15);
                border: 1px solid #00ff88;
                border-radius: 12px;
                font-size: 12px;
                margin-top: 10px;
            }}
            .pulse {{
                animation: pulse 1.8s infinite;
            }}
            @keyframes pulse {{
                0% {{ opacity: 0.6; }}
                50% {{ opacity: 1; }}
                100% {{ opacity: 0.6; }}
            }}
        </style>
    </head>
    <body>
        <div class="matrix-box">
            <h1>🪐 AGENT-SKILLS // HEALTH MATRIX 2026</h1>
            <div class="badge pulse">● SYSTEM ONLINE (STATUS: 200 HEALTHY)</div>
            <pre>{MATRIX_BUDDHA_BINARY}</pre>
            <div style="font-size: 11px; color: #88ffbb; margin-top: 15px;">
                DATABASE: {settings.DATABASE_URL.split(":")[0].upper()} | VERSION: 2.1.0 | TIME: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
