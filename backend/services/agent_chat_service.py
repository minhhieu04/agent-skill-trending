import asyncio
import json
import logging
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from config import settings
from models.skill import Skill
from services.skill_service import SkillService

logger = logging.getLogger("AgentChatService")


class AgentChatService:
    """
    RAG-powered conversational Agent Chat service.
    Scans the skills database, retrieves the most relevant candidates (RAG step 1),
    and synthesizes a tailored, concise recommendation explaining each skill (RAG step 2).
    """

    @classmethod
    def get_prompt_suggestions(cls, language: str = "vi") -> List[Dict[str, str]]:
        if language == "en":
            return [
                {
                    "title": "⚡ Golang Backend Optimization",
                    "query": "I am experiencing goroutine leaks and race conditions in Go microservices. What agent skills can help prevent this?",
                    "icon": "zap",
                    "category": "Golang & Concurrency"
                },
                {
                    "title": "🚀 Next.js 15 Fullstack & SEO",
                    "query": "I need to build a high-performance Next.js 15 web app with Server Actions, Zod validation, and SEO.",
                    "icon": "code",
                    "category": "Frontend & Next.js"
                },
                {
                    "title": "🤖 Google Antigravity & Subagents",
                    "query": "How do I build autonomous subagents and standardized SKILL.md specs for Google Antigravity and Gemini CLI?",
                    "icon": "bot",
                    "category": "Antigravity Harness"
                },
                {
                    "title": "🎨 Modern UI/UX Design System",
                    "query": "How can an AI agent design production-grade UI with WCAG accessibility and Tailwind CSS tokens?",
                    "icon": "sparkles",
                    "category": "Design & Accessibility"
                },
                {
                    "title": "🛡️ Security & Sandbox Audit",
                    "query": "I want to audit third-party AI Agent skills and MCP tools for command injection and permission leaks.",
                    "icon": "shield",
                    "category": "Security & Guardrails"
                },
                {
                    "title": "💡 Beginner: Which skills to start with?",
                    "query": "I am new to Agentic Coding. Recommend the top foundational skills I should configure in my IDE first.",
                    "icon": "compass",
                    "category": "Starter Pack"
                }
            ]

        return [
            {
                "title": "⚡ Tối ưu Golang & chống Goroutine Leak",
                "query": "Tôi đang gặp vấn đề rò rỉ goroutine và race condition trong Go microservices. Có skill nào giúp agent rà soát và sửa lỗi này?",
                "icon": "zap",
                "category": "Golang & Concurrency"
            },
            {
                "title": "🚀 Xây dựng Next.js 15 Fullstack & SEO",
                "query": "Tôi cần phát triển web fullstack bằng Next.js 15 App Router với Server Actions, Zod validation và SEO chuẩn Google.",
                "icon": "code",
                "category": "Frontend & Next.js"
            },
            {
                "title": "🤖 Google Antigravity & Subagent Harness",
                "query": "Làm thế nào để tạo autonomous subagents và file SKILL.md chuẩn cho Google Antigravity và Gemini CLI?",
                "icon": "bot",
                "category": "Antigravity Harness"
            },
            {
                "title": "🎨 Chuẩn hóa UI/UX & Tailwind Tokens",
                "query": "Tôi muốn AI sinh giao diện đẹp chuẩn UI/UX Pro Max, hỗ trợ Accessibility WCAG 2.1 và Dark Mode mượt mà.",
                "icon": "sparkles",
                "category": "Design & UI/UX"
            },
            {
                "title": "🛡️ Kiểm toán bảo mật AI & Quét MCP",
                "query": "Tôi muốn kiểm tra bảo mật, quét quyền hạn nguy hiểm và sandbox cho các AI Agent skills và MCP servers.",
                "icon": "shield",
                "category": "Bảo Mật & An Toàn"
            },
            {
                "title": "💡 Người mới: Nên chọn kỹ năng nào trước?",
                "query": "Tôi mới tiếp cận Agentic Coding và thấy quá nhiều kỹ năng bị bội thực. Hãy đề xuất 2-3 kỹ năng nền tảng nhất nên cài đặt trước.",
                "icon": "compass",
                "category": "Khởi Đầu Nhanh"
            }
        ]

    @classmethod
    def _calculate_skill_rag_score(
        cls,
        skill: Skill,
        full_context_text: str,
        query_tokens: List[str]
    ) -> tuple[float, float]:
        """
        Computes RAG relevance score for a skill given normalized context and tokens.
        Returns (total_score, raw_semantic_score).
        """
        score = 0.0
        name_lower = (skill.name or "").lower()
        title_lower = (skill.title or "").lower()
        desc_lower = (skill.description or "").lower()[:500]  # Cap to prevent description keyword spam
        ai_summary_lower = (skill.ai_summary or "").lower()
        cat_lower = (skill.category or "").lower()
        lang_lower = (skill.primary_language or "").lower()
        readme_lower = (skill.readme_preview or "").lower()[:500]
        notes_lower = (skill.comparison_notes or "").lower()[:300]
        audience_lower = (skill.target_audience or "").lower()

        tags_lower = [str(t).lower() for t in (skill.tags or [])]
        runtimes_lower = [str(r).lower() for r in (skill.runtimes or [])]
        use_cases_lower = [str(u).lower() for u in (skill.use_cases or [])]

        # Domain triggers (supporting multi-word phrases and single tokens)
        domain_mapping = {
            # Golang & Concurrency
            "golang": ["golang", "go-agent-skill", "uber-go", "goroutine", "concurrency", "channel", "race"],
            "go": ["golang", "go-agent-skill", "uber-go", "goroutine", "concurrency", "channel"],
            "goroutine": ["golang", "go-agent-skill", "goroutine", "concurrency", "race", "uber-go"],
            "concurrency": ["concurrency", "goroutine", "channel", "race", "golang"],
            "leak": ["goroutine", "memory", "race", "concurrency", "uber-go"],
            "race condition": ["goroutine", "race", "concurrency", "golang"],

            # Next.js & React Frontend
            "next.js": ["nextjs", "next.js", "nextjs-agent-rules", "app router", "server actions", "rsc"],
            "nextjs": ["nextjs", "next.js", "nextjs-agent-rules", "app router", "server actions", "rsc"],
            "next": ["nextjs", "next.js", "nextjs-agent-rules", "app router", "server actions"],
            "react": ["nextjs", "react", "frontend", "components", "tailwind"],
            "app router": ["nextjs", "app router", "nextjs-agent-rules", "rsc"],
            "server actions": ["nextjs", "server actions", "zod", "nextjs-agent-rules"],
            "frontend": ["frontend", "react", "nextjs", "ui-ux-pro-max-skill", "ui-ux-pro-max", "design-system"],

            # UI/UX & Tailwind
            "ui": ["ui-ux-pro-max-skill", "ui-ux-pro-max", "tailwind", "design system", "accessibility", "wcag", "giao diện"],
            "ux": ["ui-ux-pro-max-skill", "ui-ux-pro-max", "design system", "accessibility", "wcag"],
            "design": ["ui-ux-pro-max-skill", "ui-ux-pro-max", "tailwind", "wcag", "design system"],
            "giao diện": ["ui-ux-pro-max-skill", "ui-ux-pro-max", "tailwind", "accessibility", "wcag"],
            "thiết kế": ["ui-ux-pro-max-skill", "ui-ux-pro-max", "tailwind", "design system"],
            "tailwind": ["tailwind", "ui-ux-pro-max-skill", "ui-ux-pro-max", "css"],
            "accessibility": ["accessibility", "wcag", "ui-ux-pro-max-skill", "ui-ux-pro-max"],
            "wcag": ["wcag", "accessibility", "ui-ux-pro-max-skill", "ui-ux-pro-max"],

            # Antigravity & Subagents
            "antigravity": ["google/skills", "antigravity", "subagent", "subagents", "gemini", "deepmind", "skill.md"],
            "google": ["google/skills", "antigravity", "gemini", "deepmind"],
            "gemini": ["google/skills", "antigravity", "gemini"],
            "subagent": ["google/skills", "antigravity", "subagents", "agentic-coding", "deepmind"],
            "subagents": ["google/skills", "antigravity", "subagents", "agentic-coding", "deepmind"],
            "harness": ["google/skills", "antigravity", "codex", "harness"],
            "skill.md": ["google/skills", "antigravity", "subagents"],

            # Codex & Copilot
            "codex": ["codex-prompt-standards", "codex", "copilot", "copilot-instructions", "openai"],
            "copilot": ["codex-prompt-standards", "codex", "copilot", "github copilot", "openai"],
            "prompt": ["codex-prompt-standards", "prompt-engineering", "copilot-instructions"],

            # Security, Audit, Sandbox
            "security": ["security", "safe", "permission", "sandbox", "audit", "injection", "cybersecurity"],
            "bảo mật": ["security", "safe", "permission", "sandbox", "audit", "injection", "cybersecurity"],
            "an toàn": ["security", "safe", "permission", "sandbox", "audit"],
            "sandbox": ["sandbox", "security", "permission", "isolation"],
            "audit": ["audit", "security", "guardrail", "permission"],
            "kiểm toán": ["audit", "security", "guardrail", "permission"],
            "quét lỗi": ["audit", "security", "scanner", "code smells"],
            "injection": ["injection", "security", "command injection"],

            # MCP (Model Context Protocol)
            "mcp": ["mcp-server", "model context protocol", "servers", "tools", "mcp"],
            "model context protocol": ["modelcontextprotocol/servers", "mcp-server", "mcp"],
            "postgres": ["postgres", "postgresql", "modelcontextprotocol/servers", "database"],
            "database": ["modelcontextprotocol/servers", "postgres", "sqlite", "database"],
            "cơ sở dữ liệu": ["modelcontextprotocol/servers", "postgres", "sqlite", "database"],

            # Beginners & Starters
            "bắt đầu": ["google/skills", "codex-prompt-standards", "ui-ux-pro-max-skill", "nextjs-agent-rules"],
            "mới": ["google/skills", "codex-prompt-standards", "ui-ux-pro-max-skill"],
            "người mới": ["google/skills", "codex-prompt-standards", "ui-ux-pro-max-skill"],
            "beginner": ["google/skills", "codex-prompt-standards", "ui-ux-pro-max-skill"],
            "nền tảng": ["google/skills", "codex-prompt-standards", "modelcontextprotocol/servers"],

            # Testing & Quality
            "test": ["testing", "unit test", "table-driven", "pytest", "race"],
            "testing": ["testing", "unit test", "table-driven", "pytest"],
            "kiểm thử": ["testing", "unit test", "table-driven", "pytest"],
            "unit test": ["testing", "unit test", "table-driven"],

            # Python & Data
            "python": ["python", "fastapi", "django", "awesome-python", "langflow"],
        }

        # 1. Check domain triggers against full text
        for trigger, rel_words in domain_mapping.items():
            if trigger in full_context_text:
                for rw in rel_words:
                    if rw in name_lower or rw in title_lower:
                        score += 45.0
                    if any(rw in t for t in tags_lower):
                        score += 35.0
                    if rw in cat_lower or rw == lang_lower:
                        score += 30.0
                    if rw in ai_summary_lower or rw in desc_lower:
                        score += 20.0
                    if rw in readme_lower:
                        score += 10.0

        # 2. Token matches across metadata
        for t in query_tokens:
            if len(t) < 2:
                continue
            if t in name_lower:
                score += 30.0
            if t in title_lower:
                score += 25.0
            if t == lang_lower:
                score += 35.0
            if t in cat_lower:
                score += 25.0
            if any(t in tag for tag in tags_lower):
                score += 20.0
            if any(t in r for r in runtimes_lower):
                score += 15.0
            if any(t in u for u in use_cases_lower):
                score += 15.0
            if t in ai_summary_lower or t in desc_lower:
                score += 10.0
            if t in readme_lower:
                score += 6.0
            if t in notes_lower or t in audience_lower:
                score += 8.0

        raw_score = score
        # Only grant popularity/trending boost if there is actual query relevance
        if raw_score > 0:
            boost = min(float(skill.trending_score or 0.0) * 0.10, 10.0) + min(float(skill.quality_score or 0.0) * 0.05, 5.0)
            if skill.is_featured:
                boost += 5.0
            total_score = raw_score + boost
        else:
            total_score = 0.0

        return round(total_score, 2), round(raw_score, 2)

    @classmethod
    def retrieve_skills(
        cls,
        db: Session,
        query: str,
        history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[int] = None,
        top_k: int = 3,
        language: str = "vi"
    ) -> List[Dict[str, Any]]:
        """
        RAG Step 1: Scans all skills in the database and retrieves the top 2-4 candidates.
        Guarantees high topical relevance and avoids random non-matching filler skills.
        """
        all_skills = db.query(Skill).all()
        if user_id:
            SkillService.populate_user_bookmarks(all_skills, user_id, db)

        # Build full contextual query text
        full_context_text = query.lower().strip()
        if history:
            recent_turns = history[-2:]
            for turn in recent_turns:
                full_context_text += " " + turn.get("content", "").lower()

        # Tokenize with full Unicode support (Vietnamese accented characters + alphanumeric)
        raw_tokens = re.findall(r'[\w\.\-]+', full_context_text)
        stop_words = {
            "có", "và", "là", "các", "những", "cho", "với", "tôi", "muốn", "cần",
            "được", "trong", "của", "để", "thì", "khi", "làm", "sao", "thế", "nào",
            "gì", "á", "ạ", "ơi", "nhé", "nhỉ", "bộ", "lọc", "hay", "quá", "nhiều",
            "khiến", "bị", "bội", "thực", "tìm", "kiếm", "hãy", "giúp", "giải",
            "thích", "đề", "xuất", "vài", "cái", "từng", "dựa", "trên", "sẵn",
            "skill", "skills", "agent", "agents", "tool", "tools",
            "the", "and", "is", "for", "with", "that", "this", "can", "you", "help",
            "what", "how", "i", "to", "in", "a", "an", "on", "of", "some", "want",
            "need", "recommend", "suggest", "explain", "please", "me", "my"
        }
        filtered_tokens = [t for t in raw_tokens if len(t) > 1 and t not in stop_words]
        if not filtered_tokens:
            filtered_tokens = [t for t in raw_tokens if len(t) > 1]

        scored_skills = []
        for s in all_skills:
            total_score, raw_score = cls._calculate_skill_rag_score(s, full_context_text, filtered_tokens)
            scored_skills.append((total_score, raw_score, s))

        # Filter skills with actual semantic relevance
        relevant_matches = [item for item in scored_skills if item[1] > 0]
        relevant_matches.sort(key=lambda x: (x[0], x[2].trending_score or 0), reverse=True)

        k = max(2, min(top_k, 4))
        results = []

        if len(relevant_matches) >= 2:
            # We have at least 2 strong, genuine matches
            top_picks = relevant_matches[:k]
            for total_s, raw_s, skill in top_picks:
                reasons = cls._generate_match_reasons(skill, query, filtered_tokens, language=language)
                tip = cls._generate_quick_tip(skill, language=language)
                # Calibrate match percentage between 80% and 99%
                match_pct = min(99.0, max(80.0, round(78.0 + (raw_s / 150.0) * 21.0, 1)))
                results.append({
                    "skill": skill,
                    "relevance_score": match_pct,
                    "match_reasons": reasons,
                    "quick_tip": tip,
                    "is_direct_match": True
                })

        elif len(relevant_matches) == 1:
            # Exactly 1 direct match: add 1-2 complementary/foundational skills instead of random junk
            best_match = relevant_matches[0]
            reasons = cls._generate_match_reasons(best_match[2], query, filtered_tokens, language=language)
            tip = cls._generate_quick_tip(best_match[2], language=language)
            results.append({
                "skill": best_match[2],
                "relevance_score": min(99.0, max(88.0, round(82.0 + (best_match[1] / 150.0) * 17.0, 1))),
                "match_reasons": reasons,
                "quick_tip": tip,
                "is_direct_match": True
            })

            # Pick complementary foundational skills (Antigravity harness or MCP servers)
            foundational_names = ["google/skills", "modelcontextprotocol/servers", "openai/codex-prompt-standards"]
            added_ids = {best_match[2].id}
            for fn in foundational_names:
                if len(results) >= k:
                    break
                candidate = next((s for s in all_skills if s.name == fn and s.id not in added_ids), None)
                if candidate:
                    added_ids.add(candidate.id)
                    results.append({
                        "skill": candidate,
                        "relevance_score": 82.0,
                        "match_reasons": cls._generate_match_reasons(candidate, query, filtered_tokens, language=language),
                        "quick_tip": cls._generate_quick_tip(candidate, language=language),
                        "is_direct_match": False
                    })

        else:
            # Zero direct matches (off-topic or very general query)
            # Gracefully recommend top curated foundation skills with transparent match score
            curated_picks = sorted(all_skills, key=lambda s: (s.is_featured, s.trending_score or 0), reverse=True)[:k]
            for skill in curated_picks:
                results.append({
                    "skill": skill,
                    "relevance_score": 70.0,
                    "match_reasons": cls._generate_match_reasons(skill, query, filtered_tokens, language=language),
                    "quick_tip": cls._generate_quick_tip(skill, language=language),
                    "is_direct_match": False
                })

        return results

    @classmethod
    def _generate_match_reasons(
        cls,
        skill: Skill,
        query: str,
        tokens: List[str],
        language: str = "vi"
    ) -> List[str]:
        reasons = []
        name_lower = (skill.name or "").lower()
        lang_lower = (skill.primary_language or "").lower()
        cat_lower = (skill.category or "").lower()
        tags_lower = [str(t).lower() for t in (skill.tags or [])]
        is_vi = language == "vi"

        # 1. Golang & Concurrency
        if "golang" in name_lower or "go" == lang_lower or any("golang" in t or "concurrency" in t for t in tags_lower):
            if is_vi:
                reasons.append("Chống rò rỉ goroutine leak, race condition & chuẩn hóa table-driven test trong Go")
                reasons.append("Áp dụng trực tiếp quy chuẩn Uber Go Style Guide & Clean Architecture")
            else:
                reasons.append("Prevents goroutine leaks, race conditions & enforces idiomatic table-driven tests")
                reasons.append("Directly implements Uber Go Style Guide and clean architecture")

        # 2. Google Antigravity & Subagents
        elif "antigravity" in name_lower or "google" in name_lower or any("antigravity" in t or "subagent" in t for t in tags_lower):
            if is_vi:
                reasons.append("Hỗ trợ kiến trúc Autonomous Subagents & chuẩn hóa cấu trúc file SKILL.md")
                reasons.append("Tương thích hoàn hảo với Google Antigravity & Gemini CLI")
            else:
                reasons.append("Enables autonomous subagent workflows & standardized SKILL.md specs")
                reasons.append("100% compatible with Google Antigravity and Gemini CLI harnesses")

        # 3. Next.js & React Server Components
        elif "nextjs" in name_lower or "next" in name_lower or any("nextjs" in t or "react" in t for t in tags_lower):
            if is_vi:
                reasons.append("Chuẩn hóa Next.js 15 App Router, React Server Components và Server Actions")
                reasons.append("Tích hợp Zod input validation và chiến lược revalidateTag SEO tối ưu")
            else:
                reasons.append("Standardizes Next.js 15 App Router, React Server Components & Server Actions")
                reasons.append("Integrates Zod schema validation and optimal revalidateTag caching for SEO")

        # 4. UI/UX & Tailwind CSS
        elif "design" in name_lower or "uiux" in name_lower or any("tailwind" in t or "design-system" in t for t in tags_lower):
            if is_vi:
                reasons.append("Cung cấp hệ thống 8pt grid, Tailwind CSS tokens & dark/light palette")
                reasons.append("Đạt chuẩn tiếp cận WCAG 2.1 AA cho giao diện web/mobile hiện đại")
            else:
                reasons.append("Provides 8pt spatial grid scale, Tailwind CSS tokens & contrast palettes")
                reasons.append("Complies with WCAG 2.1 AA accessibility standards for modern web/mobile UIs")

        # 5. Security, Audit & Sandboxing
        elif "security" in name_lower or "cybersecurity" in name_lower or "scan" in name_lower or any("security" in t or "audit" in t for t in tags_lower):
            if is_vi:
                reasons.append("Kiểm toán quyền hạn runtime, phát hiện nguy cơ command injection và privilege leak")
                reasons.append("Cung cấp guardrails an toàn và phân tích cách ly sandbox cho Agentic workflows")
            else:
                reasons.append("Audits runtime permissions, preventing command injection and credential leaks")
                reasons.append("Establishes strict security guardrails and sandbox compliance for agent workflows")

        # 6. Codex, Copilot & Prompt Engineering
        elif "codex" in name_lower or "copilot" in name_lower or "prompt" in name_lower:
            if is_vi:
                reasons.append("Thiết lập quy chuẩn .github/copilot-instructions.md chặn hallucination")
                reasons.append("Ép AI tuân thủ strict type boundaries và kiến trúc Clean Code")
            else:
                reasons.append("Configures repository-wide .github/copilot-instructions.md preventing hallucinations")
                reasons.append("Enforces strict type boundaries and clean architecture standards")

        # 7. Model Context Protocol (MCP) & Databases
        elif "mcp" in name_lower or "modelcontextprotocol" in name_lower or cat_lower == "mcp-server":
            if is_vi:
                reasons.append("Giao thức MCP tiêu chuẩn mở kết nối an toàn với cơ sở dữ liệu và công cụ ngoài")
                reasons.append("Tương thích với Antigravity, Cursor, Claude Code và Codex harnesses")
            else:
                reasons.append("Open standard Model Context Protocol for secure DB and tool integration")
                reasons.append("Compatible with Antigravity, Cursor, Claude Code, and Codex harnesses")

        # Fallback to use_cases or safe quality metrics
        if not reasons:
            if skill.use_cases and len(skill.use_cases) > 0:
                for uc in skill.use_cases[:2]:
                    if uc and isinstance(uc, str):
                        reasons.append(uc)

        if not reasons:
            q_score = float(skill.quality_score or 0.0)
            stars_val = int(skill.stars or 0)
            if is_vi:
                reasons.append(f"Điểm chất lượng {q_score:.1f}/100 với {stars_val:,} GitHub stars.")
                reasons.append(f"Tương thích với nhóm kỹ năng {skill.category or 'tổng hợp'} và runtime {skill.primary_language or 'đa nền tảng'}.")
            else:
                reasons.append(f"Quality rating of {q_score:.1f}/100 with {stars_val:,} GitHub stars.")
                reasons.append(f"Aligned with {skill.category or 'general'} category on {skill.primary_language or 'multi-platform'}.")

        return reasons[:3]

    @classmethod
    def _generate_quick_tip(cls, skill: Skill, language: str = "vi") -> str:
        name_lower = (skill.name or "").lower()
        is_vi = language == "vi"

        if "google/skills" in name_lower or "antigravity" in name_lower:
            return (
                "Chạy `npx skills add google/skills` hoặc đưa vào thư mục `.gemini/config/skills/`."
                if is_vi else
                "Run `npx skills add google/skills` or copy into `.gemini/config/skills/`."
            )
        elif "codex" in name_lower:
            return (
                "Đặt file cấu hình tại `.github/copilot-instructions.md` trong root repository."
                if is_vi else
                "Place configuration at `.github/copilot-instructions.md` in repository root."
            )
        elif "go-agent-skill" in name_lower or "golang" in name_lower:
            return (
                "Dùng `go test -race ./...` để kiểm chứng hiệu quả sau khi apply chỉ dẫn của skill."
                if is_vi else
                "Run `go test -race ./...` to verify concurrency safety after applying skill rules."
            )
        elif "design" in name_lower or "uiux" in name_lower:
            return (
                "Sử dụng các biến Tailwind token và kiểm tra độ tương phản trước khi render UI."
                if is_vi else
                "Leverage Tailwind CSS tokens and verify contrast ratios before rendering UI."
            )
        elif "nextjs" in name_lower:
            return (
                "Ưu tiên dùng 'use server' với schema Zod tại tầng Action để bảo mật tuyệt đối."
                if is_vi else
                "Always use 'use server' with Zod schemas at the Action layer for security."
            )
        elif "mcp" in name_lower or "server" in name_lower:
            return (
                "Khai báo cấu hình server trong file config của agent harness (VD: cursor.json hoặc antigravity)."
                if is_vi else
                "Declare the server configuration in your agent harness settings (e.g. cursor.json or antigravity)."
            )
        elif "security" in name_lower or "scan" in name_lower:
            return (
                "Chạy lệnh quét bảo mật trước khi cấp quyền can thiệp filesystem hoặc mạng."
                if is_vi else
                "Run security audit before granting filesystem or network execution permissions."
            )

        return (
            "Xem file README và cài đặt vào agent harness của bạn thông qua nút Xuất Cấu Hình."
            if is_vi else
            "Review README and install into your agent harness via Export Config."
        )

    @classmethod
    async def chat(
        cls,
        db: Session,
        query: str,
        history: Optional[List[Dict[str, str]]] = None,
        language: str = "vi",
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Main RAG Chat entrypoint.
        1. Retrieves 2-4 best candidate skills from DB (RAG).
        2. Generates comprehensive explanation & recommendation via Gemini (or intelligent fallback).
        """
        clean_query = query.strip()
        if not clean_query:
            clean_query = "Gợi ý cho tôi các AI Agent Skills nổi bật nhất hiện nay." if language == "vi" else "Recommend the top AI Agent Skills available right now."

        # RAG Step 1: Retrieval
        top_candidates = cls.retrieve_skills(
            db=db,
            query=clean_query,
            history=history,
            user_id=user_id,
            top_k=3,
            language=language
        )

        total_skills_count = db.query(Skill).count()

        # Step 2: Try Gemini AI Generation if API key is available
        if settings.GEMINI_API_KEY and len(top_candidates) > 0:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)

                context_items = []
                for item in top_candidates:
                    s = item["skill"]
                    context_items.append({
                        "id": s.id,
                        "name": s.name,
                        "title": s.title or s.name,
                        "category": s.category,
                        "language": s.primary_language,
                        "stars": s.stars,
                        "description": (s.description or "")[:300],
                        "ai_summary": s.ai_summary,
                        "use_cases": s.use_cases,
                        "relevance_score": item["relevance_score"],
                        "match_reasons": item["match_reasons"],
                        "quick_tip": item["quick_tip"]
                    })

                history_context = []
                if history:
                    for h in history[-4:]:
                        history_context.append(f"{h.get('role', 'user')}: {h.get('content', '')}")

                history_str = "\n".join(history_context)
                context_json = json.dumps(context_items, ensure_ascii=False, indent=2)

                lang_prompt = (
                    "Trả lời hoàn toàn bằng Tiếng Việt kỹ thuật tự nhiên, sắc bén, chuẩn văn phong Senior AI Architect & Principal Engineer."
                    if language == "vi"
                    else "Respond entirely in natural, authoritative English suited for a Principal AI Architect & Senior Software Engineer."
                )

                system_prompt = f"""
                Bạn là Cố vấn Kỹ năng AI (Agent Skills Advisor) chuyên sâu tại hệ thống Agent Skill Trending 2026.
                Bạn đang trao đổi trực tiếp với một kỹ sư phần mềm / kiến trúc sư giải pháp.

                QUY TẮC BẮT BUỘC VỀ VĂN PHONG:
                1. TUYỆT ĐỐI KHÔNG sử dụng câu chào rập khuôn, sáo rỗng hoặc văn mẫu máy móc (CẤM các câu như "Chào bạn! Tôi hoàn toàn thấu hiểu...", "Tôi hiểu bạn bị bội thực thông tin...", "Hệ thống RAG đã quét toàn bộ...").
                2. BẮT ĐẦU TRỰC DIỆN: Đi thẳng vào trọng tâm kỹ thuật, phân tích góc nhìn kiến trúc giải quyết trực tiếp yêu cầu hoặc bài toán người dùng đặt ra.
                3. PHÂN TÍCH CHUYÊN SÂU:
                   - Giải thích rõ tại sao từng kỹ năng được RAG chọn lọc lại giải quyết triệt để vấn đề thực tế (ví dụ: memory/goroutine leaks, race conditions, WCAG contrast violations, CSS tokens consistency, prompt injection, sandboxing, v.v.).
                   - Đưa ra so sánh hoặc gợi ý phối hợp giữa các kỹ năng nếu có nhiều lựa chọn (Architecture Synergy).
                4. HÀNH ĐỘNG THỰC CHIẾN (Actionable): Cung cấp mẹo áp dụng cụ thể (cách khai báo SKILL.md, lệnh kiểm thử, hoặc cấu hình agent harness).
                5. KẾT THÚC BẰNG GỢI Ý: Đưa ra 2-3 câu hỏi gợi ý tiếp theo (Follow-up Questions) ngắn gọn, sắc bén ở cuối.

                Dữ liệu kỹ năng được hệ thống RAG trích xuất:
                {context_json}

                Lịch sử trao đổi gần nhất:
                {history_str or '(Bắt đầu phiên thảo luận mới)'}

                Yêu cầu / Câu hỏi của kỹ sư:
                "{clean_query}"

                {lang_prompt}

                Định dạng trả về: Chuỗi Markdown chuẩn, phân mục rõ ràng với bullet points và code blocks (nếu cần). Không bọc toàn bộ câu trả lời trong block JSON.
                """

                def _generate_with_gemini_sync():
                    # Active models in 2026
                    for candidate_model in ["gemini-3.6-flash", "gemini-3.5-flash"]:
                        try:
                            resp = client.models.generate_content(
                                model=candidate_model,
                                contents=system_prompt,
                            )
                            if resp and resp.text:
                                return resp.text.strip(), candidate_model
                        except Exception as me:
                            logger.warning(f"Model {candidate_model} failed: {me}")
                            err_msg = str(me)
                            # If quota exceeded or 429, break immediately to avoid blocking retries
                            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                                break
                        except Exception as me:
                            logger.warning(f"Model {candidate_model} failed: {me}")
                            err_msg = str(me)
                            # If quota exceeded or 429, break immediately to avoid blocking retries
                            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                                break
                    return "", ""

                # Run synchronous generation off the async event loop
                ai_text, model_name = await asyncio.to_thread(_generate_with_gemini_sync)

                if ai_text:
                    followups = cls._extract_followups(ai_text, language=language, query=clean_query)
                    return {
                        "success": True,
                        "message": ai_text,
                        "recommended_skills": top_candidates,
                        "suggested_followups": followups,
                        "retrieval_stats": {
                            "total_skills_scanned": total_skills_count,
                            "candidates_matched": len(top_candidates),
                            "top_selected": len(top_candidates)
                        },
                        "model_used": model_name,
                        "is_ai_powered": True
                    }

            except Exception as e:
                logger.warning(f"Gemini AI chat call failed, switching to local RAG synthesis engine: {e}")

        # Fallback RAG Synthesis Engine (Offline / No API Key / Fast Deterministic)
        return cls._synthesize_local_rag_response(
            query=clean_query,
            skills=top_candidates,
            total_scanned=total_skills_count,
            language=language
        )

    @classmethod
    def _extract_followups(cls, text: str, language: str = "vi", query: str = "") -> List[str]:
        """Extracts follow-up questions from response text or provides domain-aware defaults."""
        import re
        extracted = []
        lines = text.split("\n")
        in_followup_section = False

        for line in lines:
            stripped = line.strip()
            if any(k in stripped.lower() for k in ["câu hỏi gợi ý", "gợi ý tiếp theo", "suggested follow", "follow-up questions"]):
                in_followup_section = True
                continue
            if in_followup_section:
                if stripped.startswith(("#", "---")):
                    break
                if stripped.startswith(("-", "*", "1.", "2.", "3.")) and ("?" in stripped or len(stripped) > 10):
                    clean = re.sub(r"^[-*0-9.\s]+", "", stripped).strip()
                    if clean:
                        extracted.append(clean)
                        if len(extracted) >= 3:
                            break

        if len(extracted) >= 2:
            return extracted[:3]

        # Domain-aware dynamic defaults
        q_lower = query.lower()
        is_vi = language == "vi"

        if any(k in q_lower for k in ["ui", "ux", "giao diện", "design", "tailwind"]):
            return [
                "Làm sao để trích xuất token màu và typography vào Tailwind config?",
                "Kỹ năng này có kiểm tra độ tương phản WCAG 2.1 tự động không?",
                "Cách áp dụng skill này vào dự án React / Next.js hiện tại?"
            ] if is_vi else [
                "How do I export color and typography tokens into Tailwind config?",
                "Does this skill include automated WCAG 2.1 contrast checks?",
                "How do I apply this skill to an existing Next.js project?"
            ]
        elif any(k in q_lower for k in ["go", "golang", "goroutine", "concurrency"]):
            return [
                "Làm sao để tích hợp rule phòng chống goroutine leak vào CI/CD?",
                "Cho tôi xem ví dụ test race condition với table-driven tests.",
                "Kỹ năng này áp dụng cho Go 1.22+ net/http như thế nào?"
            ] if is_vi else [
                "How do I integrate goroutine leak prevention into CI/CD?",
                "Can you show a race condition test using table-driven tests?",
                "How does this skill support Go 1.22+ enhanced routing?"
            ]
        elif any(k in q_lower for k in ["security", "bảo mật", "sandbox", "audit"]):
            return [
                "Làm sao để thiết lập sandbox an toàn khi agent chạy bash script?",
                "Cách ngăn chặn prompt injection khi nạp tài liệu ngoại vi?",
                "Skill này có hỗ trợ audit quyền truy cập filesystem không?"
            ] if is_vi else [
                "How do I configure a secure sandbox for agent bash executions?",
                "How can I mitigate prompt injection from retrieved context?",
                "Does this skill support auditing filesystem permissions?"
            ]

        defaults_vi = [
            "Làm sao để tích hợp kỹ năng này vào Google Antigravity?",
            "Cho tôi xem ví dụ code trước và sau khi áp dụng quy chuẩn này.",
            "Kỹ năng này có thể kết hợp với MCP Server nào không?"
        ]
        defaults_en = [
            "How do I install this skill into Google Antigravity?",
            "Show me a before/after code snippet with this skill applied.",
            "Can I combine this skill with an MCP server?"
        ]
        return defaults_vi if is_vi else defaults_en

    @classmethod
    def _synthesize_local_rag_response(
        cls,
        query: str,
        skills: List[Dict[str, Any]],
        total_scanned: int,
        language: str = "vi"
    ) -> Dict[str, Any]:
        """
        Provides intelligent, dynamic, context-aware RAG synthesis when Gemini API key is offline or absent.
        """
        is_vi = language == "vi"
        has_direct_matches = any(item.get("is_direct_match", True) for item in skills)
        q_clean = query.strip()
        q_lower = q_clean.lower()

        if is_vi:
            if any(k in q_lower for k in ["ui", "ux", "giao diện", "design", "tailwind", "css", "wcag", "frontend"]):
                domain_prefix = f"Đối với bài toán chuẩn hóa UI/UX và thiết kế giao diện (*\"{q_clean}\"*),"
            elif any(k in q_lower for k in ["go", "golang", "goroutine", "concurrency", "channel", "race"]):
                domain_prefix = f"Về bài toán concurrency và kiểm soát goroutines/microservices trong Go (*\"{q_clean}\"*),"
            elif any(k in q_lower for k in ["next", "nextjs", "react", "fullstack", "server action"]):
                domain_prefix = f"Đối với kiến trúc fullstack với Next.js và Server Actions (*\"{q_clean}\"*),"
            elif any(k in q_lower for k in ["security", "bảo mật", "sandbox", "audit", "lỗ hổng", "injection"]):
                domain_prefix = f"Về giải pháp bảo mật, phân quyền sandbox và audit an toàn (*\"{q_clean}\"*),"
            elif any(k in q_lower for k in ["antigravity", "gemini", "agent harness", "skill"]):
                domain_prefix = f"Về cấu hình và chuẩn hóa kỹ năng cho AI Agent (*\"{q_clean}\"*),"
            else:
                domain_prefix = f"Dựa trên yêu cầu kỹ thuật *\"{q_clean}\"*,"

            if has_direct_matches:
                intro = (
                    f"{domain_prefix} hệ thống RAG đã chọn lọc và đối chiếu được **{len(skills)} kỹ năng tối ưu nhất** "
                    f"để áp dụng trực tiếp vào kiến trúc dự án của bạn:\n\n"
                )
            else:
                intro = (
                    f"{domain_prefix} mặc dù chưa khớp từ khóa chuyên biệt tuyệt đối, hệ thống RAG đã chọn lọc "
                    f"**{len(skills)} kỹ năng nền tảng vững chắc nhất** để bạn bắt đầu:\n\n"
                )

            sections = []
            for idx, item in enumerate(skills, 1):
                s = item["skill"]
                reasons_md = "\n".join([f"  - {r}" for r in item["match_reasons"]])
                summary = s.ai_summary or s.description or "Bộ quy chuẩn chất lượng cao dành cho Coding Agent."
                runtimes_display = (', '.join(s.runtimes)) if s.runtimes else 'Mọi IDE / Harness'
                sections.append(
                    f"### {idx}. 🎯 **{s.title or s.name}** `({item['relevance_score']}% Phù Hợp)`\n"
                    f"- **Tác giả:** `{s.author or 'cộng đồng'}` | **Đánh giá:** ⭐ {(s.stars or 0):,} stars | **Runtime:** `{runtimes_display}`\n"
                    f"- **Giải pháp cho bài toán của bạn:**\n{reasons_md}\n"
                    f"- **Giá trị kiến trúc:** {summary}\n"
                    f"- **💡 Mẹo áp dụng thực chiến:** {item['quick_tip']}\n"
                )

            synergy = ""
            if len(skills) > 1:
                first_name = skills[0]["skill"].name
                second_name = skills[1]["skill"].name
                synergy = (
                    f"\n---\n"
                    f"### 💡 Gợi ý phối hợp kiến trúc (Architecture Synergy):\n"
                    f"Bạn nên kết hợp song song `{first_name}` làm nền tảng định hình quy chuẩn "
                    f"và `{second_name}` để thực thi kiểm thử hoặc tinh chỉnh chuyên sâu, tạo thành chu trình kiểm soát kép an toàn.\n"
                )

            conclusion = (
                f"\n---\n"
                f"### 🚀 Hành động tiếp theo:\n"
                f"Bấm **'Xem Chi Tiết'** trên thẻ kỹ năng bên dưới để xem toàn bộ tài liệu cấu hình, hoặc bấm **'Sao Chép Cấu Hình'** để cài đặt trực tiếp vào agent harness của bạn."
            )

            full_message = intro + "\n".join(sections) + synergy + conclusion
            followups = cls._extract_followups(full_message, language="vi", query=q_clean)

        else:
            if any(k in q_lower for k in ["ui", "ux", "design", "tailwind", "css", "wcag", "frontend"]):
                domain_prefix = f"Regarding your UI/UX and design system focus for *\"{q_clean}\"*,"
            elif any(k in q_lower for k in ["go", "golang", "goroutine", "concurrency", "channel", "race"]):
                domain_prefix = f"Regarding Go concurrency, goroutine safety, and microservice resilience for *\"{q_clean}\"*,"
            elif any(k in q_lower for k in ["next", "nextjs", "react", "fullstack", "server action"]):
                domain_prefix = f"Regarding Next.js fullstack architecture and Server Actions for *\"{q_clean}\"*,"
            elif any(k in q_lower for k in ["security", "sandbox", "audit", "injection"]):
                domain_prefix = f"Regarding agent security posture, sandboxing, and audit safety for *\"{q_clean}\"*,"
            elif any(k in q_lower for k in ["antigravity", "gemini", "agent harness", "skill"]):
                domain_prefix = f"Regarding agent harness configuration and skill standards for *\"{q_clean}\"*,"
            else:
                domain_prefix = f"Based on your technical requirements for *\"{q_clean}\"*,"

            if has_direct_matches:
                intro = (
                    f"{domain_prefix} our RAG engine has selected the **{len(skills)} most relevant skills** "
                    f"to directly solve your challenge:\n\n"
                )
            else:
                intro = (
                    f"{domain_prefix} while no single keyword matched exactly, our RAG engine identified "
                    f"the **{len(skills)} most versatile foundational skills** for your stack:\n\n"
                )

            sections = []
            for idx, item in enumerate(skills, 1):
                s = item["skill"]
                reasons_md = "\n".join([f"  - {r}" for r in item["match_reasons"]])
                summary = s.ai_summary or s.description or "Production-grade agent standard."
                runtimes_display = (', '.join(s.runtimes)) if s.runtimes else 'Any IDE / Harness'
                sections.append(
                    f"### {idx}. 🎯 **{s.title or s.name}** `({item['relevance_score']}% Match)`\n"
                    f"- **Author / Repo:** `{s.author or 'community'}` | **Stars:** ⭐ {(s.stars or 0):,} | **Runtime:** `{runtimes_display}`\n"
                    f"- **Why it fits your need:**\n{reasons_md}\n"
                    f"- **Architectural Value:** {summary}\n"
                    f"- **💡 Actionable Pro Tip:** {item['quick_tip']}\n"
                )

            synergy = ""
            if len(skills) > 1:
                first_name = skills[0]["skill"].name
                second_name = skills[1]["skill"].name
                synergy = (
                    f"\n---\n"
                    f"### 💡 Architectural Synergy:\n"
                    f"We recommend pairing `{first_name}` as your baseline governance standard "
                    f"with `{second_name}` for domain execution, giving your agent end-to-end reliability.\n"
                )

            conclusion = (
                f"\n---\n"
                f"### 🚀 Next Steps:\n"
                f"Click **'View Details'** on any card below to review its full specifications, or copy the export snippet into your agent harness configuration."
            )

            full_message = intro + "\n".join(sections) + synergy + conclusion
            followups = cls._extract_followups(full_message, language="en", query=q_clean)

        return {
            "success": True,
            "message": full_message,
            "recommended_skills": skills,
            "suggested_followups": followups,
            "retrieval_stats": {
                "total_skills_scanned": total_scanned,
                "candidates_matched": len(skills),
                "top_selected": len(skills)
            },
            "model_used": "rag-semantic-engine",
            "is_ai_powered": False
        }
