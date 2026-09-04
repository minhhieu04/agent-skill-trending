import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from config import settings
from models.skill import Skill
from services.skill_service import SkillService

logger = logging.getLogger("LearningTrackService")

class LearningTrackService:
    @staticmethod
    async def recommend_track(
        db: Session,
        goal_query: str,
        language: str = "vi",
        user_id: Optional[int] = None,
        max_skills: int = 8
    ) -> Dict[str, Any]:
        """
        Analyzes the user's natural language goal/query and recommends a structured
        learning path (milestones) paired with matching AI Agent Skills from the database.
        Uses Gemini AI if available, with an intelligent semantic rule fallback.
        """
        clean_goal = goal_query.strip()
        if not clean_goal:
            clean_goal = "Học lập trình và ứng dụng AI Agent" if language == "vi" else "Learn programming with AI Agents"

        # 1. Fetch all skills from the database
        all_skills = db.query(Skill).order_by(desc(Skill.trending_score)).all()
        if user_id:
            SkillService.populate_user_bookmarks(all_skills, user_id, db)

        skills_catalog = [
            {
                "id": s.id,
                "name": s.name,
                "title": s.title or s.name,
                "category": s.category,
                "primary_language": s.primary_language or "All",
                "runtimes": s.runtimes or [],
                "tags": s.tags or [],
                "description": (s.description or "")[:150],
                "trending_score": s.trending_score,
                "stars": s.stars,
                "difficulty": s.difficulty or "intermediate"
            }
            for s in all_skills
        ]

        skills_by_id = {s.id: s for s in all_skills}

        # 2. Try using Gemini AI for deep semantic reasoning & curation
        if settings.GEMINI_API_KEY and len(skills_catalog) > 0:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)

                catalog_subset = skills_catalog[:35]  # Feed top 35 skills to avoid token bloating
                catalog_json = json.dumps(catalog_subset, ensure_ascii=False)

                lang_instruction = "Trả lời hoàn toàn bằng Tiếng Việt chuẩn mực, mạch lạc, thực tế." if language == "vi" else "Answer completely in professional and natural English."

                prompt = f"""
                Bạn là Principal AI Software Architect & Cố vấn Lộ trình Công nghệ hàng đầu.
                Người dùng muốn đạt mục tiêu sau: "{clean_goal}".

                Dưới đây là danh mục các Kỹ năng AI Agent / Bộ quy chuẩn code (Skills) hiện có trong hệ thống:
                {catalog_json}

                Nhiệm vụ của bạn:
                1. Phân tích mục tiêu học tập / kỹ thuật của người dùng.
                2. Xây dựng một lộ trình 3 giai đoạn bài bản (Giai đoạn 1: Nền tảng & Cấu trúc, Giai đoạn 2: Nâng cao & Thực hành sâu, Giai đoạn 3: AI Agent & Production).
                3. Chọn lọc từ danh mục kỹ năng trên những `id` phù hợp nhất cho từng giai đoạn và giải thích lý do cụ thể vì sao cần dùng skill đó cho mục tiêu của họ.
                4. Cung cấp các lời khuyên thực chiến (ai_tips).

                {lang_instruction}

                BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SCHEMA SAU (không kèm văn bản ngoài JSON):
                {{
                  "summary": "Tóm tắt phân tích mục tiêu và định hướng lộ trình ngắn gọn 2-3 câu",
                  "difficulty_level": "Beginner / Intermediate / Advanced / All Levels",
                  "estimated_time": "3 - 5 tuần",
                  "target_technologies": ["React", "Next.js", "TypeScript", "Tailwind CSS"],
                  "roadmap": [
                    {{
                      "stage_number": 1,
                      "title": "Giai đoạn 1: Tên giai đoạn",
                      "description": "Mô tả nội dung cần học và thực hành ở giai đoạn này",
                      "recommended_skill_ids": [1, 2],
                      "key_takeaways": ["Điểm cốt lõi 1", "Điểm cốt lõi 2"]
                    }},
                    {{
                      "stage_number": 2,
                      "title": "Giai đoạn 2: Tên giai đoạn",
                      "description": "Mô tả nội dung giai đoạn 2",
                      "recommended_skill_ids": [3],
                      "key_takeaways": ["Điểm cốt lõi 1", "Điểm cốt lõi 2"]
                    }},
                    {{
                      "stage_number": 3,
                      "title": "Giai đoạn 3: Tên giai đoạn",
                      "description": "Mô tả nội dung giai đoạn 3",
                      "recommended_skill_ids": [4],
                      "key_takeaways": ["Điểm cốt lõi 1", "Điểm cốt lõi 2"]
                    }}
                  ],
                  "recommended_skills": [
                    {{
                      "skill_id": 1,
                      "match_score": 98.0,
                      "reason": "Lý do vì sao skill này là vũ khí không thể thiếu cho mục tiêu của bạn",
                      "stage_number": 1
                    }}
                  ],
                  "ai_tips": [
                    "Lời khuyên 1 cho người học...",
                    "Lời khuyên 2..."
                  ]
                }}
                """

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )

                if response and response.text:
                    raw_text = response.text.strip()
                    # Clean markdown codeblocks if any
                    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_text)
                    if json_match:
                        raw_text = json_match.group(1).strip()

                    parsed = json.loads(raw_text)

                    # Enrich recommended_skills with actual DB Skill objects
                    enriched_skills = []
                    seen_ids = set()
                    for item in parsed.get("recommended_skills", []):
                        raw_id = item.get("skill_id")
                        try:
                            s_id = int(raw_id)
                        except (ValueError, TypeError):
                            continue
                        if s_id in skills_by_id and s_id not in seen_ids:
                            seen_ids.add(s_id)
                            skill_obj = skills_by_id[s_id]
                            enriched_skills.append({
                                "skill": skill_obj,
                                "match_score": float(item.get("match_score", 95.0)),
                                "reason": item.get("reason", "Phù hợp cao với mục tiêu dự án"),
                                "stage_number": int(item.get("stage_number", 1))
                            })

                    # If some stages have recommended_skill_ids not in enriched_skills, add them
                    sanitized_roadmap = []
                    for stage in parsed.get("roadmap", []):
                        clean_ids = []
                        for raw_s_id in stage.get("recommended_skill_ids", []):
                            try:
                                s_id = int(raw_s_id)
                            except (ValueError, TypeError):
                                continue
                            if s_id in skills_by_id:
                                clean_ids.append(s_id)
                                if s_id not in seen_ids and len(enriched_skills) < max_skills:
                                    seen_ids.add(s_id)
                                    enriched_skills.append({
                                        "skill": skills_by_id[s_id],
                                        "match_score": 90.0,
                                        "reason": f"Kỹ năng cần thiết cho {stage.get('title', 'giai đoạn này')}",
                                        "stage_number": int(stage.get("stage_number", 1))
                                    })
                        stage["recommended_skill_ids"] = clean_ids
                        sanitized_roadmap.append(stage)

                    if enriched_skills:
                        return {
                            "success": True,
                            "is_ai_powered": True,
                            "goal_query": clean_goal,
                            "summary": parsed.get("summary", ""),
                            "difficulty_level": parsed.get("difficulty_level", "Intermediate"),
                            "estimated_time": parsed.get("estimated_time", "2 - 4 tuần"),
                            "target_technologies": parsed.get("target_technologies", []),
                            "roadmap": sanitized_roadmap,
                            "recommended_skills": enriched_skills,
                            "ai_tips": parsed.get("ai_tips", [])
                        }
            except Exception as e:
                logger.warning(f"Gemini AI Learning Track recommendation failed: {e}. Falling back to semantic engine.")

        # 3. Fallback Semantic & Intent Matching Engine
        return LearningTrackService._fallback_semantic_recommend(
            clean_goal=clean_goal,
            all_skills=all_skills,
            language=language,
            max_skills=max_skills
        )

    @staticmethod
    def _fallback_semantic_recommend(
        clean_goal: str,
        all_skills: List[Skill],
        language: str = "vi",
        max_skills: int = 8
    ) -> Dict[str, Any]:
        """
        Intelligent rule-based and keyword-scoring semantic fallback engine.
        """
        lower_goal = clean_goal.lower()

        # Domain intent detection
        is_frontend = any(k in lower_goal for k in ["front", "react", "next", "vue", "tailwind", "ui", "ux", "css", "html", "web", "giao diện", "trang web", "design"])
        is_backend = any(k in lower_goal for k in ["back", "api", "server", "microservice", "database", "sql", "postgres", "redis", "node", "express", "django", "fastapi", "golang", "go", "rust", "cơ sở dữ liệu"])
        is_golang = any(k in lower_goal for k in ["go", "golang", "gopher", "goroutine"])
        is_python = any(k in lower_goal for k in ["python", "django", "fastapi", "flask", "ai", "pandas", "pytorch"])
        is_ai_agent = any(k in lower_goal for k in ["agent", "mcp", "subagent", "cursor", "antigravity", "codex", "claude", "llm", "prompt", "rule", "protocol", "bot"])
        is_devops = any(k in lower_goal for k in ["devops", "docker", "k8s", "kubernetes", "ci", "cd", "cloud", "aws", "gcp", "deploy"])
        is_scraping = any(k in lower_goal for k in ["scrape", "cào", "crawl", "crawler", "playwright", "selenium", "thu thập"])

        # Determine Primary Category & Track
        if is_golang:
            primary_topic = "Golang & High Performance Backend" if language == "vi" else "Golang & High Performance Backend"
            difficulty = "Intermediate"
            est_time = "3 - 5 tuần" if language == "vi" else "3 - 5 weeks"
            tech_stack = ["Go", "Goroutines", "REST/gRPC", "Docker", "Antigravity Rules"]
            stages = [
                {
                    "stage_number": 1,
                    "title": "Giai đoạn 1: Go Idiomatic & Concurrency" if language == "vi" else "Stage 1: Go Idiomatic & Concurrency",
                    "description": "Nắm vững cú pháp chuẩn Go, quản lý bộ nhớ, channels, goroutines và table-driven testing." if language == "vi" else "Master standard Go syntax, memory allocation, channels, and table-driven unit tests.",
                    "key_takeaways": ["Viết code Go chuẩn idiomatic", "Xử lý lỗi error-handling triệt để", "Phòng chống Goroutine leak"] if language == "vi" else ["Idiomatic Go syntax", "Strict error handling", "Goroutine leak prevention"]
                },
                {
                    "stage_number": 2,
                    "title": "Giai đoạn 2: Microservices & Database Optimization" if language == "vi" else "Stage 2: Microservices & Database Optimization",
                    "description": "Thiết kế REST/gRPC APIs, kết nối PostgreSQL/Redis với connection pooling và context timeout." if language == "vi" else "Design REST/gRPC APIs, PostgreSQL/Redis pooling, and context propagation.",
                    "key_takeaways": ["Tối ưu truy vấn DB", "Context cancellation & timeout", "Benchmarking & Profiling"] if language == "vi" else ["DB query optimization", "Context cancellation", "Benchmarking"]
                },
                {
                    "stage_number": 3,
                    "title": "Giai đoạn 3: Tăng Tốc với AI Agent Coding" if language == "vi" else "Stage 3: AI Agent Accelerated Coding",
                    "description": "Ứng dụng các bộ Go Skills, Cursor Rules và Antigravity Subagents để sinh boilerplate và audit bảo mật tự động." if language == "vi" else "Apply Go AI skills and Antigravity subagents for automated boilerplate and security audits.",
                    "key_takeaways": ["Tự động sinh mock và unit test", "AI Code review & linting", "Triển khai Containerized"] if language == "vi" else ["Automated mocking", "AI code review", "Docker deployment"]
                }
            ]
        elif is_frontend:
            primary_topic = "Modern Frontend & Next.js 15" if language == "vi" else "Modern Frontend & Next.js 15"
            difficulty = "Beginner to Intermediate"
            est_time = "3 - 4 tuần" if language == "vi" else "3 - 4 weeks"
            tech_stack = ["React 19", "Next.js 15", "TypeScript", "Tailwind CSS", "UI/UX Pro"]
            stages = [
                {
                    "stage_number": 1,
                    "title": "Giai đoạn 1: Nền tảng React & Thiết kế UI Hiện Đại" if language == "vi" else "Stage 1: React Fundamentals & Modern UI",
                    "description": "Nắm vững React Hooks, component lifecycle, styling chuẩn Tailwind CSS và hệ thống Design Token." if language == "vi" else "Master React Hooks, Tailwind CSS styling, and design token architecture.",
                    "key_takeaways": ["Xây dựng UI responsive", "WCAG accessibility", "Component reusability"] if language == "vi" else ["Responsive UI", "WCAG accessibility", "Reusable components"]
                },
                {
                    "stage_number": 2,
                    "title": "Giai đoạn 2: Next.js App Router & Server Components" if language == "vi" else "Stage 2: Next.js App Router & Server Components",
                    "description": "Kiến trúc Server Components (RSC), Server Actions với Zod validation và tối ưu hóa SEO." if language == "vi" else "Architect Server Components (RSC), Server Actions with Zod validation, and SEO performance.",
                    "key_takeaways": ["Phân chia Client/Server Component", "Quản lý Global State hiệu quả", "Tối ưu Web Vitals"] if language == "vi" else ["Client vs Server boundaries", "Global state management", "Core Web Vitals"]
                },
                {
                    "stage_number": 3,
                    "title": "Giai đoạn 3: Tự Động Hóa UI với AI Skills" if language == "vi" else "Stage 3: UI Automation with AI Skills",
                    "description": "Tích hợp UI/UX Pro Max rules và Frontend Best Practices vào Cursor / Antigravity để code giao diện 10x tốc độ." if language == "vi" else "Integrate UI/UX Pro Max and Frontend rules into Cursor / Antigravity for 10x development velocity.",
                    "key_takeaways": ["Prompt ép AI sinh code giao diện chuẩn", "Dark/Light mode tự động", "Animation Framer Motion mượt mà"] if language == "vi" else ["Strict AI UI generation", "Smooth animations", "Design system consistency"]
                }
            ]
        elif is_ai_agent or is_scraping:
            primary_topic = "AI Agents, Subagents & MCP Protocols" if language == "vi" else "AI Agents, Subagents & MCP Protocols"
            difficulty = "Intermediate to Advanced"
            est_time = "2 - 4 tuần" if language == "vi" else "2 - 4 weeks"
            tech_stack = ["Model Context Protocol (MCP)", "Google Antigravity", "OpenAI Codex", "Python/TypeScript", "Autonomous Workflows"]
            stages = [
                {
                    "stage_number": 1,
                    "title": "Giai đoạn 1: Kiến Trúc Agent & Định Dạng SKILL.md" if language == "vi" else "Stage 1: Agent Architecture & SKILL.md Specs",
                    "description": "Hiểu cơ chế hoạt động của Agent, Sandbox tools, memory context và quy chuẩn viết file SKILL.md." if language == "vi" else "Understand autonomous agent execution, sandbox tool constraints, and SKILL.md specifications.",
                    "key_takeaways": ["Cấu trúc file SKILL.md chuẩn", "Tool calling & Argument schema", "Zero-shot prompt constraints"] if language == "vi" else ["Standard SKILL.md schema", "Tool calling protocols", "Context management"]
                },
                {
                    "stage_number": 2,
                    "title": "Giai đoạn 2: Xây Dựng MCP Servers & Kết Nối Dữ Liệu" if language == "vi" else "Stage 2: Building MCP Servers & Tool Integration",
                    "description": "Phát triển MCP Servers kết nối cơ sở dữ liệu, GitHub, Slack và web search cho Claude Desktop và Cursor." if language == "vi" else "Build custom MCP servers connecting Postgres, GitHub, and browser tools to Claude and Cursor.",
                    "key_takeaways": ["Giao thức Model Context Protocol", "Bảo mật sandbox & permissions", "Xử lý dữ liệu thời gian thực"] if language == "vi" else ["MCP Protocol specification", "Sandbox security permissions", "Real-time tool execution"]
                },
                {
                    "stage_number": 3,
                    "title": "Giai đoạn 3: Đa Tác Tử (Multi-Subagents) & Planning Mode" if language == "vi" else "Stage 3: Multi-Subagent Orchestration & Planning Mode",
                    "description": "Thiết lập quy trình Subagents tự trị, chia nhỏ bài toán lớn và tự động xác thực kết quả." if language == "vi" else "Coordinate autonomous subagents with planning mode workflows and automated test verification.",
                    "key_takeaways": ["Orchestrating Subagents", "Planning Mode workflows", "Self-healing debug pipelines"] if language == "vi" else ["Subagent coordination", "Planning mode verification", "Automated debugging"]
                }
            ]
        else:
            primary_topic = "Full-Stack Development & AI Accelerated Coding" if language == "vi" else "Full-Stack Development & AI Accelerated Coding"
            difficulty = "All Levels"
            est_time = "3 - 5 tuần" if language == "vi" else "3 - 5 weeks"
            tech_stack = ["TypeScript/Python", "FastAPI/Next.js", "AI Agent Skills", "Security Guardrails"]
            stages = [
                {
                    "stage_number": 1,
                    "title": "Giai đoạn 1: Nền Tảng Kỹ Thuật & Cấu Trúc Mã Nguồn" if language == "vi" else "Stage 1: Core Fundamentals & Code Architecture",
                    "description": "Thiết lập cấu trúc dự án chuẩn, quy ước kiểu dữ liệu chặt chẽ và luồng dữ liệu một chiều." if language == "vi" else "Establish clean architectural patterns, strict type definitions, and unidirectional data flow.",
                    "key_takeaways": ["Cấu trúc code sạch và dễ mở rộng", "Ràng buộc type-safety", "Quy chuẩn đặt tên và module"] if language == "vi" else ["Clean architecture", "Strict type safety", "Modular design"]
                },
                {
                    "stage_number": 2,
                    "title": "Giai đoạn 2: Xây Dựng Tính Năng & Tối Ưu Hiệu Năng" if language == "vi" else "Stage 2: Feature Development & Performance Optimization",
                    "description": "Phát triển các module chức năng chính, tích hợp APIs, caching và kiểm thử tự động." if language == "vi" else "Implement core functional modules, robust API integrations, caching, and automated testing.",
                    "key_takeaways": ["Tối ưu độ trễ & xử lý bất đồng bộ", "Xử lý lỗi toàn diện", "Viết unit test & integration test"] if language == "vi" else ["Low-latency async handling", "Comprehensive error handling", "Unit & integration testing"]
                },
                {
                    "stage_number": 3,
                    "title": "Giai đoạn 3: Nâng Cấp Năng Suất 10x với AI Rules" if language == "vi" else "Stage 3: 10x Productivity with AI Coding Rules",
                    "description": "Trang bị các bộ AI Rules chuyên dụng cho IDE giúp tự động sinh code chuẩn, refactor và review an toàn." if language == "vi" else "Equip custom AI skills for your IDE to automate boilerplate, refactoring, and security audits.",
                    "key_takeaways": ["Tận dụng prompt rules thông minh", "Bảo vệ an toàn bảo mật mã nguồn", "Triển khai production ổn định"] if language == "vi" else ["Smart prompt rules", "Security guardrail verification", "Production stability"]
                }
            ]

        # Score & Rank all skills against the goal
        scored_skills = []
        for s in all_skills:
            score = 50.0  # base
            reasons = []

            # 1. Keyword check in title/name
            name_lower = (s.name + " " + (s.title or "")).lower()
            desc_lower = (s.description or "").lower()
            tags_lower = [t.lower() for t in (s.tags or [])]
            lang_lower = (s.primary_language or "").lower()

            if is_golang and ("go" in name_lower or "go" == lang_lower or "go" in tags_lower):
                score += 40.0
                reasons.append("Chuyên biệt cho hệ sinh thái Go & Antigravity/Cursor" if language == "vi" else "Specialized for Go ecosystem")
            elif is_frontend and any(f in name_lower or f in desc_lower or f in tags_lower for f in ["react", "next", "ui", "tailwind", "css", "web", "frontend"]):
                score += 40.0
                reasons.append("Bộ quy chuẩn thiết kế UI/UX và frontend React/Next.js tối ưu" if language == "vi" else "Optimized for React/Next.js and UI/UX design")
            elif (is_ai_agent or is_scraping) and any(a in name_lower or a in desc_lower or a in tags_lower for a in ["mcp", "agent", "antigravity", "codex", "subagent", "scrape", "crawl"]):
                score += 40.0
                reasons.append("Chuẩn giao thức MCP & tự động hóa AI Agent tiên tiến" if language == "vi" else "Advanced MCP Protocol & AI Agent automation")

            # General keyword matching
            for word in lower_goal.split():
                if len(word) >= 3 and (word in name_lower or word in desc_lower or word in tags_lower):
                    score += 15.0

            # Quality bonus
            score += min(15.0, (s.trending_score or 0) * 0.15)
            if s.is_featured:
                score += 5.0

            match_pct = min(99.0, max(75.0, score))
            default_reason = f"Được đề xuất cao cho lộ trình {primary_topic}" if language == "vi" else f"Highly recommended for {primary_topic}"
            reason_text = reasons[0] if reasons else default_reason

            scored_skills.append((match_pct, s, reason_text))

        scored_skills.sort(key=lambda x: x[0], reverse=True)
        top_skills = scored_skills[:max_skills]

        # Distribute skills into stages
        enriched_skills = []
        for idx, (match_score, skill_obj, reason_text) in enumerate(top_skills):
            stage_num = (idx % 3) + 1
            enriched_skills.append({
                "skill": skill_obj,
                "match_score": round(match_score, 1),
                "reason": reason_text,
                "stage_number": stage_num
            })

        # Add skill IDs to stages
        for stage in stages:
            stage["recommended_skill_ids"] = [
                item["skill"].id for item in enriched_skills if item["stage_number"] == stage["stage_number"]
            ]

        summary_text = (
            f"Lộ trình được tinh chỉnh riêng cho mục tiêu '{clean_goal}'. Bạn sẽ bắt đầu từ việc chuẩn hóa nền tảng kỹ thuật và cấu trúc, sau đó nâng cao chuyên sâu và kết hợp với các bộ AI Agent Skills tuyển chọn để đạt tốc độ phát triển 10x."
            if language == "vi"
            else f"Custom learning track curated for '{clean_goal}'. You will start from solid fundamentals and architecture, progress into deep dive practices, and leverage curated AI Agent Skills for 10x developer productivity."
        )

        ai_tips = [
            "Tập trung thực hành theo từng giai đoạn, cài đặt bộ AI Rules tương ứng vào IDE (Cursor / Antigravity) để AI tự động tuân thủ quy chuẩn.",
            "Sử dụng tính năng so sánh (Compare) và Playground để thử nghiệm phản hồi của prompt trước khi áp dụng vào dự án thực tế.",
            "Lưu (Bookmark) các skills này để nhận thông báo cập nhật khi cộng đồng đóng góp phiên bản mới."
        ] if language == "vi" else [
            "Focus on practicing stage by stage, installing matching AI rules into your IDE to enforce clean standards.",
            "Use the built-in Compare and Playground features to test prompt variations before applying them to production.",
            "Bookmark these skills to stay updated with the latest community versions and improvements."
        ]

        return {
            "success": True,
            "is_ai_powered": False,
            "goal_query": clean_goal,
            "summary": summary_text,
            "difficulty_level": difficulty,
            "estimated_time": est_time,
            "target_technologies": tech_stack,
            "roadmap": stages,
            "recommended_skills": enriched_skills,
            "ai_tips": ai_tips
        }
