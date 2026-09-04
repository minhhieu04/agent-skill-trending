import os
import re
import json
import base64
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from config import settings

logger = logging.getLogger("BlogVideoService")


def _first_code_block(markdown: str) -> str:
    """Returns a short, source-backed code sample from a README preview."""
    if not markdown:
        return ""
    match = re.search(r"```[^\n]*\n([\s\S]*?)```", markdown)
    if not match:
        return ""
    lines = [line.rstrip() for line in match.group(1).strip().splitlines()]
    return "\n".join(lines[:8])


def _compact_text(value: Any, limit: int = 220) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def _repository_parts(repository_url: str, fallback_name: str) -> tuple[str, str]:
    clean_url = (repository_url or "").rstrip("/")
    slug = clean_url.rsplit("/", 2)[-2:] if clean_url else []
    if len(slug) == 2:
        return slug[0], slug[1].removesuffix(".git")
    fallback = (fallback_name or "skill").split("/")
    return (fallback[-2], fallback[-1]) if len(fallback) > 1 else ("community", fallback[-1])


def _fit_scene_durations(scenes: List[Dict[str, Any]], target_duration: int) -> None:
    """Scales curated scene weights to the requested duration without timing drift."""
    if not scenes:
        return
    target = max(len(scenes) * 3, int(target_duration))
    weights = [max(1, int(scene.get("duration_seconds", 5))) for scene in scenes]
    weight_total = sum(weights)
    durations = [max(3, round(target * weight / weight_total)) for weight in weights]
    durations[-1] += target - sum(durations)
    if durations[-1] < 3:
        deficit = 3 - durations[-1]
        durations[-1] = 3
        for index in range(len(durations) - 2, -1, -1):
            reducible = max(0, durations[index] - 3)
            delta = min(reducible, deficit)
            durations[index] -= delta
            deficit -= delta
            if deficit == 0:
                break
    for scene, duration in zip(scenes, durations):
        scene["duration_seconds"] = duration


def _cap_narration_to_target(
    scenes: List[Dict[str, Any]],
    target_duration: int,
    language: str,
) -> Dict[str, int]:
    """Cap narration to a realistic speech budget without padding or repetition."""
    if not scenes:
        return {"word_count": 0, "word_budget": 0}

    words_by_scene = [
        re.findall(r"\S+", str(scene.get("voiceover_text") or ""))
        for scene in scenes
    ]
    original_total = sum(len(words) for words in words_by_scene)
    # Vietnamese neural voices include longer tonal and punctuation pauses.
    # 2.4 words/s keeps the default +15% Studio preset close to the selected
    # target while still leaving room for natural sentence cadence.
    words_per_second = 2.4 if language == "vi" else 2.6
    word_budget = max(len(scenes) * 8, round(max(1, target_duration) * words_per_second))
    if original_total <= word_budget:
        return {"word_count": original_total, "word_budget": word_budget}

    scale = word_budget / original_total
    allocations = [
        min(len(words), max(8, round(len(words) * scale)))
        for words in words_by_scene
    ]
    while sum(allocations) > word_budget:
        candidates = [index for index, count in enumerate(allocations) if count > 8]
        if not candidates:
            break
        index = max(candidates, key=lambda item: allocations[item])
        allocations[index] -= 1
    while sum(allocations) < word_budget:
        candidates = [
            index for index, words in enumerate(words_by_scene)
            if allocations[index] < len(words)
        ]
        if not candidates:
            break
        index = max(candidates, key=lambda item: len(words_by_scene[item]) - allocations[item])
        allocations[index] += 1

    for scene, words, allocation in zip(scenes, words_by_scene, allocations):
        if allocation >= len(words):
            continue
        trimmed = " ".join(words[:allocation]).rstrip(" ,;:")
        if trimmed and not re.search(r"[.!?…]$", trimmed):
            trimmed += "…"
        scene["voiceover_text"] = trimmed

    return {
        "word_count": sum(
            min(len(words), allocation)
            for words, allocation in zip(words_by_scene, allocations)
        ),
        "word_budget": word_budget,
    }


def _spoken_anchor(voiceover: str, fraction: float, size: int = 4) -> str:
    """Return an exact phrase from narration for post-TTS beat alignment."""
    words = re.findall(r"\S+", voiceover or "")
    if not words:
        return ""
    start = min(len(words) - 1, max(0, round((len(words) - 1) * fraction)))
    return " ".join(words[start:start + size])


def _add_visual_beats(scenes: List[Dict[str, Any]], language: str) -> None:
    """Give every scene distinct editorial beats without inventing new claims."""
    is_vi = language == "vi"
    for scene in scenes:
        voiceover = str(scene.get("voiceover_text") or "")
        existing_beats = scene.get("visual_beats") or []
        if existing_beats:
            for index, beat in enumerate(existing_beats):
                fraction = float(beat.get("at", (0.04, 0.38, 0.72)[min(index, 2)]))
                beat["anchor_text"] = _spoken_anchor(voiceover, fraction)
            continue
        scene_type = scene.get("scene_type") or "content"
        source = _compact_text(scene.get("source_ref") or scene.get("repository_url") or "editor context", 100)
        voiceover_sentences = [
            _compact_text(part, 150)
            for part in re.split(r"(?<=[.!?])\s+", scene.get("voiceover_text") or "")
            if part.strip()
        ]
        primary_detail = voiceover_sentences[0] if voiceover_sentences else _compact_text(scene.get("visual_description"), 150)
        secondary_detail = (
            voiceover_sentences[1]
            if len(voiceover_sentences) > 1
            else _compact_text(scene.get("visual_description") or primary_detail, 150)
        )

        if scene_type == "terminal":
            secondary_detail = _compact_text(scene.get("terminal_command") or secondary_detail, 150)
        elif scene_type == "code":
            code_lines = [line.strip() for line in (scene.get("code_snippet") or "").splitlines() if line.strip()]
            secondary_detail = _compact_text(code_lines[0] if code_lines else secondary_detail, 150)
        elif scene_type in {"features", "security"}:
            feature_items = scene.get("feature_items") or []
            secondary_detail = _compact_text(
                " · ".join(str(item.get("title") or "") for item in feature_items[:4] if item.get("title"))
                or secondary_detail,
                150,
            )
        elif scene_type == "stat":
            metrics = []
            for label, key in (("stars", "stars_count"), ("forks", "forks_count"), ("issues", "open_issues")):
                if scene.get(key) is not None:
                    metrics.append(f"{scene[key]:,} {label}")
            secondary_detail = " · ".join(metrics) or secondary_detail

        scene["visual_beats"] = [
            {
                "at": 0.04,
                "anchor_text": _spoken_anchor(voiceover, 0.04),
                "badge": "HOOK" if scene_type == "intro" else "CONTEXT",
                "title": _compact_text(scene.get("title"), 76),
                "detail": primary_detail,
            },
            {
                "at": 0.38,
                "anchor_text": _spoken_anchor(voiceover, 0.38),
                "badge": "DEMO" if scene_type in {"github", "code", "terminal"} else "KEY POINT",
                "title": "Chi tiết thực tế" if is_vi else "Practical detail",
                "detail": secondary_detail,
            },
            {
                "at": 0.72,
                "anchor_text": _spoken_anchor(voiceover, 0.72),
                "badge": "SOURCE",
                "title": "Nguồn kiểm chứng" if is_vi else "Verification source",
                "detail": source,
            },
        ]

def _parse_gemini_error(e: Exception) -> Dict[str, Any]:
    """Classifies Gemini API exceptions into quota, auth, or generic errors."""
    err_str = str(e)
    err_lower = err_str.lower()
    is_quota = any(kw in err_lower for kw in ["429", "resource_exhausted", "quota", "rate limit", "too many requests"])
    is_auth = any(kw in err_lower for kw in ["401", "403", "api_key_invalid", "permission_denied", "unauthorized", "api key not valid"])
    
    if is_quota:
        reason = "Gemini API Quota Exceeded (429 / Resource Exhausted). Đã kích hoạt bộ tạo nội dung chuẩn hóa Offline."
    elif is_auth:
        reason = "Gemini API Key không hợp lệ hoặc thiếu quyền truy cập."
    else:
        reason = f"Gemini API Error: {err_str[:200]}"
        
    return {
        "is_quota": is_quota,
        "is_auth": is_auth,
        "reason": reason,
        "raw_error": err_str
    }

def _extract_token_usage_and_finish_reason(response: Any) -> Dict[str, Any]:
    """
    Extracts token usage counters and candidate finish_reason from Gemini API response.
    Detects if generation was truncated due to reaching max output token limits (MAX_TOKENS).
    """
    finish_reason = "STOP"
    is_truncated = False
    
    try:
        if hasattr(response, "candidates") and response.candidates:
            cand = response.candidates[0]
            raw_reason = getattr(cand, "finish_reason", "STOP")
            finish_reason = str(raw_reason).split(".")[-1]
            if "MAX_TOKENS" in finish_reason or "LENGTH" in finish_reason:
                is_truncated = True
    except Exception:
        pass

    usage = {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
    }
    try:
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            meta = response.usage_metadata
            usage["prompt_tokens"] = getattr(meta, "prompt_token_count", 0) or 0
            usage["completion_tokens"] = getattr(meta, "candidates_token_count", 0) or 0
            usage["total_tokens"] = getattr(meta, "total_token_count", 0) or 0
    except Exception:
        pass

    return {
        "finish_reason": finish_reason,
        "is_truncated": is_truncated,
        "token_usage": usage
    }

def _log_gemini_audit(action: str, detail: Dict[str, Any]):
    """Safely logs Gemini AI operations, quota failures, and token limits to the AuditLog database."""
    try:
        from database import SessionLocal
        from models.audit_log import AuditLog
        with SessionLocal() as db:
            audit = AuditLog(
                username="system_gemini",
                action=action,
                target_type="gemini_ai",
                detail=detail
            )
            db.add(audit)
            db.commit()
    except Exception as log_err:
        logger.warning(f"Could not record Gemini audit log: {log_err}")

class BlogVideoService:
    @staticmethod
    async def generate_blog(
        topic: str,
        skill_data: Optional[Dict[str, Any]] = None,
        tone: str = "professional",
        language: str = "vi",
        custom_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a comprehensive SEO-friendly tech blog post.
        Supports Vietnamese (vi) and English (en).
        Automatically monitors token limit exhaustion and quota limits.
        """
        title = topic.strip()
        skill_name = skill_data.get("name", "") if skill_data else ""
        skill_title = skill_data.get("title", "") if skill_data else ""
        skill_desc = skill_data.get("description", "") if skill_data else ""
        skill_lang = skill_data.get("primary_language", "Python/TypeScript") if skill_data else "Python"
        skill_runtimes = ", ".join(skill_data.get("runtimes", ["Antigravity", "Cursor"])) if skill_data else "Antigravity, Cursor, Codex"
        
        display_title = skill_title or title or "Xu Hướng AI Agent & Kỹ Năng Lập Trình 2026"
        
        tone_descriptor = {
            "hype": "năng động, cuốn hút, nhấn mạnh tác động thực tế có trong nguồn",
            "casual": "gần gũi, chia sẻ kinh nghiệm thực chiến từ developer",
            "deep_dive": "chuyên sâu kiến trúc, phân tích mã nguồn và hệ thống",
            "professional": "chuẩn mực kỹ sư, phân tích toàn diện và best practices"
        }.get(tone, "chuyên sâu, trực quan và cuốn hút")

        # Try using Gemini API if key is configured
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                
                lang_prompt = "Viết bằng Tiếng Việt chuẩn mực, cuốn hút." if language == "vi" else "Write in fluent English with technical precision."
                
                prompt = f"""
                Bạn là một Tech Lead & AI Content Creator hàng đầu thế giới.
                Nhiệm vụ: Viết một bài Blog công nghệ hoàn chỉnh chuẩn SEO Markdown về chủ đề: "{display_title}".
                
                Thông tin bổ sung:
                - Tên Skill/Công nghệ: {skill_name or display_title}
                - Mô tả: {skill_desc}
                - Ngôn ngữ chính: {skill_lang}
                - Runtimes hỗ trợ: {skill_runtimes}
                - Phong cách (Tone): {tone_descriptor}
                - Ghi chú thêm: {custom_notes or 'Không có'}
                - Ngôn ngữ yêu cầu: {lang_prompt}
                
                Cấu trúc bài viết bắt buộc:
                # [Tiêu đề bắt mắt, chuẩn SEO]
                ## 🚀 1. Vì Sao Công Nghệ Này Là Game Changer? (The Hook)
                ## 🧠 2. Kiến Trúc & Nguyên Lý Hoạt Động (Deep Dive)
                ## 💻 3. Code Demo & Hướng Dẫn Thực Hành Nhanh (Step-by-Step)
                ## ⚡ 4. Ứng Dụng Thực Tế & So Sánh Workflow
                ## 🛡️ 5. Kinh Nghiệm Thực Chiến & An Toàn Bảo Mật (Best Practices)
                ## 🎯 6. Lời Kết & Lộ Trình Bắt Đầu
                
                Hãy chèn code snippet thực tế ({skill_lang}), bảng so sánh hoặc markdown alerts.
                """
                
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                
                if response and response.text:
                    content = response.text.strip()
                    first_line = content.split("\n")[0].replace("#", "").strip()
                    word_count = len(content.split())
                    read_time = f"{max(1, word_count // 200)} phút đọc" if language == "vi" else f"{max(1, word_count // 200)} min read"
                    
                    token_info = _extract_token_usage_and_finish_reason(response)
                    
                    # Log token truncation if output hit max token limit
                    if token_info["is_truncated"]:
                        _log_gemini_audit("gemini_token_limit_reached", {
                            "type": "blog",
                            "topic": display_title,
                            "finish_reason": token_info["finish_reason"],
                            "token_usage": token_info["token_usage"],
                            "warning": "Đầu ra bị cắt ngắn do đạt giới hạn max_output_tokens."
                        })
                    else:
                        _log_gemini_audit("gemini_generation_success", {
                            "type": "blog",
                            "topic": display_title,
                            "model": "gemini-2.5-flash",
                            "word_count": word_count,
                            "token_usage": token_info["token_usage"]
                        })
                    
                    return {
                        "title": first_line or display_title,
                        "content": content,
                        "tags": ["AI-Agent", "Tech-Blog", skill_lang, "Antigravity", "Coding-Assistant"],
                        "word_count": word_count,
                        "estimated_read_time": read_time,
                        "language": language,
                        "tone": tone,
                        "provider": "google_gemini_2.5_flash",
                        "fallback_used": False,
                        "quota_status": "ok",
                        "finish_reason": token_info["finish_reason"],
                        "is_truncated": token_info["is_truncated"],
                        "token_usage": token_info["token_usage"]
                    }
            except Exception as e:
                err_info = _parse_gemini_error(e)
                action_name = "quota_exceeded" if err_info["is_quota"] else "gemini_api_error"
                _log_gemini_audit(action_name, {
                    "source": "gemini_ai",
                    "type": "blog_generation",
                    "reason": err_info["reason"],
                    "is_quota": err_info["is_quota"],
                    "is_auth": err_info["is_auth"]
                })
                logger.warning(f"[GEMINI] Blog generation fallback triggered: {err_info['reason']}")

        # High Quality Curated Fallback Template
        fallback_res = BlogVideoService._generate_curated_blog(display_title, skill_data, tone, language)
        fallback_res["provider"] = "curated_offline_engine"
        fallback_res["fallback_used"] = True
        fallback_res["quota_status"] = "quota_exceeded_or_missing_key"
        fallback_res["finish_reason"] = "COMPLETE_OFFLINE"
        fallback_res["is_truncated"] = False
        fallback_res["token_usage"] = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        return fallback_res

    @staticmethod
    def _generate_curated_blog(title: str, skill_data: Optional[Dict[str, Any]], tone: str, language: str) -> Dict[str, Any]:
        """High-grade template generator ensuring reliable offline/zero-cost output."""
        skill_name = skill_data.get("name", title) if skill_data else title
        skill_desc = skill_data.get("description", "Giải pháp tối ưu hóa năng suất AI Agent và tự động hóa quy trình lập trình.") if skill_data else "Giải pháp tối ưu hóa năng suất AI Agent và tự động hóa quy trình lập trình."
        primary_lang = skill_data.get("primary_language", "TypeScript / Python") if skill_data else "TypeScript"
        
        if language == "vi":
            content = f"""# 🚀 {title}: Bước Đột Phá AI Thay Đổi Hoàn Toàn Quy Trình Lập Trình 2026

Trong năm 2026, việc chỉ sử dụng AI như một công cụ auto-complete đã trở nên lỗi thời. Sự trỗi dậy của **Autonomous Subagents** và chuẩn **{skill_name}** đang định hình lại toàn bộ cách chúng ta thiết kế và chuyển giao phần mềm.

---

## ⚡ 1. Vì Sao Bạn Không Thể Bỏ Qua {skill_name}?

> [!IMPORTANT]
> **Vấn đề lớn nhất của developer hiện nay:** Mất ngữ cảnh dự án khi chuyển đổi giữa các tác vụ phức tạp, khiến AI sinh mã nguồn sai quy chuẩn hoặc thiếu an toàn.

{skill_desc}

### Điểm nhấn cốt lõi:
* 🎯 **Context Injection Siêu Nhẹ**: Nạp toàn bộ quy chuẩn kiến trúc mà không làm phình context window.
* 🛡️ **Sandbox Security Guardrails**: Kiểm soát quyền truy cập hệ thống và ngăn chặn command injection.
* 🚀 **Tối Ưu Workflow**: Chỉ mô tả mức tự động hóa và tác động đã có trong nguồn.

---

## 🧠 2. Phân Tích Kiến Trúc & Cách Thức Vận Hành

Hệ thống hoạt động dựa trên cơ chế **Phân rã tác vụ (Task Decomposition)** và điều phối Subagents phản ứng nhanh:

```
[ Developer Prompt ] ➡️ [ Skill Instructions ] ➡️ [ Runtime Tools ] ➡️ [ Reviewable Output ]
```

Khi tích hợp vào các runtime như **Google Antigravity, Cursor hoặc OpenAI Codex**, các quy tắc sẽ được nạp tự động dưới dạng runtime instruction rules.

---

## 💻 3. Code Demo Thực Tế

Dưới đây là đoạn mã minh họa cách áp dụng mô hình vào dự án thực tế:

```{primary_lang.lower()}
// Minh họa cấu hình Agent Skill tối ưu hóa quy trình
export interface AgentSkillConfig {{
  id: string;
  runtime: 'antigravity' | 'cursor' | 'codex';
  securityLevel: 'strict' | 'sandboxed';
  autoWakeup: boolean;
}}

export async function executeAutonomousWorkflow(config: AgentSkillConfig) {{
  console.log(`[AgentSkills 2026] Khởi chạy workflow: ${{config.id}}`);
  // Thực thi quy trình không cần polling lặp
  return {{ status: "SUCCESS", latency_ms: 45 }};
}}
```

---

## 🛡️ 4. Best Practices & Đánh Giá An Toàn

1. **Luôn bật Sandbox Mode** trước khi cấp quyền chạy script ngoại vi.
2. **Modular hóa Rules**: Chia nhỏ quy chuẩn theo từng domain (`auth`, `database`, `api`).
3. **Audit định kỳ**: Quét token leak và lỗ hổng AST với Security Scanner tích hợp.

---

## 🎯 5. Lời Kết

**{title}** không chỉ là một công cụ, mà là một bước chuyển mình về tư duy kiến trúc AI Agent. Hãy trải nghiệm ngay hôm đây để đưa hiệu suất lập trình của bạn lên tầm cao mới!
"""
            word_count = len(content.split())
            return {
                "title": f"{title}: Bước Đột Phá AI Thay Đổi Toàn Diện Lập Trình 2026",
                "content": content,
                "tags": ["AI-Agent", "Tech-Blog", "2026", "Antigravity", "Productivity"],
                "word_count": word_count,
                "estimated_read_time": f"{max(1, word_count // 200)} phút đọc",
                "language": "vi",
                "tone": tone
            }
        else:
            content = f"""# 🚀 {title}: The Next-Gen AI Coding Paradigm in 2026

In 2026, relying solely on single-prompt code completion is obsolete. The rise of **Autonomous Subagents** and **{skill_name}** represents a massive leap toward deterministic, production-grade AI software development.

---

## ⚡ 1. Why {skill_name} Matters Today

> [!IMPORTANT]
> **Core Developer Bottleneck:** Context decay across multi-file refactoring leads to hallucinated dependencies and security leaks.

{skill_desc}

### Key Architectural Strengths:
* 🎯 **Deterministic Context Loading**: Injects precise architecture rules without context dilution.
* 🛡️ **Zero-Trust AST Guardrails**: Pre-execution sandbox validation for safe terminal operations.
* 🚀 **Workflow Support**: Describes only automation and outcomes recorded in the source.

---

## 💻 2. Implementation Demo

```{primary_lang.lower()}
// Autonomous workflow configuration sample
export interface SkillSpec {{
  name: string;
  target_ide: "antigravity" | "cursor" | "codex";
  reactive_wakeup: boolean;
}}

export async function deployAgentStack(spec: SkillSpec) {{
  console.info(`[Radar 2026] Activating skill spec: ${{spec.name}}`);
  return {{ status: "ACTIVE", review: "required" }};
}}
```

---

## 🎯 3. Conclusion & Takeaway

Integrating **{title}** into your daily workflow transforms AI assistants from simple autocomplete tools into dependable autonomous engineering partners.
"""
            word_count = len(content.split())
            return {
                "title": f"{title}: The Next-Gen AI Coding Paradigm in 2026",
                "content": content,
                "tags": ["AI-Agent", "Tech-Blog", "2026", "Developer-Tools"],
                "word_count": word_count,
                "estimated_read_time": f"{max(1, word_count // 200)} min read",
                "language": "en",
                "tone": tone
            }

    @staticmethod
    async def generate_storyboard(

        content: str,
        skill_data: Optional[Dict[str, Any]] = None,
        target_duration: int = 60,
        aspect_ratio: str = "9:16",
        language: str = "vi"
    ) -> Dict[str, Any]:
        """
        Breaks down blog post or skill context into timed video scenes for TikTok/Shorts or YouTube.
        Handles Gemini quota failures & token exhaustion with zero-downtime curated storyboard fallback.
        """
        skill_name = skill_data.get("name", "AI Agent Skill") if skill_data else "AI Agent Skill"
        skill_title = skill_data.get("title", skill_name) if skill_data else skill_name
        skill_desc = skill_data.get("description", "") if skill_data else ""
        skill_lang = skill_data.get("primary_language", "TypeScript / Python") if skill_data else "TypeScript"

        # Determine target scene count based on duration

        if target_duration <= 35:
            target_scene_count = 6
        elif target_duration <= 75:
            target_scene_count = 8
        elif target_duration <= 130:
            target_scene_count = 12
        else:
            target_scene_count = 16
        target_words_per_scene = max(12, min(30, round(target_duration * 2.4 / target_scene_count)))

        # Auto-enrich context if user provided minimal text
        rich_content = content.strip()
        if len(rich_content) < 100 and skill_data:
            rich_content = f"""
            Chủ đề công nghệ: {skill_title}
            Tên thư viện/công cụ: {skill_name}
            Mô tả: {skill_desc}
            Ngôn ngữ lập trình: {skill_lang}
            Runtimes đã ghi nhận: {', '.join(skill_data.get('runtimes', []) or []) or 'Chưa cập nhật'}
            Chỉ sử dụng các facts có trong phần mô tả; không suy diễn benchmark hoặc khả năng chưa được cung cấp.
            """
        
        # Try Gemini API for high context storyboard
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                
                lang_note = (
                    "Toàn bộ voiceover_text phải là Tiếng Việt tự nhiên, rõ ràng, dồn dập, nhiều thông tin và con số thực tế như video review triệu view. "
                    "Không dùng từ rỗng như 'Chào mừng', 'Hãy cùng tìm hiểu' — thay bằng facts cụ thể, số liệu và câu lệnh thực tế."
                ) if language == "vi" else (
                    "All voiceover_text must be punchy, high-energy, information-dense English for viral tech shorts. "
                    "Skip filler phrases — use concrete facts, numbers and real code commands."
                )

                prompt = f"""
You are a senior motion video director producing a viral, high-energy developer video (TikTok, YouTube Shorts, Reels) about modern AI Agent tech.
Target Duration: {target_duration} seconds ({aspect_ratio} aspect ratio).
Required Scene Count: EXACTLY {target_scene_count} scenes.

Source Context:
{rich_content[:3500]}

STRICT DIRECTIVES:
{lang_note}
You MUST use these scene types across the {target_scene_count} scenes in logical narrative order:
1. "intro" - Source-backed hook title and concrete purpose in the first 6-8 seconds.
2. "github" - Real repository walkthrough when a GitHub URL exists in source context.
3. "comparison" - Pain point / old workflow vs source-backed use case.
4. "stat" - Only real numbers present in source context.
5. "architecture" - Source-backed workflow, never an invented system diagram.
6. "code" - README or source code excerpt; do not invent an API.
7. "terminal" - Real repository command and safe inspection logs.
8. "features" - Recorded capabilities or use cases.
9. "outro" - Concrete review action and source call to action.

Return ONLY a single valid JSON string with no markdown formatting:
{{
  "total_duration": {target_duration},
  "aspect_ratio": "{aspect_ratio}",
  "scenes": [
    {{
      "scene_number": 1,
      "scene_type": "intro",
      "title": "Hook Mở Đầu",
      "voiceover_text": "30-50 từ tiếng Việt dồn dập, nêu bật sự bùng nổ của {skill_title}...",
      "visual_description": "Logo chuyển động với tên skill, mục đích và badge SOURCE VERIFIED",
      "visual_prompt": "Hyperrealistic 3D glowing hologram of AI Agent {skill_title}, cyberpunk neon lighting, volumetric mist, 8k render",
      "duration_seconds": {max(6, target_duration // target_scene_count)},
      "visual_beats": [
        {{"at": 0.04, "anchor_text": "exact phrase from voiceover", "badge": "HOOK", "title": "Specific point", "detail": "Source-backed detail"}},
        {{"at": 0.38, "anchor_text": "exact phrase from voiceover", "badge": "DEMO", "title": "Practical detail", "detail": "A different source-backed fact"}},
        {{"at": 0.72, "anchor_text": "exact phrase from voiceover", "badge": "SOURCE", "title": "Verification source", "detail": "Repository or editor context"}}
      ],
      "code_snippet": null
    }}
  ]
}}

RULES:
- Total scenes in "scenes" array MUST be EXACTLY {target_scene_count}.
- scene_type MUST be one of: "intro", "github", "comparison", "stat", "architecture", "code", "terminal", "features", "security", "content", "outro".
- Each voiceover_text should be about {target_words_per_scene} words so narration matches the requested duration.
- Every scene must contain exactly 3 visual_beats at 0.04, 0.38, and 0.72 with different information. anchor_text must be an exact 3-5 word phrase copied from voiceover_text; do not repeat the same card or sentence.
- Never invent stars, forks, growth percentages, benchmarks, install commands, security claims or supported runtimes.
- If the source context does not contain a fact, omit it instead of guessing.
- Add "source_ref" to every scene using "source context" or "editor context".
- Include real fields for each scene type:
  * For "stat": include "stars_count", "forks_count", "contributors" numbers.
  * For "code": include "code_snippet" with 5-7 lines of realistic code.
  * For "terminal": include "terminal_command" and "terminal_output" array of 4 log lines.
  * For "features": include "feature_items" array of 4 objects with icon, title, and desc.
- visual_prompt must be detailed (25+ words) for AI image generation.
"""


                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )

                if response and response.text:
                    cleaned_json = response.text.strip()
                    cleaned_json = re.sub(r"^```json\s*", "", cleaned_json)
                    cleaned_json = re.sub(r"\s*```$", "", cleaned_json)
                    
                    token_info = _extract_token_usage_and_finish_reason(response)
                    
                    try:
                        parsed = json.loads(cleaned_json)
                    except json.JSONDecodeError as json_err:
                        _log_gemini_audit("gemini_token_truncated_json_fallback", {
                            "type": "storyboard",
                            "topic": skill_title,
                            "finish_reason": token_info["finish_reason"],
                            "token_usage": token_info["token_usage"],
                            "reason": f"JSON bị cắt ngắn do hết token ({json_err}). Tự động kích hoạt Storyboard chuẩn hóa."
                        })
                        fallback_sb = BlogVideoService._generate_curated_storyboard(skill_title, target_duration, aspect_ratio, language)
                        fallback_sb["provider"] = "curated_offline_engine"
                        fallback_sb["fallback_used"] = True
                        fallback_sb["is_truncated"] = True
                        fallback_sb["finish_reason"] = "MAX_TOKENS_JSON_TRUNCATED"
                        fallback_sb["token_usage"] = token_info["token_usage"]
                        return fallback_sb

                    _fallback_images = [
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
                    ]
                    for _i, _scene in enumerate(parsed.get("scenes", [])):
                        if not _scene.get("image_url"):
                            _scene["image_url"] = _fallback_images[_i % len(_fallback_images)]
                        if not _scene.get("visual_prompt"):
                            _scene["visual_prompt"] = _scene.get("visual_description", "")

                    # Keep editorial facts deterministic and source-backed. Gemini may
                    # contribute visual direction, but never narration, code, metrics,
                    # commands, or capability claims.
                    if skill_data and parsed.get("scenes"):
                        verified_storyboard = BlogVideoService._generate_curated_storyboard(
                            skill_title,
                            target_duration,
                            aspect_ratio,
                            language,
                            skill_data=skill_data,
                        )
                        generated_scenes = parsed["scenes"]
                        generated_visuals_by_type: Dict[str, List[Dict[str, Any]]] = {}
                        for generated_scene in generated_scenes:
                            generated_visuals_by_type.setdefault(
                                str(generated_scene.get("scene_type") or "content"), []
                            ).append(generated_scene)

                        source_backed_scenes = []
                        for index, verified_scene in enumerate(verified_storyboard["scenes"]):
                            scene_type = str(verified_scene.get("scene_type") or "content")
                            candidates = generated_visuals_by_type.get(scene_type) or []
                            generated_visual = candidates.pop(0) if candidates else (
                                generated_scenes[index] if index < len(generated_scenes) else {}
                            )
                            source_backed_scenes.append({
                                **verified_scene,
                                "image_url": generated_visual.get("image_url") or verified_scene.get("image_url"),
                                "visual_prompt": generated_visual.get("visual_prompt") or verified_scene.get("visual_prompt"),
                            })

                        generated_scenes = source_backed_scenes
                        parsed["scenes"] = generated_scenes
                        for index, scene in enumerate(generated_scenes):
                            scene["scene_number"] = index + 1
                        _fit_scene_durations(generated_scenes, target_duration)
                        parsed["total_duration"] = sum(
                            scene["duration_seconds"] for scene in generated_scenes
                        )
                    
                    narration = _cap_narration_to_target(
                        parsed.get("scenes") or [], target_duration, language
                    )
                    parsed["narration_word_count"] = narration["word_count"]
                    parsed["target_word_budget"] = narration["word_budget"]
                    parsed["provider"] = "google_gemini_2.5_flash"
                    parsed["fallback_used"] = False
                    parsed["finish_reason"] = token_info["finish_reason"]
                    parsed["is_truncated"] = token_info["is_truncated"]
                    parsed["token_usage"] = token_info["token_usage"]
                    _add_visual_beats(parsed.get("scenes") or [], language)
                    return parsed
            except Exception as e:
                err_info = _parse_gemini_error(e)
                action_name = "quota_exceeded" if err_info["is_quota"] else "gemini_api_error"
                _log_gemini_audit(action_name, {
                    "source": "gemini_ai",
                    "type": "storyboard_generation",
                    "reason": err_info["reason"],
                    "is_quota": err_info["is_quota"]
                })
                logger.warning(f"[GEMINI] Storyboard fallback triggered: {err_info['reason']}")

        # Curated Default Storyboard (8 high-impact scenes)
        fallback_sb = BlogVideoService._generate_curated_storyboard(
            skill_title,
            target_duration,
            aspect_ratio,
            language,
            skill_data=skill_data,
        )
        fallback_sb["provider"] = "curated_offline_engine"
        fallback_sb["fallback_used"] = True
        fallback_sb["finish_reason"] = "COMPLETE_OFFLINE"
        fallback_sb["is_truncated"] = False
        fallback_sb["token_usage"] = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        return fallback_sb

    @staticmethod
    def _generate_curated_storyboard(
        title: str,
        target_duration: int,
        aspect_ratio: str,
        language: str,
        skill_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Creates a local, source-backed storyboard without invented repository claims."""
        data = skill_data or {}
        repository_url = str(data.get("repository_url") or "")
        owner, repository_name = _repository_parts(repository_url, str(data.get("name") or title))
        description = _compact_text(data.get("description") or data.get("ai_summary") or title, 260)
        readme_excerpt = _compact_text(data.get("readme_preview"), 260)
        primary_language = str(data.get("primary_language") or "Unknown")
        runtimes = [str(value) for value in (data.get("runtimes") or []) if value]
        use_cases = [str(value) for value in (data.get("use_cases") or []) if value]
        tags = [str(value) for value in (data.get("tags") or []) if value]
        stars = int(data.get("stars") or 0)
        forks = int(data.get("forks") or 0)
        open_issues = int(data.get("open_issues") or 0)
        trending_score = float(data.get("trending_score") or 0)
        source_ref = repository_url or "skill database"
        code_sample = _first_code_block(str(data.get("readme_preview") or ""))
        clone_command = f"git clone {repository_url}" if repository_url else f"# Open {title} from Agent Skill Trending"

        metric_parts = []
        if stars:
            metric_parts.append(f"{stars:,} stars")
        if forks:
            metric_parts.append(f"{forks:,} forks")
        if open_issues:
            metric_parts.append(f"{open_issues:,} open issues")
        metrics_text = ", ".join(metric_parts)

        feature_sources = use_cases or runtimes or tags or [description]
        feature_items = []
        feature_icons = ["🧩", "⚡", "🔌", "🛠️"]
        for index, item in enumerate(feature_sources[:4]):
            feature_items.append({
                "icon": feature_icons[index],
                "title": _compact_text(item, 34),
                "desc": _compact_text(description, 72),
            })
        while len(feature_items) < 4:
            label = runtimes[len(feature_items) % len(runtimes)] if runtimes else primary_language
            feature_items.append({
                "icon": feature_icons[len(feature_items)],
                "title": _compact_text(label, 34),
                "desc": "Thông tin được tổng hợp từ hồ sơ skill" if language == "vi" else "Sourced from the skill profile",
            })

        if language == "vi":
            intro_metrics = f" Repository hiện ghi nhận {metrics_text}." if metrics_text else ""
            stat_voice = (
                f"Dữ liệu hiện tại của repository ghi nhận {metrics_text}. "
                f"Trending score trên hệ thống là {trending_score:.1f} điểm."
                if metrics_text
                else f"Skill này dùng {primary_language}; dữ liệu cộng đồng chưa đủ để đưa ra claim tăng trưởng, nên video chỉ trình bày thông tin đã xác minh."
            )
            scenes = [
                {
                    "scene_type": "intro",
                    "title": f"⚡ {title}",
                    "voiceover_text": f"{title} là một skill mới dành cho developer. {description}.{intro_metrics}",
                    "visual_description": "Hook chuyển động nhanh với tên skill, ngôn ngữ và dữ liệu repository đã xác minh.",
                    "visual_prompt": f"Vertical developer technology launch poster for {title}, premium dark interface, layered depth, cinematic light, safe center composition, no fake metrics",
                    "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
                    "duration_seconds": 7,
                    "source_ref": source_ref,
                    "asset_type": "motion_graphics",
                },
                {
                    "scene_type": "github",
                    "title": "🔎 Khám Phá Repository Thật",
                    "voiceover_text": f"Đây là repository {owner}/{repository_name}. Mình mở README, xem cấu trúc dự án và tập trung vào phần mô tả: {readme_excerpt or description}.",
                    "visual_description": "GitHub walkthrough với con trỏ di chuyển, click README, cuộn nội dung và highlight metrics thật.",
                    "duration_seconds": 9,
                    "source_ref": source_ref,
                    "asset_type": "github_walkthrough",
                    "repository_url": repository_url,
                    "repository_owner": owner,
                    "repository_name": repository_name,
                    "readme_excerpt": readme_excerpt or description,
                    "stars_count": stars,
                    "forks_count": forks,
                    "open_issues": open_issues,
                    "cursor_actions": [
                        {"at": 0.08, "x": 0.18, "y": 0.22, "type": "move"},
                        {"at": 0.28, "x": 0.30, "y": 0.42, "type": "click"},
                        {"at": 0.55, "x": 0.72, "y": 0.67, "type": "scroll"},
                        {"at": 0.78, "x": 0.57, "y": 0.33, "type": "highlight"},
                    ],
                },
                {
                    "scene_type": "comparison",
                    "title": "⚖️ Skill Này Giải Quyết Gì?",
                    "voiceover_text": f"Thay vì mô tả chung chung, hãy nhìn vào mục tiêu thực tế: {description}. Phần so sánh này chỉ dùng use case và giới hạn được lưu trong hồ sơ skill.",
                    "visual_description": "So sánh quy trình trước và sau bằng các bước cụ thể, không dùng benchmark bịa đặt.",
                    "visual_prompt": "Clean before and after developer workflow board, realistic steps, premium dark UI, no invented numbers, vertical safe layout",
                    "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
                    "duration_seconds": 7,
                    "source_ref": "skill database",
                    "before_text": _compact_text(data.get("comparison_notes") or "Quy trình thủ công, thiếu hướng dẫn theo skill", 90),
                    "after_text": _compact_text(use_cases[0] if use_cases else description, 90),
                },
                {
                    "scene_type": "stat",
                    "title": "📊 Dữ Liệu Đã Xác Minh",
                    "voiceover_text": stat_voice,
                    "visual_description": "Dashboard chỉ hiển thị stars, forks, issues và trending score có trong database.",
                    "visual_prompt": "Verified GitHub metrics dashboard, dark premium developer UI, clear counters, vertical video safe area, no speculative growth claims",
                    "image_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
                    "duration_seconds": 7,
                    "source_ref": "skill database",
                    "stars_count": stars,
                    "forks_count": forks,
                    "open_issues": open_issues,
                    "trending_score": trending_score,
                },
                {
                    "scene_type": "code",
                    "title": "💻 Đọc Code / README",
                    "voiceover_text": f"Phần demo lấy trực tiếp từ README hoặc lệnh truy cập repository. Ngôn ngữ chính được ghi nhận là {primary_language}; bạn có thể kiểm tra từng dòng trước khi sử dụng.",
                    "visual_description": "Code editor zoom theo từng dòng với syntax highlighting và caret gõ tự nhiên.",
                    "duration_seconds": 8,
                    "source_ref": source_ref,
                    "asset_type": "code_focus",
                    "code_snippet": code_sample or clone_command,
                },
                {
                    "scene_type": "terminal",
                    "title": "⌨️ Mở Skill Từ Terminal",
                    "voiceover_text": "Terminal chỉ trình diễn lệnh git clone của repository và các bước kiểm tra an toàn; video không tự chạy script lạ từ dự án.",
                    "visual_description": "Terminal gõ lệnh clone thật, sau đó hiển thị các bước inspect README và file tree.",
                    "duration_seconds": 7,
                    "source_ref": source_ref,
                    "asset_type": "terminal_transcript",
                    "terminal_command": clone_command,
                    "terminal_output": [
                        f"→ repository: {owner}/{repository_name}",
                        f"→ primary language: {primary_language}",
                        "→ inspect README and file tree before running code",
                        "✓ source metadata loaded",
                    ],
                },
                {
                    "scene_type": "features",
                    "title": "🧩 Use Case & Runtime",
                    "voiceover_text": f"Các điểm đáng chú ý được lấy từ hồ sơ skill: {', '.join(feature_sources[:4])}. Runtime được ghi nhận gồm {', '.join(runtimes) or 'chưa cập nhật'}.",
                    "visual_description": "Bốn thẻ nội dung xuất hiện theo nhịp giọng, dùng use case và runtime thật.",
                    "duration_seconds": 7,
                    "source_ref": "skill database",
                    "feature_items": feature_items,
                },
                {
                    "scene_type": "outro",
                    "title": "🎯 Xem Nguồn Trước Khi Cài",
                    "voiceover_text": f"Bạn có thể mở {owner}/{repository_name}, đọc README và kiểm tra code trước khi thêm {title} vào workflow của mình.",
                    "visual_description": "CTA mở repository và lưu skill, không dùng tuyên bố marketing chưa kiểm chứng.",
                    "visual_prompt": "Premium GitHub repository call to action, dark developer interface, subtle motion, vertical social video, trustworthy visual style",
                    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
                    "duration_seconds": 6,
                    "source_ref": source_ref,
                },
            ]
        else:
            intro_metrics = f" The repository currently records {metrics_text}." if metrics_text else ""
            stat_voice = (
                f"Verified repository data currently shows {metrics_text}, with a trending score of {trending_score:.1f}."
                if metrics_text
                else f"The recorded primary language is {primary_language}. Community metrics are not available, so this video avoids speculative growth claims."
            )
            scenes = [
                {"scene_type": "intro", "title": f"⚡ {title}", "voiceover_text": f"{title} is a newly tracked developer skill. {description}.{intro_metrics}", "visual_description": "Fast source-backed hook with verified repository metadata.", "duration_seconds": 7, "source_ref": source_ref, "asset_type": "motion_graphics"},
                {"scene_type": "github", "title": "🔎 Real Repository Walkthrough", "voiceover_text": f"This is {owner}/{repository_name}. We open the README, inspect the project structure, and focus on its recorded purpose: {readme_excerpt or description}.", "visual_description": "GitHub walkthrough with cursor movement, README navigation and verified metrics.", "duration_seconds": 9, "source_ref": source_ref, "asset_type": "github_walkthrough", "repository_url": repository_url, "repository_owner": owner, "repository_name": repository_name, "readme_excerpt": readme_excerpt or description, "stars_count": stars, "forks_count": forks, "open_issues": open_issues, "cursor_actions": [{"at": 0.08, "x": 0.18, "y": 0.22, "type": "move"}, {"at": 0.28, "x": 0.30, "y": 0.42, "type": "click"}, {"at": 0.58, "x": 0.72, "y": 0.67, "type": "scroll"}, {"at": 0.78, "x": 0.57, "y": 0.33, "type": "highlight"}]},
                {"scene_type": "comparison", "title": "⚖️ What Does It Solve?", "voiceover_text": f"Instead of generic promises, the practical goal is: {description}. This comparison uses only use cases and limitations stored in the skill profile.", "visual_description": "Source-backed before and after workflow without invented benchmarks.", "duration_seconds": 7, "source_ref": "skill database", "before_text": _compact_text(data.get("comparison_notes") or "Manual workflow without skill guidance", 90), "after_text": _compact_text(use_cases[0] if use_cases else description, 90)},
                {"scene_type": "stat", "title": "📊 Verified Data", "voiceover_text": stat_voice, "visual_description": "Dashboard of database-backed repository metrics.", "duration_seconds": 7, "source_ref": "skill database", "stars_count": stars, "forks_count": forks, "open_issues": open_issues, "trending_score": trending_score},
                {"scene_type": "code", "title": "💻 README / Code Focus", "voiceover_text": f"The demo uses a README sample or the repository clone command. The recorded primary language is {primary_language}, and every line remains visible for review.", "visual_description": "Code editor zoom with source-backed content.", "duration_seconds": 8, "source_ref": source_ref, "asset_type": "code_focus", "code_snippet": code_sample or clone_command},
                {"scene_type": "terminal", "title": "⌨️ Open It Safely", "voiceover_text": "The terminal demonstrates the real repository clone command and safe inspection steps without automatically executing untrusted project scripts.", "visual_description": "Terminal types the real clone command and inspection checklist.", "duration_seconds": 7, "source_ref": source_ref, "asset_type": "terminal_transcript", "terminal_command": clone_command, "terminal_output": [f"→ repository: {owner}/{repository_name}", f"→ primary language: {primary_language}", "→ inspect README and file tree before running code", "✓ source metadata loaded"]},
                {"scene_type": "features", "title": "🧩 Use Cases & Runtimes", "voiceover_text": f"Recorded highlights include {', '.join(feature_sources[:4])}. Supported runtimes listed in the profile are {', '.join(runtimes) or 'not yet recorded'}.", "visual_description": "Four cards populated from real use-case and runtime fields.", "duration_seconds": 7, "source_ref": "skill database", "feature_items": feature_items},
                {"scene_type": "outro", "title": "🎯 Review The Source", "voiceover_text": f"Open {owner}/{repository_name}, read the README, and review the code before adding {title} to your workflow.", "visual_description": "Repository CTA without unverified marketing claims.", "duration_seconds": 6, "source_ref": source_ref},
            ]

        if target_duration > 75:
            scenes[-1:-1] = [
                {
                    "scene_type": "architecture",
                    "title": "🧠 Luồng Hoạt Động" if language == "vi" else "🧠 How It Works",
                    "voiceover_text": (
                        f"Luồng sử dụng đi từ đầu vào, qua skill và runtime {', '.join(runtimes) or 'chưa được ghi nhận'}, rồi trả kết quả về workflow của developer."
                        if language == "vi"
                        else f"The flow moves from input through the skill and {', '.join(runtimes) or 'an unrecorded runtime'}, then returns a result to the developer workflow."
                    ),
                    "visual_description": "Source-backed architecture flow with one directional pass.",
                    "duration_seconds": 8,
                    "source_ref": "skill database",
                },
                {
                    "scene_type": "features",
                    "title": "🧭 Use Case Cụ Thể" if language == "vi" else "🧭 Concrete Use Cases",
                    "voiceover_text": (
                        f"Các tình huống được hồ sơ ghi nhận gồm {', '.join(use_cases[:4]) or description}. Mỗi use case được tách thành một phần riêng."
                        if language == "vi"
                        else f"Recorded use cases include {', '.join(use_cases[:4]) or description}. Each use case gets a separate section."
                    ),
                    "visual_description": "Use-case cards driven by recorded profile fields.",
                    "duration_seconds": 8,
                    "source_ref": "skill database",
                    "feature_items": feature_items,
                },
                {
                    "scene_type": "security",
                    "title": "🛡️ Kiểm Tra Trước Khi Chạy" if language == "vi" else "🛡️ Review Before Running",
                    "voiceover_text": (
                        f"Security rating hiện được ghi nhận là {data.get('security_rating') or 'unknown'}. Hãy đọc README, dependency và quyền truy cập trước khi chạy skill."
                        if language == "vi"
                        else f"The recorded security rating is {data.get('security_rating') or 'unknown'}. Review the README, dependencies, and permissions before running the skill."
                    ),
                    "visual_description": "Security review checklist without fabricated guarantees.",
                    "duration_seconds": 8,
                    "source_ref": "skill database",
                    "feature_items": [
                        {"icon": "📖", "title": "README", "desc": "Review documented behavior"},
                        {"icon": "📦", "title": "Dependencies", "desc": "Inspect packages before install"},
                        {"icon": "🔐", "title": "Permissions", "desc": "Limit filesystem and network access"},
                        {"icon": "🧪", "title": "Sandbox", "desc": "Test outside production first"},
                    ],
                },
                {
                    "scene_type": "comparison",
                    "title": "🚧 Giới Hạn Cần Biết" if language == "vi" else "🚧 Limits To Know",
                    "voiceover_text": (
                        f"Video không suy diễn khả năng ngoài nguồn. Ghi chú hiện có là: {_compact_text(data.get('comparison_notes') or 'chưa có benchmark độc lập', 180)}."
                        if language == "vi"
                        else f"The video does not infer capabilities beyond the source. The current note is: {_compact_text(data.get('comparison_notes') or 'no independent benchmark is recorded', 180)}."
                    ),
                    "visual_description": "Known-versus-unknown comparison with explicit limits.",
                    "duration_seconds": 8,
                    "source_ref": "skill database",
                    "before_text": "Nguồn đã xác minh" if language == "vi" else "Verified source",
                    "after_text": "Bỏ claim chưa có dữ liệu" if language == "vi" else "Unknown claims omitted",
                },
            ]

        if target_duration > 130:
            scenes[-1:-1] = [
                {
                    "scene_type": "code",
                    "title": "🔬 Đọc Kỹ File Chính" if language == "vi" else "🔬 Inspect The Main File",
                    "voiceover_text": (
                        f"Phần deep dive giữ nguyên nội dung nguồn để xem cấu trúc chính bằng {primary_language}. Không có đoạn code minh họa bịa thêm."
                        if language == "vi"
                        else f"The deep dive keeps source content intact to inspect the main {primary_language} structure. No illustrative code is invented."
                    ),
                    "visual_description": "Second code focus using source material.",
                    "duration_seconds": 8,
                    "source_ref": source_ref,
                    "code_snippet": code_sample or clone_command,
                },
                {
                    "scene_type": "terminal",
                    "title": "🧪 Checklist Sandbox" if language == "vi" else "🧪 Sandbox Checklist",
                    "voiceover_text": (
                        "Clone vào thư mục tạm, đọc dependency, kiểm tra quyền mạng, rồi mới thử một tác vụ nhỏ."
                        if language == "vi"
                        else "Clone into a temporary directory, inspect dependencies, review network access, then try one small task."
                    ),
                    "visual_description": "Terminal safety checklist distinct from installation.",
                    "duration_seconds": 8,
                    "source_ref": source_ref,
                    "terminal_command": clone_command,
                    "terminal_output": ["→ create isolated workspace", "→ inspect dependencies", "→ restrict network and files", "✓ run one small test"],
                },
                {
                    "scene_type": "stat",
                    "title": "📈 Đọc Số Liệu Đúng Cách" if language == "vi" else "📈 Read Metrics Carefully",
                    "voiceover_text": (
                        "Stars và forks phản ánh sự quan tâm, không tự động chứng minh chất lượng hay hiệu năng."
                        if language == "vi"
                        else "Stars and forks reflect community interest; they do not automatically prove quality or performance."
                    ),
                    "visual_description": "Metrics interpretation without a repeating growth animation.",
                    "duration_seconds": 8,
                    "source_ref": "skill database",
                    "stars_count": stars,
                    "forks_count": forks,
                    "open_issues": open_issues,
                    "trending_score": trending_score,
                },
                {
                    "scene_type": "content",
                    "title": "✅ Quyết Định Có Nên Dùng" if language == "vi" else "✅ Decide Whether To Use It",
                    "voiceover_text": (
                        f"Đối chiếu use case của bạn với {', '.join(use_cases[:3]) or description}, runtime hỗ trợ và mức quyền cần cấp trước khi cài."
                        if language == "vi"
                        else f"Compare your use case with {', '.join(use_cases[:3]) or description}, supported runtimes, and required permissions before installing."
                    ),
                    "visual_description": "Decision checklist with one progressive reveal.",
                    "duration_seconds": 8,
                    "source_ref": "skill database",
                },
            ]

        if target_duration <= 35:
            keep_types = {"intro", "github", "comparison", "code", "terminal", "outro"}
            scenes = [scene for scene in scenes if scene["scene_type"] in keep_types]

        for index, scene in enumerate(scenes):
            scene["scene_number"] = index + 1
            scene.setdefault("code_snippet", None)
        narration = _cap_narration_to_target(scenes, target_duration, language)
        _fit_scene_durations(scenes, target_duration)
        _add_visual_beats(scenes, language)
        return {
            "total_duration": sum(scene["duration_seconds"] for scene in scenes),
            "aspect_ratio": aspect_ratio,
            "scenes": scenes,
            "narration_word_count": narration["word_count"],
            "target_word_budget": narration["word_budget"],
        }

    @staticmethod
    async def generate_scene_image(
        prompt: str,
        scene_number: int = 1,
        aspect_ratio: str = "9:16",
    ) -> Dict[str, Any]:
        """
        Generates high-res visual artwork for video scenes.
        Tries Gemini Imagen 3 if GEMINI_API_KEY is configured.
        Falls back to curated Unsplash images if unavailable or on quota limit.
        """
        fallback_images = [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80"
        ]

        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types as genai_types
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                response = client.models.generate_images(
                    model="imagen-3.0-generate-002",
                    prompt=prompt,
                    config=genai_types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio=aspect_ratio if aspect_ratio in {"9:16", "16:9"} else "9:16",
                        safety_filter_level="block_low_and_above",
                    ),
                )
                if response.generated_images:
                    img_bytes = response.generated_images[0].image.image_bytes
                    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
                    image_url = f"data:image/png;base64,{img_b64}"
                    return {
                        "scene_number": scene_number,
                        "image_url": image_url,
                        "prompt": prompt,
                        "status": "success",
                        "provider": "google_imagen_3",
                        "fallback_used": False
                    }
            except Exception as e:
                err_info = _parse_gemini_error(e)
                action_name = "quota_exceeded" if err_info["is_quota"] else "gemini_api_error"
                _log_gemini_audit(action_name, {
                    "source": "gemini_imagen_3",
                    "type": "image_generation",
                    "reason": err_info["reason"],
                    "is_quota": err_info["is_quota"]
                })
                logger.warning(f"[IMAGEN] Image generation fallback triggered: {err_info['reason']}")

        idx = max(0, min(scene_number - 1, len(fallback_images) - 1))
        return {
            "scene_number": scene_number,
            "image_url": fallback_images[idx],
            "prompt": prompt,
            "status": "success",
            "provider": "unsplash_curated",
            "fallback_used": True
        }
