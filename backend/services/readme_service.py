import re
import logging
import asyncio
from typing import Optional, Dict, Any, Tuple, List
import httpx

from config import settings

logger = logging.getLogger("ReadmeService")

SUPPORTED_LANGUAGES = {
    "vi": "Tiếng Việt (Vietnamese)",
    "en": "English",
    "ja": "Japanese (日本語)",
    "zh": "Chinese (中文)",
    "ko": "Korean (한국어)",
    "fr": "French (Français)",
    "es": "Spanish (Español)",
    "de": "German (Deutsch)",
}


class ReadmeService:
    """
    Handles fetching authentic repository READMEs directly from GitHub
    and provides multi-tiered AI translation:
    1. Google Gemini Flash (Prioritizing gemini-3.8-flash)
    2. Local LLM (Ollama - e.g. qwen2.5:7b)
    3. Translation Engine (MyMemory / Web API fallback)
    """

    @staticmethod
    def parse_github_repo(url: str) -> Optional[Tuple[str, str]]:
        """
        Parses GitHub owner and repository name from URL.
        Supports:
        - https://github.com/owner/repo
        - https://github.com/owner/repo.git
        - https://github.com/owner/repo/tree/main
        - git@github.com:owner/repo.git
        """
        if not url:
            return None
        
        clean_url = url.strip()
        match = re.search(r"github\.com[:/]([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+)", clean_url)
        if not match:
            return None
        
        owner = match.group(1)
        repo = match.group(2)
        if repo.endswith(".git"):
            repo = repo[:-4]
        
        # Strip trailing slash or branch sub-paths
        repo = repo.split("/")[0]
        return owner, repo

    @staticmethod
    def normalize_markdown_images(markdown: str, owner: str, repo: str, branch: str = "HEAD") -> str:
        """
        Rewrites relative image paths in markdown (e.g. ./images/logo.png or images/cover.png)
        to absolute GitHub raw URLs so images render seamlessly in the browser.
        """
        if not markdown or not owner or not repo:
            return markdown

        raw_base = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/"

        def _replace_md_image(match):
            alt = match.group(1)
            src = match.group(2).strip()
            if src.startswith(("http://", "https://", "data:", "#", "mailto:")):
                return match.group(0)
            clean_src = src.lstrip("./")
            return f"![{alt}]({raw_base}{clean_src})"

        # Replace Markdown ![alt](path)
        content = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", _replace_md_image, markdown)

        def _replace_html_image(match):
            prefix = match.group(1)
            src = match.group(2).strip()
            suffix = match.group(3)
            if src.startswith(("http://", "https://", "data:", "#", "mailto:")):
                return match.group(0)
            clean_src = src.lstrip("./")
            return f"{prefix}{raw_base}{clean_src}{suffix}"

        # Replace HTML <img ... src="..." ...>
        content = re.sub(
            r'(<img\b[^>]*?\bsrc=["\'])([^"\']+)(["\'][^>]*?>)',
            _replace_html_image,
            content,
            flags=re.IGNORECASE
        )

        return content

    @classmethod
    async def fetch_github_readme(cls, repository_url: str) -> Optional[str]:
        """
        Fetches the raw README.md file directly from GitHub repository.
        Attempts GitHub REST API first, then falls back to raw.githubusercontent.com.
        """
        parts = cls.parse_github_repo(repository_url)
        if not parts:
            logger.warning(f"Could not parse GitHub repo from url: {repository_url}")
            return None

        owner, repo = parts
        headers = {
            "Accept": "application/vnd.github.raw",
            "User-Agent": "AgentSkillTrending/1.0",
        }
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

        readme_text = ""
        branch_used = "HEAD"

        # 1. Try official GitHub API (gets default branch automatically)
        api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(api_url, headers=headers)
                if resp.status_code == 200 and resp.text.strip():
                    readme_text = resp.text
                    logger.info(f"Fetched README for {owner}/{repo} via GitHub API (len={len(readme_text)})")
        except Exception as api_err:
            logger.warning(f"GitHub API readme fetch error for {owner}/{repo}: {api_err}")

        # 2. Fallback to raw.githubusercontent.com across common branches & cases
        if not readme_text:
            raw_candidates = [
                f"https://raw.githubusercontent.com/{owner}/{repo}/main/README.md",
                f"https://raw.githubusercontent.com/{owner}/{repo}/master/README.md",
                f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/README.md",
                f"https://raw.githubusercontent.com/{owner}/{repo}/main/readme.md",
                f"https://raw.githubusercontent.com/{owner}/{repo}/master/readme.md",
            ]
            raw_headers = {"User-Agent": "Mozilla/5.0 (AgentSkillTrending)"}
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                for candidate in raw_candidates:
                    try:
                        resp = await client.get(candidate, headers=raw_headers)
                        if resp.status_code == 200 and resp.text.strip():
                            readme_text = resp.text
                            if "/main/" in candidate:
                                branch_used = "main"
                            elif "/master/" in candidate:
                                branch_used = "master"
                            logger.info(f"Fetched README for {owner}/{repo} via Raw URL: {candidate}")
                            break
                    except Exception as raw_err:
                        continue

        if not readme_text:
            logger.warning(f"Unable to locate README for repository {owner}/{repo}")
            return None

        # Rewrite relative image paths to absolute raw links
        normalized_readme = cls.normalize_markdown_images(readme_text, owner, repo, branch=branch_used)

        # Truncate if exceptionally huge (> 60,000 characters) to preserve UI performance
        max_chars = 60000
        if len(normalized_readme) > max_chars:
            normalized_readme = (
                normalized_readme[:max_chars]
                + f"\n\n---\n\n*(Nội dung README quá dài đã được rút gọn để tối ưu hóa hiển thị. Xem bản đầy đủ trên [GitHub]({repository_url}))*"
            )

        return normalized_readme

    _cached_ollama_url: Optional[str] = None

    @classmethod
    async def get_active_ollama_url(cls) -> Optional[Tuple[str, str]]:
        """
        Detects active Ollama instance across configured host, host.docker.internal, and localhost.
        Returns (working_url, model_name) if available, else None.
        """
        candidate_urls: List[str] = []
        configured = getattr(settings, "OLLAMA_HOST", "").rstrip("/")
        if configured:
            candidate_urls.append(configured)

        for fallback in ["http://host.docker.internal:11434", "http://localhost:11434", "http://127.0.0.1:11434"]:
            if fallback not in candidate_urls:
                candidate_urls.append(fallback)

        if cls._cached_ollama_url and cls._cached_ollama_url in candidate_urls:
            candidate_urls.remove(cls._cached_ollama_url)
            candidate_urls.insert(0, cls._cached_ollama_url)

        for url in candidate_urls:
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    resp = await client.get(f"{url}/api/tags")
                    if resp.status_code == 200:
                        data = resp.json()
                        models = data.get("models", [])
                        if models:
                            model_name = models[0].get("name", "qwen2.5:7b")
                            for m in models:
                                m_name = m.get("name", "")
                                if "qwen" in m_name or "llama" in m_name:
                                    model_name = m_name
                                    break
                            cls._cached_ollama_url = url
                            return url, model_name
            except Exception:
                continue

        cls._cached_ollama_url = None
        return None

    @classmethod
    async def check_ollama_status(cls) -> Tuple[bool, Optional[str]]:
        """Checks if local/remote Ollama instance is active and returns (available, model_name)."""
        active = await cls.get_active_ollama_url()
        if active:
            return True, active[1]
        return False, None

    @classmethod
    async def get_available_providers(cls) -> List[Dict[str, Any]]:
        """Returns streamlined list of translation providers with live availability status."""
        has_gemini = bool(settings.GEMINI_API_KEY)
        has_ollama, ollama_model = await cls.check_ollama_status()

        return [
            {
                "id": "auto",
                "name": "⚡ Tự động thông minh (Auto)",
                "description": "Tự động ưu tiên Gemini / Local Ollama -> Web Engine",
                "available": True,
                "badge": "Khuyên dùng",
                "category": "auto"
            },
            {
                "id": "local_llm",
                "name": f"🖥️ Local LLM (Ollama{f': {ollama_model}' if ollama_model else ''})",
                "description": "Chạy trực tiếp mô hình AI trên máy cá nhân (Offline, bảo mật, miễn phí 100%)",
                "available": has_ollama,
                "badge": "Sẵn sàng" if has_ollama else "Chưa bật Ollama",
                "category": "local"
            },
            {
                "id": "gemini",
                "name": "⚡ Google Gemini Cloud",
                "description": "Mô hình Flash tốc độ cao của Google",
                "available": has_gemini,
                "badge": "Cloud AI",
                "category": "gemini"
            },
            {
                "id": "translation_engine",
                "name": "🌐 Translation Engine (Web)",
                "description": "Dịch nhanh dự phòng không cần AI API key",
                "available": True,
                "badge": "Miễn phí",
                "category": "engine"
            }
        ]

    @classmethod
    async def _translate_via_ollama(
        cls,
        content: str,
        ollama_url: str,
        ollama_model: str,
        system_instruction: str,
        target_lang: str = "vi",
    ) -> Optional[str]:
        """Translates markdown content via Ollama, splitting large docs into section chunks if needed."""
        # For documents under 6000 chars, translate in one shot
        if len(content) <= 6000:
            prompt = f"""[System Instructions]\n{system_instruction}\n\n[Original Markdown Content]\n{content}\n"""
            async with httpx.AsyncClient(timeout=60.0) as gen_client:
                gen_resp = await gen_client.post(
                    f"{ollama_url}/api/generate",
                    json={
                        "model": ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.3}
                    }
                )
                if gen_resp.status_code == 200:
                    text = gen_resp.json().get("response", "").strip()
                    if text:
                        return text
            return None

        # For large documents (>6000 chars), split by Markdown sections (## ) to prevent timeout & context cutoff
        raw_sections = re.split(r"(?=\n##\s+)", content)
        translated_sections: List[str] = []

        chunks: List[str] = []
        curr = ""
        for sec in raw_sections:
            if len(curr) + len(sec) < 4500:
                curr += sec
            else:
                if curr:
                    chunks.append(curr)
                curr = sec
        if curr:
            chunks.append(curr)

        max_chunks = 4
        async with httpx.AsyncClient(timeout=60.0) as gen_client:
            for idx, chunk in enumerate(chunks[:max_chunks]):
                prompt = f"""[System Instructions]\n{system_instruction}\n\n[Markdown Chunk {idx+1}/{min(len(chunks), max_chunks)}]\n{chunk}\n"""
                try:
                    gen_resp = await gen_client.post(
                        f"{ollama_url}/api/generate",
                        json={
                            "model": ollama_model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {"temperature": 0.3}
                        }
                    )
                    if gen_resp.status_code == 200:
                        chunk_text = gen_resp.json().get("response", "").strip()
                        translated_sections.append(chunk_text if chunk_text else chunk)
                    else:
                        translated_sections.append(chunk)
                except Exception as chunk_err:
                    logger.warning(f"Ollama chunk {idx+1} translation error: {chunk_err}")
                    translated_sections.append(chunk)

        if len(chunks) > max_chunks:
            translated_sections.append(
                "\n\n---\n*(Phần nội dung chi tiết phía sau quá dài, xem nguyên bản trên GitHub)*\n\n"
                + "".join(chunks[max_chunks:])
            )

        return "\n".join(translated_sections)

    @classmethod
    async def translate_markdown_content(
        cls,
        content: str,
        target_lang: str = "vi",
        preferred_provider: str = "auto",
    ) -> Dict[str, Any]:
        """
        Translates Markdown content using user-selected provider or multi-tiered cascade:
        - preferred_provider can be: "auto", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "local_llm", "translation_engine"
        """
        if not content or not content.strip():
            return {
                "success": False,
                "translated_text": "",
                "provider": "none",
                "model_used": "none",
                "error": "Empty content"
            }

        target_lang_label = SUPPORTED_LANGUAGES.get(target_lang, "Tiếng Việt (Vietnamese)")

        system_instruction = f"""Bạn là chuyên gia dịch thuật kỹ thuật phần mềm và AI hàng đầu (Principal Technical Translator).
Nhiệm vụ: Dịch tài liệu GitHub README Markdown sang ngôn ngữ {target_lang_label} với văn phong kỹ thuật chuẩn mực, tự nhiên và sắc bén cho lập trình viên.

CÁC NGUYÊN TẮC BẮT BUỘC:
1. BẢO TOÀN CẤU TRÚC: Giữ nguyên toàn bộ cú pháp Markdown (#, ##, ###, bullet points, danh sách đánh số, bảng biểu, blockquote, horizontal rules).
2. TUYỆT ĐỐI KHÔNG DỊCH:
   - Các khối mã nguồn (code blocks: ```...```) và inline code (`...`).
   - Lệnh terminal, shell, CLI (ví dụ: `docker compose up`, `npm install`, `git clone`).
   - Tên thư viện, package, function, biến, class, URL, link repo, JSON/YAML keys, file paths.
3. DỊCH CHÍNH XÁC & CHUYÊN NGHIỆP:
   - Dịch các tiêu đề, giải thích tính năng, hướng dẫn sử dụng, mô tả dự án.
   - Sử dụng thuật ngữ kỹ thuật phổ biến trong giới công nghệ (giữ nguyên các thuật ngữ chuẩn như Workflow, RAG, Token, Pipeline, Endpoint nếu dịch ra tiếng Việt làm mất nghĩa).
4. KHÔNG THÊM LỜI DẪN: Không thêm bất kỳ lời chào, lời dẫn (ví dụ: 'Dưới đây là bản dịch...') hoặc phần kết luận của AI. Chỉ xuất ra nội dung Markdown đã dịch."""

        # -------------------------------------------------------------
        # Direct Translation Engine bypass if requested
        # -------------------------------------------------------------
        if preferred_provider == "translation_engine":
            try:
                translated_engine_text = await cls._translate_via_engine(content, target_lang=target_lang)
                if translated_engine_text:
                    return {
                        "success": True,
                        "translated_text": translated_engine_text,
                        "provider": "translation_engine",
                        "model_used": "Translation Engine (MyMemory)",
                        "target_language": target_lang
                    }
            except Exception as engine_err:
                logger.error(f"Translation Engine failed: {engine_err}")
                return {
                    "success": False,
                    "translated_text": content,
                    "provider": "translation_engine",
                    "model_used": "none",
                    "target_language": target_lang,
                    "error": str(engine_err)
                }

        # -------------------------------------------------------------
        # Direct Local LLM (Ollama) if specifically requested
        # -------------------------------------------------------------
        if preferred_provider == "local_llm":
            active = await cls.get_active_ollama_url()
            if not active:
                return {
                    "success": False,
                    "translated_text": content,
                    "provider": "local_llm",
                    "model_used": "none",
                    "target_language": target_lang,
                    "error": "Local LLM (Ollama) không phản hồi. Vui lòng đảm bảo ứng dụng Ollama đang chạy trên máy (cổng 11434)."
                }
            ollama_url, ollama_model = active
            try:
                translated_local = await cls._translate_via_ollama(
                    content=content,
                    ollama_url=ollama_url,
                    ollama_model=ollama_model,
                    system_instruction=system_instruction,
                    target_lang=target_lang
                )
                if translated_local:
                    return {
                        "success": True,
                        "translated_text": translated_local,
                        "provider": "local_llm",
                        "model_used": f"Local Ollama ({ollama_model})",
                        "target_language": target_lang
                    }
            except Exception as ollama_err:
                return {
                    "success": False,
                    "translated_text": content,
                    "provider": "local_llm",
                    "model_used": "none",
                    "target_language": target_lang,
                    "error": f"Lỗi thực thi Local Ollama: {ollama_err}"
                }
            return {
                "success": False,
                "translated_text": content,
                "provider": "local_llm",
                "model_used": "none",
                "target_language": target_lang,
                "error": "Local LLM không thể dịch nội dung này."
            }

        # -------------------------------------------------------------
        # Tier 1: Google Gemini Flash (Auto Cascade or specific model)
        # -------------------------------------------------------------
        if settings.GEMINI_API_KEY and (preferred_provider in ("auto", "gemini") or preferred_provider.startswith("gemini-")):
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt_content = f"{system_instruction}\n\n---\nNỘI DUNG MARKDOWN CẦN DỊCH:\n\n{content}"

                candidate_models = [
                    "gemini-3.7-flash",
                    "gemini-3-flash-preview",
                    "gemini-3.8-flash",
                    "gemini-3.5-flash",
                    "gemini-3.6-flash",
                    "gemini-flash-latest",
                ]

                # If user selected a specific model, prioritize it first
                if preferred_provider.startswith("gemini-"):
                    if preferred_provider in candidate_models:
                        candidate_models.remove(preferred_provider)
                    candidate_models.insert(0, preferred_provider)

                def _call_gemini_sync():
                    for model_name in candidate_models:
                        try:
                            resp = client.models.generate_content(
                                model=model_name,
                                contents=prompt_content,
                            )
                            if resp and resp.text:
                                return resp.text.strip(), model_name
                        except Exception as m_err:
                            logger.warning(f"Gemini translation model {model_name} failed: {m_err}")
                            continue
                    return "", ""

                translated_text, used_model = await asyncio.to_thread(_call_gemini_sync)

                if translated_text:
                    logger.info(f"README translated successfully via Gemini ({used_model}) into {target_lang}")
                    return {
                        "success": True,
                        "translated_text": translated_text,
                        "provider": "gemini",
                        "model_used": used_model,
                        "target_language": target_lang
                    }
            except Exception as gemini_err:
                logger.warning(f"Gemini translation failed: {gemini_err}. Checking next tier...")

            # If user explicitly requested Gemini and it failed, report clean error
            if preferred_provider in ("gemini", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"):
                return {
                    "success": False,
                    "translated_text": content,
                    "provider": "gemini",
                    "model_used": "none",
                    "target_language": target_lang,
                    "error": "Google Gemini hiện đang quá tải hoặc vượt giới hạn quota (429 RESOURCE_EXHAUSTED). Vui lòng chọn Local Ollama hoặc Web Engine."
                }

        # -------------------------------------------------------------
        # Tier 2: Local AI LLM (Ollama) in Auto Cascade
        # -------------------------------------------------------------
        if preferred_provider == "auto":
            try:
                active = await cls.get_active_ollama_url()
                if active:
                    ollama_url, ollama_model = active
                    translated_local = await cls._translate_via_ollama(
                        content=content,
                        ollama_url=ollama_url,
                        ollama_model=ollama_model,
                        system_instruction=system_instruction,
                        target_lang=target_lang
                    )
                    if translated_local:
                        logger.info(f"README translated successfully via Local Ollama ({ollama_model})")
                        return {
                            "success": True,
                            "translated_text": translated_local,
                            "provider": "local_llm",
                            "model_used": f"Local Ollama ({ollama_model})",
                            "target_language": target_lang
                        }
            except Exception as ollama_err:
                logger.warning(f"Local Ollama auto-fallback failed: {ollama_err}")

        # -------------------------------------------------------------
        # Tier 3: Translation Engine Fallback
        # -------------------------------------------------------------
        try:
            logger.info("Attempting Tier 3 Translation Engine fallback...")
            translated_engine_text = await cls._translate_via_engine(content, target_lang=target_lang)
            if translated_engine_text:
                return {
                    "success": True,
                    "translated_text": translated_engine_text,
                    "provider": "translation_engine",
                    "model_used": "Translation Engine (MyMemory)",
                    "target_language": target_lang
                }
        except Exception as engine_err:
            logger.error(f"Tier 3 Translation Engine fallback failed: {engine_err}")

        return {
            "success": False,
            "translated_text": content,
            "provider": "original",
            "model_used": "original",
            "target_language": target_lang,
            "error": "Tất cả mô hình dịch thuật hiện tại đều không phản hồi."
        }

    @classmethod
    async def _translate_via_engine(cls, text: str, target_lang: str = "vi") -> str:
        """
        Translates text chunk-by-chunk using MyMemory API while safeguarding code blocks.
        """
        code_blocks = []
        def _extract_code(match):
            placeholder = f"__CODE_BLOCK_{len(code_blocks)}__"
            code_blocks.append(match.group(0))
            return placeholder

        protected_text = re.sub(r"```[\s\S]*?```", _extract_code, text)
        paragraphs = protected_text.split("\n\n")
        translated_paragraphs = []

        cjk_regex = re.compile(r"[\u4e00-\u9fff]")
        source_lang = "zh-CN" if cjk_regex.search(text) else "en"
        lang_pair = f"{source_lang}|{target_lang}" if target_lang != source_lang else "en|vi"

        async with httpx.AsyncClient(timeout=10.0) as client:
            for para in paragraphs:
                para_stripped = para.strip()
                if not para_stripped or para_stripped.startswith("__CODE_BLOCK_"):
                    translated_paragraphs.append(para)
                    continue

                if re.match(r"^\|?(\s*:?-+:?\s*\|)+\s*$", para_stripped):
                    translated_paragraphs.append(para)
                    continue

                try:
                    query_chunk = para_stripped[:450]
                    resp = await client.get(
                        "https://api.mymemory.translated.net/get",
                        params={"q": query_chunk, "langpair": lang_pair}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        response_status = data.get("responseStatus", 200)
                        translated_chunk = data.get("responseData", {}).get("translatedText")
                        if response_status == 200 and translated_chunk and "IS AN INVALID" not in translated_chunk and "MYMEMORY WARNING" not in translated_chunk:
                            if len(para_stripped) > 450:
                                translated_chunk += para_stripped[450:]
                            translated_paragraphs.append(translated_chunk)
                        else:
                            translated_paragraphs.append(para)
                    else:
                        translated_paragraphs.append(para)
                except Exception:
                    translated_paragraphs.append(para)

        merged = "\n\n".join(translated_paragraphs)

        for idx, block in enumerate(code_blocks):
            merged = merged.replace(f"__CODE_BLOCK_{idx}__", block)

        return merged

    @classmethod
    async def translate_summary_to_vietnamese(cls, text: str, name: Optional[str] = None) -> str:
        """
        Translates a short repository description or overview summary into natural Vietnamese.
        Maintains technology names (Claude Code, Cursor, Copilot, Hermes Agent, DAG, Docker, etc.).
        Fast, robust cascade: Gemini 3.5 Flash -> Gemini 3.6 Flash -> Local Ollama -> Web Engine.
        """
        if not text or not text.strip():
            return text or ""

        cjk_regex = re.compile(r"[\u4e00-\u9fff]")

        prompt_instruction = f"""Dịch đoạn mô tả công cụ/AI Agent sau đây sang tiếng Việt chuẩn xác, súc tích (1-2 câu), văn phong tự nhiên cho lập trình viên.
- Giữ nguyên các thuật ngữ kỹ thuật, tên công cụ, mã nguồn (như Claude Code, Cursor, Copilot, Hermes Agent, DAG, Docker, API, v.v.).
- Không thêm lời chào, không thêm ngoặc kép bao quanh. Chỉ trả về nội dung đã dịch.

Nội dung: {text}"""

        # Tier 1: Gemini Flash (3.7 -> 3-preview -> 3.8 -> 3.5)
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                for m in ["gemini-3.7-flash", "gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"]:
                    try:
                        resp = await asyncio.to_thread(
                            client.models.generate_content,
                            model=m,
                            contents=prompt_instruction
                        )
                        if resp and resp.text and resp.text.strip():
                            res_text = resp.text.strip().strip('"').strip("'")
                            if res_text and not cjk_regex.search(res_text):
                                return res_text
                    except Exception:
                        continue
            except Exception as e:
                logger.warning(f"Gemini fast summary translation failed: {e}")

        # Tier 2: Local Ollama if running
        try:
            active = await cls.get_active_ollama_url()
            if active:
                ollama_url, ollama_model = active
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        f"{ollama_url}/api/generate",
                        json={
                            "model": ollama_model,
                            "prompt": prompt_instruction,
                            "stream": False,
                            "options": {"temperature": 0.2}
                        }
                    )
                    if resp.status_code == 200:
                        res_text = resp.json().get("response", "").strip().strip('"')
                        if res_text and not cjk_regex.search(res_text):
                            return res_text
        except Exception:
            pass

        # Tier 3: Web Translation Engine
        try:
            engine_text = await cls._translate_via_engine(text, target_lang="vi")
            if engine_text and not cjk_regex.search(engine_text):
                return engine_text
        except Exception:
            pass

        if cjk_regex.search(text):
            return ""
        return text
