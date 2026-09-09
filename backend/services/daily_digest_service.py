import os
import re
import json
import asyncio
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from config import settings
from models.skill import Skill
from models.daily_digest import DailyDigest
from services.tts_service import TTSService

logger = logging.getLogger("DailyDigestService")

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


class DailyDigestService:
    """
    Service responsible for synthesizing Daily AI Podcast episodes & practical skill summaries.
    Answers the core question: 'Nó có tác dụng gì trong thực tế?' (What does it actually do?)
    Generates rich daily digests, podcast audio scripts, and audio TTS.
    """

    @classmethod
    def get_available_dates(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Returns a sorted list of unique dates where skills were discovered or digests exist.
        """
        # Fetch distinct dates from skills
        skill_dates = (
            db.query(func.date(Skill.created_at).label("d"), func.count(Skill.id).label("c"))
            .group_by(func.date(Skill.created_at))
            .order_by(desc(func.date(Skill.created_at)))
            .all()
        )

        # Fetch existing digests
        digests = db.query(DailyDigest.digest_date, DailyDigest.podcast_audio_base64).all()
        digest_map = {d.digest_date: bool(d.podcast_audio_base64) for d in digests}

        date_list = []
        for d, count in skill_dates:
            if not d:
                continue
            date_str = str(d)
            date_list.append({
                "date": date_str,
                "skills_count": count,
                "has_digest": date_str in digest_map,
                "has_audio": digest_map.get(date_str, False)
            })

        # Also include any digests that might not have skills directly on that created_at date
        existing_digest_dates = {item["date"] for item in date_list}
        for d_date, has_audio in digest_map.items():
            if d_date not in existing_digest_dates:
                date_list.append({
                    "date": d_date,
                    "skills_count": 0,
                    "has_digest": True,
                    "has_audio": has_audio,
                    "is_today": False
                })

        # ALWAYS guarantee today's date is available at the top for immediate access
        today_local = datetime.now().strftime("%Y-%m-%d")
        existing_dates_set = {item["date"] for item in date_list}
        if today_local not in existing_dates_set:
            today_skills = db.query(Skill).filter(func.date(Skill.created_at) == today_local).count()
            date_list.append({
                "date": today_local,
                "skills_count": today_skills,
                "has_digest": today_local in digest_map,
                "has_audio": digest_map.get(today_local, False),
                "is_today": True
            })
        else:
            # Mark existing item as today if it matches
            for item in date_list:
                if item["date"] == today_local:
                    item["is_today"] = True

        # Sort descending by date
        date_list.sort(key=lambda x: x["date"], reverse=True)
        return date_list

    @classmethod
    def get_skills_for_date(cls, db: Session, date_str: str, limit: int = 20) -> List[Skill]:
        """
        Finds skills created on or around date_str.
        If very few skills match exact created_at date, supplements with top trending skills.
        """
        skills = (
            db.query(Skill)
            .filter(func.date(Skill.created_at) == date_str)
            .order_by(desc(Skill.trending_score), desc(Skill.stars))
            .limit(limit)
            .all()
        )

        if not skills:
            # Fallback to top trending skills
            skills = (
                db.query(Skill)
                .order_by(desc(Skill.trending_score), desc(Skill.stars))
                .limit(limit)
                .all()
            )

        return skills

    @classmethod
    def _extract_code_from_readme(
        cls,
        readme: str,
        primary_lang: str = "",
        name: str = ""
    ) -> tuple[str, str, str, str]:
        """
        Extracts an executable code snippet from README preview or synthesizes a clean runnable snippet.
        Returns: (code, language, filename, explanation)
        """
        readme = (readme or "").strip()
        if readme:
            pattern = r"```([a-zA-Z0-9_\-\+]*)\n(.*?)```"
            matches = re.findall(pattern, readme, re.DOTALL)
            for lang, code_body in matches:
                c = code_body.strip()
                l = (lang or "").strip().lower()
                if 15 <= len(c) <= 900:
                    ext = "sh"
                    if l in ["ts", "typescript"]: ext = "ts"
                    elif l in ["js", "javascript"]: ext = "js"
                    elif l in ["py", "python"]: ext = "py"
                    elif l in ["go", "golang"]: ext = "go"
                    elif l in ["json"]: ext = "json"
                    elif l in ["html"]: ext = "html"
                    elif l in ["css"]: ext = "css"
                    elif l in ["yaml", "yml"]: ext = "yaml"
                    elif l in ["bash", "sh", "shell", "zsh"]: ext = "sh"
                    
                    filename = f"snippet.{ext}"
                    explanation = f"Mã nguồn cấu hình và sử dụng thực tế trích xuất trực tiếp từ repository {name}."
                    return c, l or "bash", filename, explanation

        # Fallback authentic runnable snippet based on language and tool type
        pkg_name = name.split("/")[-1] if "/" in name else name
        lang_lower = (primary_lang or "").lower()
        if "python" in lang_lower:
            return (
                f"# 1. Cài đặt thư viện\npip install {pkg_name}\n\n# 2. Khởi tạo và sử dụng\nimport {pkg_name.replace('-', '_')}\n\nclient = {pkg_name.replace('-', '_')}.Client()\nresult = client.run()\nprint('Hoàn thành:', result)",
                "python",
                "main.py",
                f"Hướng dẫn import và thực thi {pkg_name} bằng Python."
            )
        elif any(k in lang_lower for k in ["typescript", "javascript", "ts", "js"]):
            return (
                f"// 1. Cài đặt package\n// npm install {pkg_name}\n\nimport {{ init }} from '{pkg_name}';\n\nasync function main() {{\n  const app = await init();\n  console.log('Khởi chạy {pkg_name} thành công!');\n}}\n\nmain();",
                "typescript",
                "index.ts",
                f"Khởi tạo và tích hợp {pkg_name} trong dự án Node.js / TypeScript."
            )
        elif "go" in lang_lower:
            return (
                f"package main\n\nimport (\n\t\"fmt\"\n\t\"github.com/{name}\"\n)\n\nfunc main() {{\n\tclient := {pkg_name}.NewClient()\n\tfmt.Println(\"Ready:\", client)\n}}",
                "go",
                "main.go",
                f"Tích hợp package {pkg_name} trong Go module."
            )
        else:
            return (
                f"# Cài đặt và sử dụng nhanh {pkg_name}\nnpx skills add {name} || git clone https://github.com/{name}",
                "bash",
                "quickstart.sh",
                f"Lệnh cài đặt và nạp kỹ năng {pkg_name} vào hệ thống."
            )

    @classmethod
    def _analyze_skill_practical_value(cls, skill: Skill) -> Dict[str, Any]:
        """
        Generates crystal-clear, plain-language, deep practical analysis:
        - Tác dụng thực tế (What it really does)
        - Nỗi đau giải quyết (Pain point solved: Trước vs Sau)
        - Đối tượng sử dụng (Target audience)
        - Prompt / Câu lệnh dùng nhanh (Quick start)
        - Podcast snippet
        - Rich Social Media Tech Post (Bài post chi tiết phong cách mạng xã hội công nghệ)
        """
        name = skill.name or ""
        title = skill.title or name.split("/")[-1]
        desc = (skill.description or "").strip()
        readme = (skill.readme_preview or "").strip()
        cat = (skill.category or "").lower()
        tags = [str(t).lower() for t in (skill.tags or [])]
        name_lower = name.lower()
        full_text = f"{name_lower} {title.lower()} {desc.lower()} {' '.join(tags)} {cat} {readme[:500].lower()}"

        what_it_does = ""
        pain_point_solved = ""
        target_audience = skill.target_audience or "Fullstack Developers & AI Engineers"
        quick_prompt = ""
        podcast_snippet = ""
        category_label = skill.category or "devtools"
        primary_lang = skill.primary_language or "General"

        # Specific named & signature skills
        is_camofox = "camofox" in full_text or ("stealth" in full_text and ("browser" in full_text or "anti-scraping" in full_text or "cloudflare" in full_text))
        is_lightpanda = "lightpanda" in full_text or ("headless browser" in full_text and "zig" in full_text)
        is_hyperframes = "hyperframes" in full_text or ("write html" in full_text and "render video" in full_text)
        is_context_mode = "context-mode" in full_text or ("context window" in full_text and ("mcp" in full_text or "sandbox" in full_text or "token" in full_text))
        is_google_skills = "google/skills" in name_lower or ("google" in full_text and "antigravity" in full_text and "skill" in full_text)
        is_codex_standards = "codex" in full_text or "copilot-instructions" in full_text or ("prompt" in full_text and "standards" in full_text)
        is_golang_skill = "golang" in full_text or ("concurrency" in full_text and "go" in name_lower)
        is_uiux_skill = "uiux" in name_lower or "design-agent" in name_lower or any(k in full_text for k in ["ui/ux", "design system", "tailwind tokens", "wcag"])
        is_nextjs_skill = "nextjs" in name_lower or "next.js" in full_text or "app router" in full_text
        is_chrome_devtools = "chrome-devtools" in full_text or ("devtools" in full_text and "mcp" in full_text)
        is_tailscale = "tailcat" in full_text or "tailscale" in full_text or ("vpn" in full_text and "mesh" in full_text)
        is_screenshot = "screenshot-to-code" in full_text or ("screenshot" in full_text and "code" in full_text)
        is_gitnexus = "gitnexus" in full_text or ("git" in full_text and "graph" in full_text and "conflict" in full_text)
        is_openmontage = "openmontage" in full_text or ("montage" in full_text and "video" in full_text)

        # Broader categories
        is_general_browser = any(k in full_text for k in ["browser", "headless", "scraping", "crawler", "puppeteer", "playwright"])
        is_general_video = any(k in full_text for k in ["video", "render video", "animation", "motion", "remotion", "ffmpeg"])
        is_general_context = any(k in full_text for k in ["context window", "token reduction", "prompt cache", "llm memory", "token optimization"])
        is_coding_agent = cat == "coding-agent" or any(k in full_text for k in ["coding agent", "swe-bench", "auto-code", "refactor agent", "autonomous agent"])
        is_mcp = cat == "mcp-server" or "mcp" in full_text or "model context protocol" in full_text
        is_security = any(k in full_text for k in ["security", "guardrail", "vulnerability", "audit", "sandbox", "prompt injection"])
        is_awesome_list = any(k in full_text for k in ["awesome", "curated list", "collection of", "cheatsheet", "handbook", "roadmap"])
        is_data_pipeline = any(k in full_text for k in ["data pipeline", "database", "postgres", "sql", "vector", "rag", "embedding"])

        if is_camofox:
            what_it_does = "Trình duyệt Headless tàng hình chuyên biệt cho AI Agent, tự động ngụy trang fingerprint và vượt qua cơ chế chống bot (Cloudflare Turnstile, DataDome, WAF) mà không bị chặn 403. Drop-in thay thế trực tiếp cho Puppeteer và Playwright."
            pain_point_solved = "Trước đây: AI Agent bị Cloudflare chặn đứng ngay request thứ hai, dính màn hình xác minh người thật và IP bị gắn cờ bot. Giờ đây: Camofox ngụy trang TLS fingerprint (JA3/JA4) và header như trình duyệt thật, cào dữ liệu và tự động hóa web trơn tru 24/7."
            target_audience = "Data Engineers, AI Web Agents Developers & Web Scraping Specialists"
            quick_prompt = "npm install camofox-browser"
            podcast_snippet = f"Dành cho anh em làm AI cào dữ liệu: {title} là trình duyệt headless tàng hình, giải quyết triệt để nỗi lo bị Cloudflare và WAF chặn 403!"

        elif is_lightpanda:
            what_it_does = "Trình duyệt Headless siêu nhẹ viết bằng Zig/C dành riêng cho AI Agent và tự động hóa web. Tiêu tốn ít hơn 90% RAM và khởi động nhanh gấp 10 lần so với Google Chrome / Chromium truyền thống."
            pain_point_solved = "Trước đây: Chạy Chromium headless ngốn từ 500MB đến 1GB RAM mỗi tab, server VPS cấu hình nhỏ chỉ cần mở vài tác vụ AI là tràn RAM và sập server. Giờ đây: Lightpanda khởi động chỉ mất vài mili-giây, ngốn vài chục MB RAM, cho phép mở hàng trăm phiên duyệt web song song."
            target_audience = "DevOps, AI Scraper Builders & Web Automation Engineers"
            quick_prompt = "curl -fsSL https://get.lightpanda.io | bash && lightpanda serve"
            podcast_snippet = f"Nếu bạn phát ngán vì Chrome Headless ngốn hàng GB RAM thì {title} viết bằng Zig chính là cứu cánh: nhanh gấp 10 lần và tiết kiệm 90% bộ nhớ!"

        elif is_hyperframes:
            what_it_does = "Công cụ render video lập trình (Code-to-Video) thiết kế riêng cho AI Agent: Viết mã nguồn HTML, CSS và Tailwind để xuất ra video 60fps mượt mà trực tiếp mà không cần can thiệp phần mềm đồ họa."
            pain_point_solved = "Trước đây: Để AI tự sinh video, dev phải gọi các API render đám mây tốn kém hoặc render ffmpeg thô sơ khó căn chỉnh layout. Giờ đây: AI Agent viết code HTML/CSS quen thuộc, Hyperframes tự động render từng frame thành video MP4 chuẩn xác."
            target_audience = "Frontend Developers, AI Content Creators & Video Automation Engineers"
            quick_prompt = "npm install @heygen/hyperframes"
            podcast_snippet = f"Một đột phá cực ấn tượng: {title} cho phép AI Agent tự 'code' ra video chuyển động bằng cú pháp HTML và CSS thuần!"

        elif is_context_mode:
            what_it_does = "Tối ưu hóa Context Window cho AI Coding Agent qua giao thức MCP: Tự động sandbox và nén log output của terminal/test (giảm tới 98% token rác), duy trì bộ nhớ phiên làm việc trên 17 IDE."
            pain_point_solved = "Trước đây: Các lệnh build hay test dài hàng nghìn dòng nuốt trọn context window, khiến Claude/Cursor nhanh chóng bị ảo giác và tốn tiền API chóng mặt. Giờ đây: Context Mode lọc thông minh, chỉ nạp tóm tắt lỗi trọng tâm vào ngữ cảnh, agent nhớ lâu và tiết kiệm token tối đa."
            target_audience = "Lập trình viên dùng Claude Code, Cursor, Windsurf, Roo Code & Antigravity"
            quick_prompt = "npx context-mode --init"
            podcast_snippet = f"Cứu cánh cho ví tiền của anh em: {title} giảm tới 98% lượng token context bị đốt cháy vô ích khi dùng AI Coding Agents!"

        elif is_google_skills:
            what_it_does = "Kho Agent Skills chính thức của Google với chuẩn SKILL.md, plugins và harness cho Autonomous Subagents tương thích Google Deepmind, Codex và Antigravity CLI."
            pain_point_solved = "Trước đây: Mỗi agent tự phát minh một cách phân rã task và gọi lệnh riêng, thiếu cơ chế sandbox an toàn và dễ bị lạc đề. Giờ đây: Google Skills chuẩn hóa cấu trúc skill folder, nạp đúng tài nguyên cần thiết và quản lý quyền sandboxing nghiêm ngặt."
            target_audience = "AI Engineers, Antigravity Power Users & Enterprise Agent Builders"
            quick_prompt = "npx skills add google/skills"
            podcast_snippet = f"Khai phóng sức mạnh Subagents tự trị: {title} mang chuẩn Agent Skills chính thức của Google vào workflow lập trình của bạn."

        elif is_codex_standards:
            what_it_does = "Quy chuẩn kiến trúc prompt và chỉ dẫn hệ thống cấp repository (.github/copilot-instructions.md) cho OpenAI Codex, GitHub Copilot CLI và agent tự động review PR."
            pain_point_solved = "Trước đây: AI hay sinh code thừa, thiếu unit test, sai naming convention của team và tự ý sửa logic ngoài phạm vi. Giờ đây: Ràng buộc quy chuẩn chặt chẽ, ép agent viết test coverage >85% và tuân thủ Clean Architecture."
            target_audience = "Tech Leads, Enterprise Teams & GitHub Copilot Power Users"
            quick_prompt = "npx codex-standards --init"
            podcast_snippet = f"Dành cho anh em dùng Copilot và Codex: {title} giúp kiểm soát AI viết code kỷ luật, sạch sẽ và có test đầy đủ."

        elif is_golang_skill:
            what_it_does = "Bộ quy chuẩn viết Golang tối ưu hiệu năng và concurrency: chống rò rỉ goroutine leak, tối ưu memory allocations, tự động sinh table-driven unit tests và kiểm soát context timeout."
            pain_point_solved = "Trước đây: Coding Agent sinh code Go thiếu kiểm tra context cancellation, dễ gây rò rỉ goroutine và panic lúc runtime. Giờ đây: Tự động hóa concurrency patterns an toàn và test race condition pass 100%."
            target_audience = "Golang Developers, Backend Engineers & Microservice Architects"
            quick_prompt = "go test -race -v ./..."
            podcast_snippet = f"Trong mảng backend hôm nay có {title}, mang chuẩn Uber Go và concurrency an toàn vào các coding agent."

        elif is_uiux_skill:
            what_it_does = "Bộ kỹ năng thiết kế UI/UX đỉnh cao cho AI: chuẩn hóa bảng màu tương phản cao, 8pt spatial grid, hiệu ứng chuyển động mượt mà, hỗ trợ chuẩn Accessibility WCAG 2.1 AA."
            pain_point_solved = "Trước đây: Giao diện AI sinh ra bị lệch layout, màu sắc thiếu tương phản và không thân thiện với người khuyết tật. Giờ đây: Biến code thô thành giao diện chuẩn production đạt 100 điểm Google Lighthouse."
            target_audience = "Frontend Developers, UI/UX Designers & Indie Hackers"
            quick_prompt = "npx uiux-pro --generate-palette"
            podcast_snippet = f"{title} giải quyết điểm yếu lớn nhất của AI là sinh giao diện xấu, biến code thô thành UI cấp Production tuyệt đẹp."

        elif is_nextjs_skill:
            what_it_does = "Quy chuẩn Next.js 15 App Router & Server Actions: viết Server Actions an toàn có validation Zod, tối ưu React Server Components và chiến lược Cache revalidateTag."
            pain_point_solved = "Trước đây: AI hay viết cú pháp Pages Router cũ hoặc dùng useEffect sai mục đích trong Next.js 15. Giờ đây: Tự động tuân thủ kiến trúc RSC hiện đại và bảo mật dữ liệu tuyệt đối."
            target_audience = "Frontend & Fullstack Developers dùng Next.js 15 và React 19"
            quick_prompt = "npx nextjs-agent-rules --check"
            podcast_snippet = f"{title} chuẩn hóa Next.js 15 App Router, loại bỏ triệt để tình trạng AI viết cú pháp cũ kém hiệu quả."

        elif is_chrome_devtools:
            what_it_does = "Cho phép AI tự động mở trình duyệt Chrome, đọc log Console, đo network request và inspect DOM trực tiếp mà bạn không cần F12 soi tay."
            pain_point_solved = "Trước đây: Khi web bị lỗi, bạn phải tự mở DevTools, chụp ảnh màn hình hoặc copy-paste cả đống log lỗi vào chat AI. Giờ đây: AI tự kết nối DevTools, tự bắt lỗi JS/CSS và gợi ý fix ngay tại chỗ."
            target_audience = "Frontend Developers, QA Automation & Fullstack Engineers"
            quick_prompt = "npx -y @modelcontextprotocol/server-chrome-devtools"
            podcast_snippet = f"Một công cụ cực kỳ xịn sò: {title}. AI của bạn giờ đây có đôi mắt nhìn thẳng vào Console và Network tab của Chrome!"

        elif is_tailscale:
            what_it_does = "Tạo mạng VPN riêng ảo (Tailscale mesh) bảo mật tức thì giữa máy tính lập trình của bạn và server từ xa mà không cần mở port router."
            pain_point_solved = "Trước đây: Phải cấu hình port forwarding, NAT, IP tĩnh hoặc setup SSH ngầm rất phức tạp. Giờ đây: Kết nối thiết bị qua mạng an toàn mã hóa P2P chỉ với một lệnh."
            target_audience = "DevOps, Backend Engineers & Người làm việc từ xa"
            quick_prompt = "curl -fsSL https://tailscale.com/install.sh | sh"
            podcast_snippet = f"Nếu bạn đau đầu vì cấu hình VPN và port forwarding, thì {title} sẽ giải cứu bạn bằng mạng ảo P2P mã hóa cực kỳ tiện lợi."

        elif is_screenshot:
            what_it_does = "Biến bất kỳ ảnh chụp màn hình UI, bản thiết kế Figma hoặc ảnh vẽ tay thành mã nguồn HTML/Tailwind CSS/React chạy được ngay."
            pain_point_solved = "Trước đây: Frontend dev phải ngồi gõ từng dòng CSS, đo từng pixel và căn chỉnh padding mất hàng giờ. Giờ đây: Chỉ cần thả ảnh vào, AI viết code giao diện chuẩn chỉ trong 30 giây."
            target_audience = "Frontend Developers, UI/UX Designers & Indie Hackers"
            quick_prompt = "git clone https://github.com/abi/screenshot-to-code && cd screenshot-to-code"
            podcast_snippet = f"Bạn có một bức ảnh giao diện đẹp và muốn biến thành code? {title} dùng Vision AI để sinh code Tailwind và React chạy được ngay lập tức."

        elif is_gitnexus:
            what_it_does = "Trực quan hóa đồ thị commit, nhánh Git và phân tích xung đột code (merge conflict) bằng giao diện đồ họa tương tác thông minh."
            pain_point_solved = "Trước đây: Khi rebase hoặc merge nhánh lớn trong team, developer dễ bị lạc trong ma trận commit. Giờ đây: Nhìn thấy toàn cảnh luồng code và phát hiện xung đột sớm."
            target_audience = "Tech Leads, Git Power Users & Nhóm phát triển phần mềm"
            quick_prompt = "npx gitnexus --inspect"
            podcast_snippet = f"{title} giúp gỡ rối các nhánh Git phức tạp bằng biểu đồ tương tác thông minh, không còn nỗi sợ merge conflict nữa!"

        elif is_openmontage:
            what_it_does = "Bộ công cụ tự động ghép, dựng và tạo hiệu ứng video ngắn (Shorts/Reels) từ kịch bản bằng AI mà không cần dùng Premiere."
            pain_point_solved = "Trước đây: Dựng video ngắn tốn hàng giờ cắt ghép timeline thủ công. Giờ đây: Đưa văn bản và tài nguyên vào, AI tự đồng bộ nhịp và render video."
            target_audience = "Content Creators, Marketers & AI Video Builders"
            quick_prompt = "pip install openmontage"
            podcast_snippet = f"Dành cho anh em làm nội dung: {title} tự động hóa khâu dựng video từ kịch bản, tiết kiệm 90% thời gian biên tập."

        elif is_general_browser:
            what_it_does = f"Hạ tầng tự động hóa trình duyệt và trích xuất dữ liệu web hiện đại ({title}), tối ưu hóa cho AI agents tương tác mượt mà với DOM."
            pain_point_solved = f"Trước đây: Viết script cào dữ liệu dễ gãy khi giao diện web thay đổi, chiếm nhiều CPU và hay bị phát hiện. Giờ đây: {title} cung cấp giao thức tự động hóa ổn định, hỗ trợ AI tương tác web chính xác."
            target_audience = "Web Automation Engineers, AI Scrapers & Data Teams"
            quick_prompt = f"git clone {skill.repository_url}" if skill.repository_url else f"npm install {name.split('/')[-1]}"
            podcast_snippet = f"Trong mảng web automation hôm nay có {title}, giải pháp giúp AI tương tác trực tiếp với giao diện web nhanh chóng và an toàn."

        elif is_general_video:
            what_it_does = f"Nền tảng xử lý và render media/video tự động ({title}), cho phép AI tạo chuyển động và xuất video chất lượng cao từ mã nguồn."
            pain_point_solved = "Trước đây: Dựng media và video hàng loạt cần phần mềm đồ họa nặng và render thủ công. Giờ đây: Tự động hóa toàn bộ quy trình sinh hình ảnh, hiệu ứng và âm thanh bằng code."
            target_audience = "Video Creators, Creative Developers & Media AI Builders"
            quick_prompt = f"git clone {skill.repository_url}" if skill.repository_url else f"# Khám phá {title}"
            podcast_snippet = f"Về lĩnh vực truyền thông số, {title} mang tới khả năng tự động hóa render video linh hoạt cho các quy trình AI."

        elif is_general_context:
            what_it_does = f"Giải pháp quản trị bối cảnh (Context Management) và nén token ({title}), giúp AI Agent duy trì bộ nhớ dài hạn mà không vượt ngưỡng giới hạn của LLM."
            pain_point_solved = "Trước đây: Bối cảnh hội thoại dài khiến chi phí token tăng vọt và mô hình bắt đầu quên thông tin ban đầu. Giờ đây: Cơ chế tóm tắt và đánh chỉ mục thông minh giúp agent nhớ chính xác dữ liệu quan trọng."
            target_audience = "LLM Developers, Prompt Engineers & AI Agent Architects"
            quick_prompt = f"npm install {name.split('/')[-1]}" if "js" in str(primary_lang).lower() else f"pip install {name.split('/')[-1]}"
            podcast_snippet = f"Để giải bài toán chi phí token và giới hạn bối cảnh, {title} đem lại cơ chế nén ngữ cảnh thông minh cho các nhà phát triển."

        elif is_mcp:
            what_it_does = f"Máy chủ Model Context Protocol (MCP) chuẩn hóa, cấp quyền cho AI Agent (Claude, Cursor, Antigravity) kết nối và điều khiển trực tiếp {title}."
            pain_point_solved = f"Trước đây: AI chỉ trả lời lý thuyết dựa trên dữ liệu cũ, không thể đọc ghi dữ liệu thực tế. Giờ đây: Thông qua chuẩn MCP của {title}, Agent có thể gọi tool, truy vấn thông tin và thao tác an toàn."
            target_audience = "Lập trình viên tích hợp Agentic AI (Claude, Antigravity, Cursor, Windsurf)"
            quick_prompt = f"Claude Desktop config -> mcpServers: {{ '{title.lower().replace(' ', '-') }': {{ 'command': 'npx ...' }} }}"
            podcast_snippet = f"Tiếp theo là máy chủ MCP {title}, mở rộng đôi tay cho AI tương tác trực tiếp với dữ liệu thực tế."

        elif is_coding_agent:
            what_it_does = f"Trợ lý AI lập trình tự động hóa chuyên sâu ({title}), có khả năng lập kế hoạch giải quyết task, tự sửa lỗi cú pháp, chạy test và sinh pull request hoàn chỉnh."
            pain_point_solved = "Trước đây: Bạn phải gõ lệnh, copy code qua lại và sửa từng file một cách thủ công. Giờ đây: Giao nhiệm vụ tổng quát, AI agent tự phân tích kiến trúc dự án và thực thi tuần tự từng bước."
            target_audience = "Lập trình viên muốn gia tăng năng suất phát triển phần mềm"
            quick_prompt = f"agent run --task 'Phân tích và tối ưu mã nguồn với {title}'"
            podcast_snippet = f"Điểm sáng tiếp theo là {title} - công cụ nâng tầm workflow lập trình tự động với agent chuyên sâu."

        elif is_awesome_list:
            what_it_does = f"Kho tàng tri thức và cẩm nang kỹ thuật thực chiến được cộng đồng tuyển chọn kỹ lưỡng về {title}: tập hợp đầy đủ công cụ, best practices, tài liệu chuẩn."
            pain_point_solved = "Trước đây: Mất hàng tuần tìm kiếm thông tin phân mảnh, không rõ thư viện nào còn được duy trì và đáng tin cậy. Giờ đây: Danh mục tuyển chọn giúp bạn tiếp cận ngay những giải pháp tốt nhất đã được kiểm chứng."
            target_audience = "Lập trình viên ở mọi cấp độ, Tech Leads & Nghiên cứu viên"
            quick_prompt = f"git clone {skill.repository_url}" if skill.repository_url else f"# Xem cẩm nang {title}"
            podcast_snippet = f"Một tài nguyên vô giá cho anh em: {title} tổng hợp những công cụ và kiến thức tinh hoa nhất trong ngành."

        elif is_security:
            what_it_does = f"Bộ giải pháp kiểm toán bảo mật và thiết lập hàng rào bảo vệ (Guardrails) cho AI Agent: phát hiện lỗ hổng mã nguồn, ngăn ngừa rò rỉ secret và rủi ro prompt injection."
            pain_point_solved = "Trước đây: Cho AI tự động chạy lệnh tiềm ẩn nguy cơ thực thi mã độc hoặc lộ API key bí mật. Giờ đây: Thiết lập rào chắn kiểm duyệt phân quyền tự động, đảm bảo agent hoạt động an toàn."
            target_audience = "Security Engineers, DevSecOps & AI Platform Architects"
            quick_prompt = "npm audit || python -m security_audit"
            podcast_snippet = f"Về an toàn bảo mật, {title} giúp bảo vệ hệ thống AI của bạn trước các nguy cơ tấn công và rò rỉ dữ liệu."

        elif is_data_pipeline:
            what_it_does = f"Hạ tầng quản trị dữ liệu và truy vấn hiệu năng cao ({title}), phục vụ xây dựng pipeline ETL, RAG và lưu trữ tri thức cho AI agents."
            pain_point_solved = "Trước đây: Dữ liệu bị phân tán, truy vấn chậm và khó đồng bộ với vector database. Giờ đây: Cung cấp đường ống dữ liệu tinh gọn, truy vấn thời gian thực phục vụ AI tìm kiếm tri thức."
            target_audience = "Data Engineers, Backend Devs & AI Engineers"
            quick_prompt = f"git clone {skill.repository_url}" if skill.repository_url else f"# Khám phá pipeline {title}"
            podcast_snippet = f"Trong mảng dữ liệu, {title} cung cấp giải pháp lưu trữ và truy vấn tối ưu cho các mô hình ngôn ngữ lớn."

        else:
            # Dynamic smart synthesis directly from skill metadata (readme, use_cases, comparison_notes)
            raw_cases = skill.use_cases if isinstance(skill.use_cases, list) else []
            comp_notes = (skill.comparison_notes or "").strip()
            ai_sum = (skill.ai_summary or "").strip()
            clean_desc = desc if desc else f"Giải pháp công nghệ chuyên sâu dành cho {title}"

            if ai_sum:
                what_it_does = f"{title}: {ai_sum}"
            elif raw_cases:
                what_it_does = f"{title} giải quyết bài toán: {raw_cases[0]}"
            else:
                what_it_does = f"Giải pháp {category_label} chuyên biệt ({title}): {clean_desc}"
            if len(what_it_does) > 280:
                what_it_does = what_it_does[:277] + "..."

            if comp_notes:
                pain_point_solved = f"Trước đây: Lập trình viên gặp khó khăn vì thiếu chuẩn hóa hoặc phụ thuộc vào giải pháp cũ kém linh hoạt. Giờ đây: {comp_notes}"
            elif len(raw_cases) >= 2:
                pain_point_solved = f"Trước đây: Mất thời gian xử lý thủ công và cấu hình phức tạp. Giờ đây: Tự động hóa {raw_cases[0].lower()}, đồng thời hỗ trợ {raw_cases[1].lower()}."
            else:
                pain_point_solved = f"Trước đây: Các tác vụ về {category_label} trên {primary_lang} đòi hỏi nhiều thao tác lặp lại và dễ phát sinh lỗi. Giờ đây: {title} mang lại quy trình đóng gói tối ưu, giúp nhà phát triển tăng tốc xây dựng sản phẩm."

            target_audience = skill.target_audience or f"Kỹ sư phần mềm, AI Engineers & Nhà phát triển {primary_lang}"
            
            # Extract actual command from readme or synthesize
            extracted_code, _, _, _ = cls._extract_code_from_readme(readme, primary_lang, name)
            if extracted_code and len(extracted_code.splitlines()) == 1 and any(cmd in extracted_code for cmd in ["npx", "pip", "npm", "curl", "go get", "git clone"]):
                quick_prompt = extracted_code
            elif skill.repository_url:
                quick_prompt = f"git clone {skill.repository_url}"
            else:
                quick_prompt = f"npm install {name.split('/')[-1]}"

            podcast_snippet = f"Đáng chú ý hôm nay có {title}: giải pháp đột phá giúp {what_it_does[:120]}..."

        # If comparison_notes is explicitly provided, respect it above category heuristics
        comp_notes = (skill.comparison_notes or "").strip()
        if comp_notes:
            if "Trước đây" in comp_notes or "Trước:" in comp_notes:
                pain_point_solved = comp_notes
            else:
                pain_point_solved = f"Trước đây: Lập trình viên gặp khó khăn vì các giải pháp phân tán hoặc thiếu chuẩn hóa. Giờ đây: {comp_notes}"

        base_summary = {
            "skill_id": skill.id,
            "name": skill.name,
            "title": title,
            "author": skill.author or (skill.name.split("/")[0] if "/" in skill.name else "Community"),
            "repository_url": skill.repository_url or "",
            "category": category_label,
            "stars": skill.stars or 0,
            "trending_score": round(skill.trending_score or 0.0, 1),
            "primary_language": primary_lang,
            "what_it_does": what_it_does,
            "pain_point_solved": pain_point_solved,
            "target_audience": target_audience,
            "quick_start_prompt": quick_prompt,
            "podcast_snippet": podcast_snippet,
        }

        # Generate full-fledged Social Media Post
        social_post = cls._generate_social_post(skill, base_summary)
        base_summary["social_post"] = social_post

        return base_summary

    @classmethod
    def _generate_social_post(cls, skill: Skill, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a high-impact, engaging Tech Social Media Post (Substack / X Thread / LinkedIn / Dev.to style)
        for the given skill based on deep domain analysis.
        """
        name = skill.name or ""
        title = analysis.get("title") or name.split("/")[-1]
        cat = analysis.get("category", "devtools")
        category_label = cat
        stars = skill.stars or 0
        author = analysis.get("author") or "Community"
        author_handle = f"@{author.lower().replace(' ', '_')}"
        readme = (skill.readme_preview or "").strip()
        primary_lang = analysis.get("primary_language", "General")

        name_lower = name.lower()
        full_text = f"{name_lower} {title.lower()} {analysis.get('what_it_does', '').lower()} {cat.lower()}"

        # Distinct badges
        if stars > 50000:
            badge = "🔥 Top Xu Hướng Toàn Cầu"
        elif stars > 10000:
            badge = "🚀 Đột Phá Công Nghệ"
        elif "mcp" in full_text:
            badge = "🔌 Model Context Protocol"
        elif "browser" in full_text:
            badge = "🌐 Web Automation & AI"
        elif "video" in full_text:
            badge = "🎬 AI Media & Video"
        else:
            badge = "💡 Đề Xuất Lập Trình Viên"

        # Domain-tailored social content
        if "camofox" in full_text or "stealth" in full_text:
            hook = f"⚡ AI Agent của bạn liên tục bị ăn 'Error 403 Forbidden' hoặc kẹt ở captcha Cloudflare? {title} giải quyết triệt để điều này!"
            summary = f"Nếu bạn đang xây dựng AI Scraper hoặc Web Agent, chắc chắn bạn từng phát điên vì Cloudflare Turnstile và các hệ thống anti-bot chặn đứng request. {title} ra đời như một giải pháp Drop-in thay thế Playwright/Puppeteer với khả năng tàng hình vượt trội."
            pain_before = "Agent bị Cloudflare / DataDome chặn ngay từ bước handshake TLS hoặc phát hiện thuộc tính navigator.webdriver, làm gãy toàn bộ pipeline cào dữ liệu."
            pain_after = "Ngụy trang hoàn hảo dấu vân tay JA3/JA4, giả lập hành vi chuột tự nhiên và bypass cơ chế kiểm tra bot mà không tốn chi phí mua proxy xoay vòng đắt đỏ."
            core_mechanism = "Tùy biến trực tiếp engine Chromium ở cấp độ C++: spoof WebGL fingerprint, override Canvas noise, giả lập human-like mouse trajectories và chuẩn hóa header HTTP/2 để không lưu vết headless."
            key_features = [
                "Vượt qua Cloudflare Turnstile & DataDome êm ru",
                "Drop-in replacement 1:1 cho code Puppeteer & Playwright",
                "Tự động xoay vòng fingerprint và giải mã cookie phiên",
                "Tiết kiệm chi phí so với các dịch vụ giải captcha bên thứ ba"
            ]
            code_lang = "typescript"
            code_filename = "stealth-agent.ts"
            code_snippet = (
                "import { launchStealthBrowser } from 'camofox-browser';\n\n"
                "async function runAgent() {\n"
                "  // Khởi động browser với chế độ tàng hình kích hoạt sẵn\n"
                "  const browser = await launchStealthBrowser({ headless: true });\n"
                "  const page = await browser.newPage();\n"
                "  \n"
                "  // Truy cập trang web có bảo vệ Cloudflare Turnstile\n"
                "  await page.goto('https://protected-target.com');\n"
                "  console.log('✅ Truy cập thành công, bypass bot detection!');\n"
                "  \n"
                "  const data = await page.evaluate(() => document.title);\n"
                "  await browser.close();\n"
                "}\n"
                "runAgent();"
            )
            code_exp = "Chạy browser tàng hình và cào dữ liệu an toàn mà không bị Cloudflare gắn cờ bot."
            pros = [
                "Bypass bot detection cực kỳ hiệu quả mà không cần proxy đắt tiền",
                "Cú pháp thân thuộc, dễ dàng chuyển đổi từ code Puppeteer cũ",
                "Hoạt động ổn định trên các trang web có cơ chế bảo vệ khắt khe"
            ]
            cons = [
                "Cần kiểm tra cập nhật khi các nhà cung cấp WAF thay đổi thuật toán",
                "Tốc độ tải trang có thể chậm hơn vài mili-giây do bước ngụy trang vân tay"
            ]
            who = "Data Engineers, AI Web Agents Builders và anh em làm web scraping tự động hóa."
            hashtags = ["#WebScraping", "#CloudflareBypass", "#AIAgents", "#Playwright", "#Puppeteer"]

        elif "lightpanda" in full_text:
            hook = f"🔥 Quên việc server sập vì Chrome Headless ngốn 10GB RAM đi! {title} - Headless Browser bằng Zig nhanh gấp 10 lần!"
            summary = f"Chạy Chrome headless trên Docker luôn là cơn ác mộng bộ nhớ với mọi kỹ sư DevOps. {title} được viết lại từ đầu bằng ngôn ngữ Zig, cắt bỏ hoàn toàn các thành phần đồ họa thừa thãi để tập trung 100% vào tốc độ xử lý DOM cho AI Agent."
            pain_before = "Mỗi tab Chrome ngốn 500MB - 1GB RAM. Chạy 10 agent cào song song là server VPS 4GB RAM treo cứng đơ, chi phí hạ tầng cloud tăng vọt."
            pain_after = "Khởi động chỉ mất 10ms, mỗi phiên chỉ tiêu tốn 15-30MB RAM. Một máy chủ nhỏ có thể cân hàng trăm agent duyệt web cùng lúc nhẹ như không."
            core_mechanism = "Kiến trúc thuần Zig/C không cần GPU/Render Engine đồ họa; hiện thực hóa bộ phân tích DOM và JS Engine tối giản tương thích giao thức Chrome DevTools Protocol (CDP)."
            key_features = [
                "Khởi động siêu tốc trong 10 mili-giây",
                "Tiêu tốn ít hơn 90% bộ nhớ so với Chromium",
                "Tương thích chuẩn Chrome DevTools Protocol (CDP)",
                "Dung lượng binary siêu nhẹ, dễ dàng đóng gói Docker image dưới 50MB"
            ]
            code_lang = "bash"
            code_filename = "quickstart.sh"
            code_snippet = (
                "# 1. Cài đặt Lightpanda binary siêu nhẹ\n"
                "curl -fsSL https://get.lightpanda.io | bash\n\n"
                "# 2. Khởi chạy CDP server phục vụ AI Agent trên port 9222\n"
                "lightpanda serve --port 9222 --host 127.0.0.1\n\n"
                "# 3. Kết nối từ Playwright hoặc Puppeteer như bình thường:\n"
                "# playwright.chromium.connect_over_cdp('http://localhost:9222')"
            )
            code_exp = "Khởi chạy server headless browser siêu nhẹ và kết nối qua CDP."
            pros = [
                "Tiết kiệm chi phí hạ tầng máy chủ lên tới 80-90%",
                "Tốc độ khởi động và phản hồi tức thì",
                "Lý tưởng cho môi trường Serverless và micro-containers"
            ]
            cons = [
                "Không render hình ảnh pixel-perfect (không phù hợp nếu bạn cần chụp ảnh màn hình UI chi tiết)",
                "Một số API HTML5 canvas đồ họa nặng chưa được hỗ trợ"
            ]
            who = "DevOps, Backend Engineers và các team xây dựng AI Agent cào dữ liệu quy mô lớn."
            hashtags = ["#ZigLang", "#HeadlessBrowser", "#WebAutomation", "#DevOps", "#Performance"]

        elif "hyperframes" in full_text:
            hook = f"🎬 AI Agent giờ đã có thể tự 'code' ra video chuyển động chuyên nghiệp chỉ bằng HTML & CSS thuần với {title}!"
            summary = f"Trước đây, muốn tạo video tự động bằng AI, bạn phải dùng API dựng video đám mây đắt đỏ hoặc vật lộn với FFmpeg phức tạp. {title} từ team HeyGen mở ra kỷ nguyên mới: Biến code HTML/CSS thành video 60fps chuẩn xác từng frame."
            pain_before = "Phụ thuộc vào các phần mềm dựng video thủ công hoặc trả hàng nghìn USD cho API render đám mây bên thứ ba mà không tùy biến linh hoạt được."
            pain_after = "Chỉ cần viết HTML/CSS/Tailwind quen thuộc, AI Agent có thể lập trình video, chỉnh animation theo dòng thời gian và render xuất file MP4 tự động 100%."
            core_mechanism = "Engine render tối ưu hóa dựa trên WebCodecs và headless snapshotting; nội suy keyframe animation chính xác từng mili-giây mà không bị giật lag."
            key_features = [
                "Thiết kế giao diện video bằng HTML/CSS/Tailwind CSS",
                "Native timeline & animation controls chuẩn 60fps",
                "Tối ưu hóa đặc biệt cho AI Agent sinh mã nguồn và render trực tiếp",
                "Hỗ trợ xuất định dạng MP4 và WebM chất lượng cao"
            ]
            code_lang = "html"
            code_filename = "video-template.html"
            code_snippet = (
                "<!-- Định nghĩa Scene video bằng HTML & Tailwind -->\n"
                "<div class=\"w-[1920px] h-[1080px] bg-slate-950 flex flex-col justify-center items-center text-white\">\n"
                "  <h1 class=\"text-7xl font-extrabold tracking-tight animate-bounce text-violet-400\">\n"
                "    AI Trending Radar 🚀\n"
                "  </h1>\n"
                "  <p class=\"mt-4 text-2xl text-slate-300 font-mono\">\n"
                "    Tự động render video từ HTML bằng Hyperframes\n"
                "  </p>\n"
                "</div>"
            )
            code_exp = "Định nghĩa kịch bản video bằng thẻ HTML và thuộc tính CSS quen thuộc."
            pros = [
                "Lập trình viên web có thể tận dụng toàn bộ kỹ năng CSS/Tailwind để dựng video",
                "Dễ dàng tích hợp vào agent workflow tự động tạo nội dung",
                "Kiểm soát tuyệt đối từng frame chuyển động"
            ]
            cons = [
                "Cần tư duy timing hoạt họa bằng CSS keyframes",
                "Render video độ dài lớn sẽ tiêu tốn CPU/GPU tương đối"
            ]
            who = "Frontend Developers, Content Creators, Indie Hackers & AI Video Builders."
            hashtags = ["#VideoAutomation", "#CodeToVideo", "#HeyGen", "#FrontendDev", "#AIContent"]

        elif "context-mode" in full_text:
            hook = f"🧠 Cứu cánh cho ví tiền của bạn: {title} giảm tới 98% lượng token context bị đốt cháy vô ích khi dùng AI Coding Agents!"
            summary = f"Khi dùng Claude Code, Cursor hay Roo Code, mỗi lần terminal in ra log build dài hàng nghìn dòng là một lần bạn đốt cháy token context window. {title} là MCP Server thông minh giúp lọc sạch rác, giữ bối cảnh sạch sẽ và agent nhớ dai hơn."
            pain_before = "Log terminal và output test dài dằng dặc nuốt trọn 100k token chỉ sau vài câu lệnh, agent bắt đầu quên logic trước đó và chi phí token tăng chóng mặt."
            pain_after = "Context Mode tự động sandbox kết quả lệnh, chỉ nén và gửi về tóm tắt thông tin lỗi quan trọng nhất, tiết kiệm 98% token và duy trì bối cảnh dự án lâu dài."
            core_mechanism = "Đứng ở tầng trung gian giữa Agent và Shell thông qua MCP; phân tích AST cú pháp log, cắt tỉa thông tin dư thừa và quản lý bộ nhớ session qua 17 nền tảng."
            key_features = [
                "Giảm 98% dung lượng token từ command output và terminal log",
                "Tương thích với 17 nền tảng IDE và AI coding tools",
                "Lưu trữ bộ nhớ phiên (session memory) xuyên suốt các lần chat",
                "Cấu hình một lần qua Model Context Protocol (MCP)"
            ]
            code_lang = "json"
            code_filename = "claude_desktop_config.json"
            code_snippet = (
                "{\n"
                "  \"mcpServers\": {\n"
                "    \"context-mode\": {\n"
                "      \"command\": \"npx\",\n"
                "      \"args\": [\"-y\", \"context-mode@latest\", \"--sandbox\"]\n"
                "    }\n"
                "  }\n"
                "}"
            )
            code_exp = "Thêm server MCP Context Mode vào file cấu hình của Claude hoặc Cursor."
            pros = [
                "Tiết kiệm chi phí API rõ rệt ngay từ ngày đầu sử dụng",
                "Agent giữ được bối cảnh mạch lạc, không bị ảo giác khi dự án lớn",
                "Hỗ trợ sẵn cho hầu hết các Agent hiện đại"
            ]
            cons = [
                "Đôi khi lọc quá gọn các cảnh báo nhỏ (warning) không ảnh hưởng tới kết quả",
                "Cần restart lại IDE sau khi thêm cấu hình MCP"
            ]
            who = "Kỹ sư dùng Claude Code, Cursor, Windsurf, Roo Code, Antigravity."
            hashtags = ["#MCP", "#ContextWindow", "#ClaudeAI", "#CursorIDE", "#PromptEngineering"]

        elif "google/skills" in name_lower or ("google" in full_text and "antigravity" in full_text):
            hook = f"⚡ Khai phóng sức mạnh Agentic Coding thế hệ mới cùng Google Agent Skills & Antigravity Plugins!"
            summary = f"Google chính thức công bố chuẩn Agent Skills giúp biến các mô hình ngôn ngữ lớn thành Autonomous Subagents thực thụ. Thay vì nhồi nhét hàng ngàn dòng prompt rời rạc, {title} cung cấp kiến trúc module hóa với đầy đủ SKILL.md, dynamic tools và cơ chế sandbox an toàn."
            pain_before = "Lập trình viên phải tự viết prompt phân rã task phức tạp, thiếu chuẩn hóa file SKILL.md và gặp khó khăn khi kiểm soát sandboxing dòng lệnh an toàn."
            pain_after = "Áp dụng chuẩn mở chính thức của Google Deepmind: phân rã subagent tự trị, nạp đúng kỹ năng cần thiết và kiểm soát quyền hạn dòng lệnh an toàn."
            core_mechanism = "Kiến trúc Agent Skills mở rộng với file SKILL.md, schema metadata, dynamic script execution và sandboxing an toàn trên hệ điều hành."
            raw_cases = skill.use_cases if isinstance(skill.use_cases, list) else []
            key_features = raw_cases if raw_cases else [
                "Xây dựng và triệu hồi Autonomous Subagents theo kiến trúc Google Deepmind",
                "Chuẩn hóa file SKILL.md với đầy đủ frontmatter, scripts và references",
                "Kiểm soát sandboxing và cấp quyền thực thi dòng lệnh an toàn trên macOS/Linux",
                "Tối ưu cho ngữ cảnh lớn và phân rã task lập trình phức tạp"
            ]
            code_lang = "bash"
            code_filename = "install-skill.sh"
            code_snippet = (
                "# 1. Nạp bộ kỹ năng Google Agent Skills vào môi trường\n"
                "npx skills add google/skills\n\n"
                "# 2. Kiểm tra danh sách skills sẵn sàng trong agent harness\n"
                "skills list"
            )
            code_exp = "Cài đặt và kích hoạt kỹ năng Google Agent Skills qua CLI chuẩn."
            pros = [
                "Chuẩn mở chính thức được bảo chứng bởi Google Deepmind",
                "Cơ chế sandboxing và cấp quyền permission nghiêm ngặt",
                "Tương thích với Antigravity CLI, Cursor, Claude Code và Codex"
            ]
            cons = [
                "Cần làm quen với cấu trúc frontmatter của file SKILL.md chuẩn"
            ]
            who = "AI Engineers, Fullstack Devs và người dùng Antigravity Agent Harness."
            hashtags = ["#GoogleAI", "#AgentSkills", "#Antigravity", "#Subagents", "#AgenticCoding"]

        elif "codex" in full_text or "copilot-instructions" in full_text:
            hook = f"🚨 Dừng ngay việc để GitHub Copilot & Codex sinh code lung tung! Đây là bộ quy chuẩn .github/copilot-instructions.md bạn cần:"
            summary = f"Mệt mỏi vì Copilot viết code thiếu test, sai naming convention của team hoặc dùng thư viện lỗi thời? {title} định nghĩa kiến trúc prompt cấp repository, biến AI thành một Senior Engineer mẫn cán tuân thủ Clean Architecture 100%."
            pain_before = "Mỗi developer cấu hình prompt một kiểu, AI sinh code lan man, thiếu unit test và vi phạm coding convention của team."
            pain_after = "Mọi thành viên và AI Assistant trong repo đều đồng bộ một chuẩn coding convention duy nhất, tự động ép viết test coverage >85%."
            core_mechanism = "Ràng buộc hệ thống prompt ở cấp độ repo (.github/copilot-instructions.md); kiểm soát context injection và thiết lập guardrails cú pháp cho LLM."
            raw_cases = skill.use_cases if isinstance(skill.use_cases, list) else []
            key_features = raw_cases if raw_cases else [
                "Chuẩn hóa file .github/copilot-instructions.md cho toàn bộ team",
                "Tự động ép Copilot/Codex viết unit test đạt độ bao phủ >85%",
                "Ngăn chặn code smells, duplicate logic và hàm vượt quá 50 dòng code",
                "Ràng buộc kiểu dữ liệu nghiêm ngặt và ngăn chặn hallucination"
            ]
            code_lang = "markdown"
            code_filename = ".github/copilot-instructions.md"
            code_snippet = (
                "# Repository Instructions for AI Assistants\n\n"
                "- ALWAYS write unit tests with >85% coverage before marking tasks done.\n"
                "- Enforce TypeScript strict mode; NEVER use `any` type.\n"
                "- Keep functions under 50 lines; follow Clean Architecture.\n"
                "- Return structured errors instead of throwing unhandled exceptions."
            )
            code_exp = "Mẫu file cấu hình chỉ dẫn hệ thống .github/copilot-instructions.md chuẩn."
            pros = [
                "Đồng bộ chất lượng code của toàn bộ team lập trình",
                "Loại bỏ triệt để các lỗi hallucination cú pháp phổ biến",
                "Tương thích 100% với GitHub Copilot CLI và VS Code extensions"
            ]
            cons = [
                "Cần bảo trì file quy tắc định kỳ khi cập nhật framework phiên bản mới"
            ]
            who = "Tech Leads, Engineering Managers & GitHub Copilot Power Users."
            hashtags = ["#GitHubCopilot", "#OpenAICodex", "#CleanCode", "#PromptEngineering"]

        elif "golang" in full_text or ("concurrency" in full_text and "go" in name_lower):
            hook = f"🔥 Viết code Go cho AI Coding Agent chuẩn Idiomatic: Chống goroutine leak, race condition và tối ưu memory!"
            summary = f"Golang nổi tiếng với concurrency mạnh mẽ nhưng cũng dễ dính race condition và rò rỉ goroutine nếu AI không hiểu sâu context timeout. {title} trang bị cho Agent toàn bộ convention của Uber Go Style Guide và các pattern đồng thời tối ưu nhất."
            pain_before = "Agent sinh code Go thiếu kiểm tra context timeout, dễ gây rò rỉ goroutine âm thầm và panic lúc runtime."
            pain_after = "Code Go chuẩn mực, sạch sẽ, quản trị bộ nhớ an toàn và test race condition pass 100%."
            core_mechanism = "Tích hợp Uber Go Style Guide, cấu trúc concurrency patterns (Worker Pool, Channels, Context cancellation) và tự động sinh table-driven unit tests."
            raw_cases = skill.use_cases if isinstance(skill.use_cases, list) else []
            key_features = raw_cases if raw_cases else [
                "Tối ưu goroutines, channels và tránh rò rỉ bộ nhớ trong Go microservices",
                "Tự động sinh table-driven unit tests và benchmarks với lệnh go test -race",
                "Áp dụng chuẩn Uber Go Style Guide và Clean Architecture cho Go APIs",
                "Kiểm soát context timeout và graceful shutdown triệt để"
            ]
            code_lang = "go"
            code_filename = "concurrency_safe.go"
            code_snippet = (
                "package main\n\n"
                "import (\n"
                "\t\"context\"\n"
                "\t\"fmt\"\n"
                "\t\"time\"\n"
                ")\n\n"
                "// Xử lý task đồng thời an toàn với Context cancellation\n"
                "func SafeWorker(ctx context.Context, id int) error {\n"
                "\tselect {\n"
                "\tcase <-ctx.Done():\n"
                "\t\treturn ctx.Err()\n"
                "\tcase <-time.After(100 * time.Millisecond):\n"
                "\t\tfmt.Printf(\"Worker %d finished\\n\", id)\n"
                "\t\treturn nil\n"
                "\t}\n"
                "}"
            )
            code_exp = "Mẫu pattern xử lý tác vụ đồng thời an toàn trong Golang."
            pros = [
                "Bảo vệ microservices trước rò rỉ bộ nhớ và deadlock",
                "Code sinh ra chuẩn Clean Architecture dễ bảo trì lâu dài",
                "Sẵn sàng cho production tải cao"
            ]
            cons = [
                "Đòi hỏi hiểu biết về mô hình concurrency CSP của Go"
            ]
            who = "Golang Developers, Backend Engineers & Microservice Architects."
            hashtags = ["#Golang", "#Concurrency", "#UberGo", "#Microservices", "#Performance"]

        elif "uiux" in name_lower or "design-agent" in name_lower or any(k in full_text for k in ["ui/ux", "design system", "tailwind tokens", "wcag"]):
            hook = f"🎨 Tạm biệt giao diện AI sinh ra xấu xí và lệch chuẩn! {title} mang Design Tokens & WCAG 2.1 vào AI Agent."
            summary = f"AI sinh code giao diện thường gặp lỗi kinh điển: màu sắc thiếu tương phản, padding lộn xộn và vỡ khung hình responsive. {title} thiết lập hệ thống Design Heuristics nghiêm ngặt: 8pt spatial grid, Tailwind CSS tokens và tương thích accessibility chuẩn quốc tế."
            pain_before = "Code giao diện AI sinh ra bị vỡ layout trên mobile, màu sắc kém tương phản và không thân thiện với người dùng."
            pain_after = "Giao diện chuẩn production, đạt 100 điểm Google Lighthouse, hỗ trợ phím tắt và contrast màu chuẩn WCAG."
            core_mechanism = "Mô hình hóa hệ thống quy chuẩn thiết kế (Design Tokens, 8pt Grid, WCAG 2.1 AA) thành quy tắc nghiêm ngặt, ép CSS/Tailwind luôn đúng tỉ lệ và hỗ trợ dark mode mượt mà."
            raw_cases = skill.use_cases if isinstance(skill.use_cases, list) else []
            key_features = raw_cases if raw_cases else [
                "Tự động hóa thiết kế giao diện Web/Mobile hiện đại chuẩn tỉ lệ vàng",
                "Tích hợp chuẩn WCAG 2.1 AA accessibility (aria-labels, contrast)",
                "Tạo bộ Component Library có animation mượt mà",
                "Chuẩn hóa hệ thống Tailwind CSS tokens và dark mode palette"
            ]
            code_lang = "css"
            code_filename = "design-tokens.css"
            code_snippet = (
                "/* 8pt Spatial Grid & WCAG 2.1 AA High-Contrast Tokens */\n"
                ":root {\n"
                "  --space-1: 0.25rem; /* 4px */\n"
                "  --space-2: 0.5rem;  /* 8px - Base Grid Unit */\n"
                "  --space-3: 0.75rem; /* 12px */\n"
                "  --space-4: 1rem;    /* 16px */\n"
                "  --color-brand: #7c3aed; /* Contrast ratio > 4.5:1 */\n"
                "  --radius-xl: 1rem;\n"
                "}"
            )
            code_exp = "Định nghĩa hệ thống biến không gian 8pt Grid và màu chuẩn tương phản WCAG."
            pros = [
                "Biến code thô của AI thành UI cấp Production tuyệt đẹp",
                "Đảm bảo ứng dụng thân thiện với mọi đối tượng người dùng",
                "Tối ưu hóa điểm SEO và Google Lighthouse"
            ]
            cons = [
                "Cần cấu hình Tailwind config để đồng bộ biến CSS tokens"
            ]
            who = "Frontend Developers, UI/UX Designers & Indie Hackers."
            hashtags = ["#UIUX", "#DesignSystem", "#TailwindCSS", "#Accessibility", "#Frontend"]

        elif "nextjs" in name_lower or "next.js" in full_text or "app router" in full_text:
            hook = f"⚡ Next.js 15 App Router & Server Actions: Đừng để AI viết code kiểu Pages Router cũ kỹ nữa!"
            summary = f"Next.js 15 với React Server Components và Server Actions mang lại tốc độ vượt bậc nhưng cũng đòi hỏi cấu trúc code chặt chẽ. {title} giúp AI nắm vững kiến trúc Server/Client boundary, validation Zod an toàn và chiến lược revalidateTag caching."
            pain_before = "AI hay dùng useEffect sai mục đích, trộn lẫn Server và Client Components, tạo ra lỗ hổng bảo mật trong Server Actions."
            pain_after = "Chuẩn hóa Server Actions với Zod validation, tối ưu React Server Components và chiến lược revalidateTag caching đỉnh cao."
            core_mechanism = "Tách bạch ranh giới Server/Client Components ('use server' vs 'use client'); áp dụng Zod schema validation và tối ưu luồng SSR/Streaming."
            raw_cases = skill.use_cases if isinstance(skill.use_cases, list) else []
            key_features = raw_cases if raw_cases else [
                "Viết Server Actions an toàn có validation Zod và error handling",
                "Tối ưu Caching và React Server Components đạt 100 điểm Lighthouse",
                "Cấu hình Metadata và OpenGraph dynamic tags cho SEO",
                "Phân tách rõ ràng ranh giới Client/Server Components"
            ]
            code_lang = "typescript"
            code_filename = "actions.ts"
            code_snippet = (
                "'use server';\n\n"
                "import { z } from 'zod';\n"
                "import { revalidateTag } from 'next/cache';\n\n"
                "const Schema = z.object({ query: z.string().min(2).max(100) });\n\n"
                "export async function handleSearch(formData: FormData) {\n"
                "  const parsed = Schema.safeParse({ query: formData.get('query') });\n"
                "  if (!parsed.success) return { error: 'Invalid input' };\n"
                "  revalidateTag('search-results');\n"
                "  return { success: true, data: parsed.data };\n"
                "}"
            )
            code_exp = "Mẫu Server Action an toàn với Zod validation và revalidateTag."
            pros = [
                "Bảo vệ backend Next.js an toàn trước các lỗ hổng input",
                "Tận dụng tối đa hiệu năng của React 19 và Next.js 15",
                "Code chuẩn mực, không sinh warning console"
            ]
            cons = [
                "Yêu cầu dự án đang chạy Next.js 14+ hoặc Next.js 15"
            ]
            who = "Frontend & Fullstack Developers xây dựng Web App hiện đại."
            hashtags = ["#Nextjs", "#React19", "#ServerActions", "#TypeScript", "#WebDev"]

        elif "mcp" in full_text or cat == "mcp-server":
            hook = f"🔌 Nâng cấp sức mạnh cho AI Agent của bạn với MCP Server: {title}!"
            summary = f"Nếu AI Agent của bạn chỉ dừng lại ở việc đọc text mà chưa thể tương tác trực tiếp với dữ liệu thực tế, {title} chính là cầu nối Model Context Protocol chuẩn mực giúp Agent kết nối an toàn và hiệu quả."
            pain_before = "AI chỉ trả lời lý thuyết, mỗi lần cần dữ liệu từ bên ngoài là lập trình viên phải copy-paste thủ công vào cửa sổ chat."
            pain_after = "Agent được trao các Tools và Resources chuẩn MCP, có thể tự động truy vấn dữ liệu thời gian thực và thực thi lệnh có kiểm soát."
            core_mechanism = "Hiện thực hóa giao thức JSON-RPC theo chuẩn Model Context Protocol của Anthropic, cung cấp schema tool calling rõ ràng cho mô hình ngôn ngữ."
            key_features = [
                f"Kết nối AI an toàn và chuẩn hóa với dịch vụ {title}",
                "Cấp quyền granular permissions chống thực thi mã ngoài ý muốn",
                "Tương thích với Claude Desktop, Cursor, Antigravity và Windsurf",
                "Cài đặt tức thì qua NPX hoặc Python package"
            ]
            code_lang = "json"
            code_filename = "mcp-config.json"
            code_snippet = (
                "{\n"
                "  \"mcpServers\": {\n"
                f"    \"{title.lower().replace(' ', '-')}\": {{\n"
                f"      \"command\": \"npx\",\n"
                f"      \"args\": [\"-y\", \"{name.split('/')[-1]}\"]\n"
                "    }\n"
                "  }\n"
                "}"
            )
            code_exp = "Cấu hình Model Context Protocol server để AI nhận diện công cụ."
            pros = [
                "Tuân thủ tiêu chuẩn mở MCP tương lai của ngành AI",
                "Dễ tích hợp, bảo mật và kiểm soát quyền hạn tốt",
                "Mở rộng năng lực agent mà không cần viết lại prompt từ đầu"
            ]
            cons = [
                "Cần kiểm tra quyền truy cập mạng và biến môi trường khi cài đặt",
                "Agent cần mô hình hỗ trợ Tool Calling tốt (Claude 3.5 / Gemini 2.5)"
            ]
            who = "Các kỹ sư phần mềm đang xây dựng workflow tự động hóa với Agentic AI."
            hashtags = ["#ModelContextProtocol", "#MCPServer", "#AIAgents", "#OpenSource"]

        else:
            # Dynamic smart synthesis directly from skill metadata (readme, use_cases, comparison_notes)
            clean_title = title.replace("-", " ").title()
            raw_cases = skill.use_cases if isinstance(skill.use_cases, list) else []
            comp_notes = (skill.comparison_notes or "").strip()
            ai_sum = (skill.ai_summary or "").strip()

            hook = f"🚀 Khám phá giải pháp {clean_title}: Đột phá công nghệ vừa lọt bảng xếp hạng trending!"
            if raw_cases:
                hook = f"⚡ Giải quyết dứt điểm bài toán: {raw_cases[0]} cùng giải pháp {clean_title}!"
            elif ai_sum:
                hook = f"💡 Đột phá công nghệ mới: {clean_title} — {ai_sum[:110]}..."

            summary = f"{clean_title} ({name}) đang nhận được sự chú ý lớn từ cộng đồng kỹ sư công nghệ. Công cụ này giải quyết bài toán: {analysis.get('what_it_does', 'Tối ưu hóa quy trình phát triển và tự động hóa công việc.')}"

            if comp_notes:
                pain_before = "Lập trình viên thường phải đối mặt với các giải pháp phân tán, thiếu quy chuẩn đồng bộ và cấu hình thủ công dễ phát sinh lỗi."
                pain_after = comp_notes
            elif raw_cases and len(raw_cases) >= 2:
                pain_before = "Quy trình xử lý các tác vụ này thủ công, tốn nhiều thời gian kiểm thử và thiếu khả năng mở rộng."
                pain_after = f"Tự động hóa hoàn toàn {raw_cases[0].lower()}, đồng thời hỗ trợ {raw_cases[1].lower()} với độ ổn định cao."
            else:
                pain_before = f"Việc triển khai các tác vụ liên quan đến {category_label} trên nền tảng {primary_lang} tốn nhiều thời gian và công sức bảo trì."
                pain_after = f"Cung cấp kiến trúc chuẩn hóa, tự động hóa quy trình phức tạp và nâng cao năng suất lập trình rõ rệt."

            core_mechanism = ai_sum if ai_sum else f"Kiến trúc module hóa tinh gọn dành cho hệ sinh thái {primary_lang}, tối ưu hóa tương tác giữa lập trình viên và hệ thống."

            key_features = raw_cases[:4] if raw_cases else [
                f"Giải pháp chuyên biệt cho hệ sinh thái {primary_lang}",
                analysis.get("what_it_does", f"Hỗ trợ tối ưu hóa quy trình {category_label}"),
                "Tài liệu hướng dẫn trực quan, dễ tích hợp vào dự án hiện có",
                "Hiệu năng cao và tối ưu hóa tài nguyên hệ thống"
            ]

            # Extract real code snippet from readme
            extracted_code, code_lang, code_filename, code_exp = cls._extract_code_from_readme(readme, primary_lang, name)
            code_snippet = extracted_code

            pros = [
                comp_notes if comp_notes else "Được cộng đồng đánh giá cao về tính thực tiễn và dễ áp dụng",
                f"Tương thích sâu với môi trường phát triển {primary_lang}",
                "Mã nguồn mở minh bạch, dễ dàng mở rộng và tùy biến"
            ]
            cons = [
                "Nên đọc kỹ tài liệu về phiên bản tương thích trước khi đưa vào sản phẩm chính thức"
            ]
            who = analysis.get("target_audience") or f"Lập trình viên và kỹ sư công nghệ phát triển ứng dụng với {primary_lang}."
            hashtags = ["#OpenSource", "#DevTools", f"#{cat.replace('-', '')}", f"#{primary_lang.replace(' ', '')}"]

        # Calculate realistic initial reactions
        base_likes = 120 + (stars % 880)
        base_hearts = 65 + (stars % 430)
        base_bookmarks = 40 + (stars % 260)
        base_shares = 15 + (stars % 95)

        return {
            "id": f"post-{skill.id}",
            "skill_id": skill.id,
            "title": title,
            "name": name,
            "author_handle": author_handle,
            "author_name": author,
            "posted_time_ago": "Hôm nay • Phân tích chuyên sâu",
            "badge": badge,
            "hook": hook,
            "summary": summary,
            "pain_point_story": {
                "before": pain_before,
                "after": pain_after
            },
            "core_mechanism": core_mechanism,
            "key_features": key_features,
            "code_example": {
                "language": code_lang,
                "filename": code_filename,
                "code": code_snippet,
                "explanation": code_exp
            },
            "pros_and_cons": {
                "pros": pros,
                "cons": cons
            },
            "who_should_use": who,
            "discussion_prompt": f"Anh em đã thử {title} trong dự án thực tế chưa? Chia sẻ cảm nhận và kinh nghiệm thực chiến bên dưới nhé! 👇",
            "hashtags": hashtags,
            "reactions": {
                "likes": base_likes,
                "hearts": base_hearts,
                "bookmarks": base_bookmarks,
                "shares": base_shares
            },
            "read_time_minutes": 3,
            "repository_url": skill.repository_url or ""
        }

    @classmethod
    def _generate_podcast_dialogue(
        cls,
        date_str: str,
        skill_summaries: List[Dict[str, Any]],
        language: str = "vi"
    ) -> tuple[str, str, List[str]]:
        """
        Creates a lively podcast episode script + executive summary + key highlights.
        """
        top_skills = skill_summaries[:6]
        formatted_date = date_str
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            formatted_date = f"{dt.day:02d}/{dt.month:02d}/{dt.year}"
        except Exception:
            pass

        highlights = []
        for s in top_skills[:4]:
            highlights.append(f"{s['title']}: {s['what_it_does']}")

        # Build engaging Host Script
        script_parts = []
        script_parts.append(
            f"Chào mừng anh em lập trình viên đến với Bản Tin AI Radar ngày {formatted_date}! "
            f"Tôi là Minh Hiếu, cùng đồng hành mang đến những công cụ AI Agent và kỹ năng lập trình mới nhất hôm nay. "
            f"Hôm nay hệ thống của chúng ta vừa phát hiện {len(skill_summaries)} công cụ rất đáng chú ý. Hãy cùng điểm qua xem chúng có tác dụng gì thực tế nhé!"
        )

        for i, s in enumerate(top_skills, 1):
            script_parts.append(
                f"Món thứ {i} là {s['title']} thuộc nhóm {s['category']}, hiện đạt {s['stars']:,} stars. "
                f"Nó có tác dụng gì? Đơn giản là: {s['what_it_does']} "
                f"Nỗi đau giải quyết: {s['pain_point_solved']}"
            )

        script_parts.append(
            f"Đó là điểm tin công nghệ AI nổi bật của ngày {formatted_date}. "
            f"Anh em có thể xem bảng phân tích chi tiết và copy lệnh dùng ngay bên dưới. "
            f"Chúc anh em một ngày làm việc năng suất cùng AI, hẹn gặp lại trong bản tin ngày mai!"
        )

        podcast_script = " \n\n".join(script_parts)

        # Build Executive Markdown Summary
        summary_md = (
            f"### 🎙️ Tổng Quan Bản Tin Ngày {formatted_date}\n\n"
            f"Hôm nay cộng đồng nhà phát triển chứng kiến sự bùng nổ của **{len(skill_summaries)} giải pháp mới**, "
            f"nổi bật nhất là các công cụ kết nối trực tiếp AI với môi trường Runtime thực tế (DevTools, MCP, Automation).\n\n"
            f"#### 🌟 Điểm Nhấn Đáng Chú Ý (Key Highlights):\n"
        )
        for h in highlights:
            summary_md += f"- ⚡ {h}\n"

        return podcast_script, summary_md, highlights

    @classmethod
    async def generate_digest(
        cls,
        db: Session,
        date_str: str,
        language: str = "vi",
        force_regenerate: bool = False
    ) -> DailyDigest:
        """
        Generates or fetches the Daily Digest for a specific date.
        If force_regenerate is True, recalculates even if already stored.
        """
        existing = db.query(DailyDigest).filter(DailyDigest.digest_date == date_str).first()
        if existing and not force_regenerate:
            # Auto-upgrade legacy digests that lack social_post or contain old generic placeholders
            needs_upgrade = False
            if not existing.skill_summaries:
                needs_upgrade = True
            else:
                for item in existing.skill_summaries:
                    post = item.get("social_post")
                    what = item.get("what_it_does", "")
                    pain = item.get("pain_point_solved", "")
                    post_str = str(post) if post else ""
                    if (
                        not post
                        or "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" in what
                        or "thường tốn nhiều thời gian cấu hình" in pain
                        or "Đừng bỏ lỡ công cụ" in post_str
                        or "Khởi động trải nghiệm" in post_str
                    ):
                        needs_upgrade = True
                        break
            if not needs_upgrade:
                return existing

            # Re-generate enriched summaries with deep domain intelligence & social posts
            skills = cls.get_skills_for_date(db, date_str, limit=20)
            skill_summaries = [cls._analyze_skill_practical_value(s) for s in skills]
            podcast_script, summary_markdown, highlights = cls._generate_podcast_dialogue(
                date_str=date_str,
                skill_summaries=skill_summaries,
                language=language
            )
            existing.podcast_script = podcast_script
            existing.summary_markdown = summary_markdown
            existing.highlights = highlights
            existing.skill_summaries = skill_summaries
            existing.total_skills_count = len(skills)
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

        skills = cls.get_skills_for_date(db, date_str, limit=20)
        skill_summaries = [cls._analyze_skill_practical_value(s) for s in skills]

        # Determine Episode Title
        title_date = date_str
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            title_date = f"{dt.day:02d}/{dt.month:02d}/{dt.year}"
        except Exception:
            pass

        episode_title = f"AI Radar #{date_str.replace('-', '')[-4:]}: Điểm Tin AI & Kỹ Năng Mới Ngày {title_date}"
        if skill_summaries:
            top_name = skill_summaries[0]["title"]
            episode_title = f"AI Radar #{date_str.replace('-', '')[-4:]}: Đột Phá {top_name} & Điểm Tin Ngày {title_date}"

        podcast_script, summary_markdown, highlights = cls._generate_podcast_dialogue(
            date_str=date_str,
            skill_summaries=skill_summaries,
            language=language
        )

        # AI Enhancement with Gemini if available
        used_model = "smart-domain-analyzer-v2"
        if HAS_GENAI and settings.GEMINI_API_KEY:
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                top_skills_payload = [
                    {
                        "skill_id": s["skill_id"],
                        "title": s["title"],
                        "name": s["name"],
                        "category": s["category"],
                        "what_it_does": s["what_it_does"],
                        "pain_point": s["pain_point_solved"]
                    }
                    for s in skill_summaries[:4]
                ]
                prompt = (
                    f"Bạn là Host Podcast công nghệ kiêm Tech Reviewer hàng đầu trên mạng xã hội công nghệ (Substack / Twitter / LinkedIn / Dev.to). "
                    f"Dưới đây là danh sách các công cụ AI và kỹ năng lập trình mới nhất ngày {title_date}:\n"
                    f"{json.dumps(top_skills_payload, ensure_ascii=False, indent=2)}\n\n"
                    f"Hãy hoàn thiện nội dung bản tin theo định dạng JSON với các trường sau:\n"
                    f"1. title: Tiêu đề bản tin cực kỳ cuốn hút, phản ánh điểm đột phá hôm nay.\n"
                    f"2. podcast_script: Kịch bản phát thanh/podcast bằng tiếng Việt (250-350 từ) sinh động, dí dỏm, nhấn mạnh tác dụng thực tế của từng công cụ.\n"
                    f"3. highlights: Mảng 3-4 câu điểm nhấn ngắn gọn.\n"
                    f"4. social_reviews: Danh sách bài review mạng xã hội cho các công cụ trên, mỗi phần tử gồm: "
                    f"skill_id, hook (câu giật tít đánh trúng nỗi đau dev), deep_dive (phân tích sâu 2-3 câu về cơ chế hoạt động), "
                    f"pros (mảng 2 ưu điểm), cons (mảng 1 nhược điểm/lưu ý).\n"
                    f"Chỉ trả về JSON thuần túy."
                )
                response = None
                for candidate_model in ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.1-flash-lite"]:
                    try:
                        response = client.models.generate_content(
                            model=candidate_model,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                temperature=0.7,
                                response_mime_type="application/json"
                            )
                        )
                        if response and response.text:
                            used_model = candidate_model
                            break
                    except Exception as me:
                        logger.warning(f"Daily digest model {candidate_model} failed: {me}")

                if response and response.text:
                    parsed = json.loads(response.text)
                    if "podcast_script" in parsed and parsed["podcast_script"]:
                        podcast_script = parsed["podcast_script"]
                    if "title" in parsed and parsed["title"]:
                        episode_title = parsed["title"]
                    if "highlights" in parsed and parsed["highlights"]:
                        hl = parsed["highlights"]
                        if isinstance(hl, list):
                            highlights = [str(h) for h in hl if h]
                        elif isinstance(hl, str):
                            try:
                                parsed_hl = json.loads(hl)
                                highlights = parsed_hl if isinstance(parsed_hl, list) else [h.strip() for h in hl.split("\n") if h.strip()]
                            except Exception:
                                highlights = [h.strip() for h in hl.split("\n") if h.strip()]
                    if "social_reviews" in parsed and isinstance(parsed["social_reviews"], list):
                        reviews_by_id = {r.get("skill_id"): r for r in parsed["social_reviews"] if isinstance(r, dict)}
                        for s_summary in skill_summaries:
                            s_id = s_summary.get("skill_id")
                            if s_id in reviews_by_id:
                                r = reviews_by_id[s_id]
                                post = s_summary.get("social_post") or {}
                                if r.get("hook"):
                                    post["hook"] = r["hook"]
                                if r.get("deep_dive"):
                                    post["core_mechanism"] = r["deep_dive"]
                                if r.get("pros"):
                                    post.setdefault("pros_and_cons", {})["pros"] = r["pros"]
                                if r.get("cons"):
                                    post.setdefault("pros_and_cons", {})["cons"] = r["cons"]
                                s_summary["social_post"] = post
            except Exception as gemini_err:
                logger.warning(f"Gemini enhancement error for daily digest, using smart heuristic: {gemini_err}")

        # Ensure highlights is strictly a list
        if isinstance(highlights, str):
            highlights = [h.strip() for h in highlights.split("\n") if h.strip()]
        elif not isinstance(highlights, list):
            highlights = [str(highlights)]

        # Save or update record in DB
        if existing:
            existing.title = episode_title
            existing.summary_markdown = summary_markdown
            existing.podcast_script = podcast_script
            existing.highlights = highlights
            existing.skill_summaries = skill_summaries
            existing.total_skills_count = len(skills)
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            digest = DailyDigest(
                digest_date=date_str,
                title=episode_title,
                summary_markdown=summary_markdown,
                podcast_script=podcast_script,
                highlights=highlights,
                skill_summaries=skill_summaries,
                total_skills_count=len(skills),
                podcast_voice="vi-VN-NamMinhNeural",
                source_model=used_model if (HAS_GENAI and settings.GEMINI_API_KEY) else "smart-heuristic-v1"
            )
            db.add(digest)
            db.commit()
            db.refresh(digest)
            return digest

    @classmethod
    async def synthesize_podcast_audio(
        cls,
        db: Session,
        date_str: str,
        voice: str = "gemini-Aoede",
        rate: str = "+5%",
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Synthesizes audio for the podcast script using TTSService.
        """
        digest = await cls.generate_digest(db, date_str, force_regenerate=False)

        # If audio exists and not forcing new synthesis, return cached audio (ensure not empty dummy)
        if (
            digest.podcast_audio_base64
            and len(digest.podcast_audio_base64) > 1000
            and digest.podcast_voice == voice
            and not force_regenerate
        ):
            return {
                "date": date_str,
                "title": digest.title,
                "audio_base64": digest.podcast_audio_base64,
                "duration_seconds": digest.podcast_duration_sec,
                "voice": digest.podcast_voice,
                "cached": True
            }

        # Keep script within safe length for TTS
        tts_text = digest.podcast_script
        if len(tts_text) > 4500:
            tts_text = tts_text[:4400] + " ... Cảm ơn anh em đã lắng nghe bản tin hôm nay!"

        # Determine best provider based on voice ID
        target_provider = "edge_tts"
        if voice.startswith("gemini-"):
            target_provider = "gemini_audio"
        elif "Wavenet" in voice or "Journey" in voice:
            target_provider = "google_tts"

        # Call TTSService with generous timeout for full podcast reading (up to 75s)
        audio_base64 = ""
        duration = 0.0
        try:
            result = await asyncio.wait_for(
                TTSService.synthesize(
                    text=tts_text,
                    voice=voice,
                    rate=rate,
                    provider=target_provider
                ),
                timeout=75.0
            )
            audio_base64 = result.get("audio_base64", "")
            duration = float(result.get("duration_seconds", 0.0))
        except asyncio.TimeoutError:
            logger.warning(f"TTS synthesis timed out after 75s for {date_str}")
        except Exception as tts_err:
            logger.warning(f"TTS synthesis failed for {date_str}: {tts_err}")

        # Update digest record with resilient error handling only if audio was successfully produced
        if audio_base64 and duration > 0:
            try:
                digest.podcast_audio_base64 = audio_base64
                digest.podcast_duration_sec = duration
                digest.podcast_voice = voice
                digest.updated_at = datetime.utcnow()
                db.commit()
            except Exception as commit_err:
                logger.warning(f"Initial commit failed ({commit_err}), rolling back and retrying...")
                try:
                    db.rollback()
                    fresh = db.query(DailyDigest).filter(DailyDigest.digest_date == date_str).first()
                    if fresh:
                        fresh.podcast_audio_base64 = audio_base64
                        fresh.podcast_duration_sec = duration
                        fresh.podcast_voice = voice
                        fresh.updated_at = datetime.utcnow()
                        db.commit()
                except Exception as retry_err:
                    logger.error(f"Error persisting audio to DB on retry: {retry_err}")

        return {
            "date": date_str,
            "title": digest.title,
            "audio_base64": audio_base64,
            "duration_seconds": duration,
            "voice": voice,
            "cached": False
        }
