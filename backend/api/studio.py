import asyncio
import base64
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

from database import get_db
from models.skill import Skill
from services.tts_service import TTSService
from services.blog_video_service import BlogVideoService

router = APIRouter(prefix="/studio", tags=["Studio"])

# Pydantic Schemas
class BlogGenerateRequest(BaseModel):
    skill_id: Optional[int] = None
    topic: Optional[str] = "Google Antigravity & AI Agent Skills 2026"
    tone: str = "professional"  # professional, hype, casual, deep_dive
    language: str = "vi"        # vi, en
    custom_notes: Optional[str] = None

class BlogGenerateResponse(BaseModel):
    title: str
    content: str
    tags: List[str]
    word_count: int
    estimated_read_time: str
    language: str
    tone: str

class VideoSceneItem(BaseModel):
    scene_number: int
    title: str
    voiceover_text: str
    visual_description: str
    visual_prompt: Optional[str] = None
    image_url: Optional[str] = None
    duration_seconds: int
    code_snippet: Optional[str] = None
    scene_type: Optional[Literal[
        "intro", "github", "pain", "architecture", "stat", "code",
        "terminal", "comparison", "features", "security", "content", "outro"
    ]] = None
    source_ref: Optional[str] = None
    asset_type: Optional[str] = None
    repository_url: Optional[str] = None
    repository_name: Optional[str] = None
    repository_owner: Optional[str] = None
    readme_excerpt: Optional[str] = None
    stars_count: Optional[int] = None
    forks_count: Optional[int] = None
    contributors: Optional[int] = None
    open_issues: Optional[int] = None
    trending_score: Optional[float] = None
    terminal_command: Optional[str] = None
    terminal_output: Optional[List[str]] = None
    before_text: Optional[str] = None
    after_text: Optional[str] = None
    feature_items: Optional[List[Dict[str, str]]] = None
    cursor_actions: Optional[List[Dict[str, Any]]] = None
    github_capture_frames: Optional[List[str]] = None
    github_capture_video: Optional[str] = None
    github_capture_duration_seconds: Optional[float] = None
    github_capture_fps: Optional[int] = None
    github_capture_source_revision: Optional[str] = None
    github_capture_captured_at: Optional[str] = None
    github_capture_viewport: Optional[Dict[str, int]] = None
    capture_status: Optional[Literal["captured", "unavailable"]] = None
    visual_beats: Optional[List[Dict[str, Any]]] = None

class StoryboardGenerateRequest(BaseModel):
    skill_id: Optional[int] = None
    content: Optional[str] = ""
    target_duration: int = 60  # seconds (30, 60, 90, 180)
    aspect_ratio: str = "9:16"  # 9:16 (Shorts/TikTok) or 16:9 (YouTube)
    language: str = "vi"

class StoryboardGenerateResponse(BaseModel):
    total_duration: int
    aspect_ratio: str
    scenes: List[VideoSceneItem]
    provider: Optional[str] = None
    fallback_used: Optional[bool] = None
    finish_reason: Optional[str] = None
    is_truncated: Optional[bool] = None
    token_usage: Optional[Dict[str, int]] = None
    narration_word_count: Optional[int] = None
    target_word_budget: Optional[int] = None

class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    scene_texts: Optional[List[str]] = None
    voice: str = "vi-VN-HoaiMyNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    provider: Optional[str] = "edge_tts"

class SubtitleEntryItem(BaseModel):
    text: str
    start_ms: int
    end_ms: int


class SceneSegmentItem(BaseModel):
    scene_index: int
    start_ms: int
    end_ms: int
    subtitle_start_index: int
    subtitle_end_index: int

class TTSResponse(BaseModel):
    audio_base64: str
    duration_seconds: float
    subtitle_entries: List[SubtitleEntryItem]
    voice: str
    status: str
    message: Optional[str] = None
    scene_segments: Optional[List[SceneSegmentItem]] = None
    timing_quality: Optional[Literal["word", "estimated"]] = None
    timeline_version: int = 2
    audio_duration_ms: Optional[int] = None
    caption_lead_ms: int = 90
    sync_diagnostics: Optional[Dict[str, Any]] = None
    narration_revision: Optional[str] = None
    rate: str = "+0%"
    pitch: str = "+0Hz"
    requested_provider: Optional[str] = None
    actual_provider: Optional[str] = None


class VideoRenderRequest(BaseModel):
    storyboard: StoryboardGenerateResponse
    tts_result: TTSResponse
    skill_title: str = "AI Agent Skill"
    skill_stats: Dict[str, Any] = Field(default_factory=dict)
    show_captions: bool = True

class SceneImageRequest(BaseModel):
    prompt: str
    scene_number: int = 1
    aspect_ratio: Literal["9:16", "16:9"] = "9:16"

class SceneImageResponse(BaseModel):
    scene_number: int
    image_url: str
    prompt: str
    status: str
    provider: str


class GitHubCaptureRequest(BaseModel):
    repository_url: str
    aspect_ratio: Literal["9:16", "16:9"] = "9:16"
    duration_seconds: float = Field(default=8.0, ge=4.0, le=20.0)


def _skill_to_content_data(skill: Skill) -> Dict[str, Any]:
    """Builds a source-backed dossier for blog, storyboard, and visual generation."""
    return {
        "name": skill.name,
        "title": skill.title or skill.name,
        "description": skill.description or skill.ai_summary or "",
        "ai_summary": skill.ai_summary or "",
        "primary_language": skill.primary_language or "Unknown",
        "runtimes": skill.runtimes or [],
        "repository_url": skill.repository_url,
        "author": skill.author or "",
        "readme_preview": skill.readme_preview or "",
        "use_cases": skill.use_cases or [],
        "comparison_notes": skill.comparison_notes or "",
        "target_audience": skill.target_audience or "",
        "demo_url": skill.demo_url or "",
        "tags": skill.tags or [],
        "difficulty": skill.difficulty or "intermediate",
        "stars": skill.stars or 0,
        "forks": skill.forks or 0,
        "open_issues": skill.open_issues or 0,
        "star_velocity_7d": skill.star_velocity_7d or 0,
        "quality_score": skill.quality_score or 0,
        "trending_score": skill.trending_score or 0,
        "security_rating": skill.security_rating or "unknown",
        "security_score": skill.security_score or 0,
    }


def _validated_github_repository_url(raw_url: Optional[str]) -> Optional[str]:
    if not raw_url:
        return None
    parsed = urlparse(raw_url.strip())
    path_parts = [part for part in parsed.path.split("/") if part]
    if parsed.scheme != "https" or parsed.hostname != "github.com" or len(path_parts) < 2:
        return None
    return f"https://github.com/{path_parts[0]}/{path_parts[1]}"


async def _capture_github_repository(
    repository_url: Optional[str],
    aspect_ratio: str = "9:16",
    duration_seconds: float = 8.0,
) -> Optional[Dict[str, Any]]:
    """Capture a public GitHub repository locally with a fixed, allowlisted URL shape."""
    safe_url = _validated_github_repository_url(repository_url)
    if not safe_url:
        return None

    frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
    capture_script = frontend_dir / "scripts" / "capture-github.mjs"
    if not capture_script.exists():
        return None

    capture_dir = Path(tempfile.mkdtemp(prefix="agent-skill-github-"))

    def _run_capture() -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                "node",
                str(capture_script),
                "--url",
                safe_url,
                "--output-dir",
                str(capture_dir),
                "--aspect-ratio",
                aspect_ratio,
                "--duration-seconds",
                str(max(4.0, min(20.0, duration_seconds))),
            ],
            cwd=frontend_dir,
            check=True,
            capture_output=True,
            text=True,
            timeout=75,
        )

    try:
        completed = await asyncio.to_thread(_run_capture)
        stdout_lines = [line for line in completed.stdout.splitlines() if line.strip()]
        if not stdout_lines:
            return None
        manifest = json.loads(stdout_lines[-1])
        encoded_frames: List[str] = []
        for frame_path in manifest.get("frames", []):
            resolved_frame = Path(frame_path).resolve()
            if capture_dir.resolve() not in resolved_frame.parents or not resolved_frame.is_file():
                continue
            encoded = base64.b64encode(resolved_frame.read_bytes()).decode("ascii")
            encoded_frames.append(f"data:image/png;base64,{encoded}")
        if not encoded_frames:
            return None
        capture: Dict[str, Any] = {
            "github_capture_frames": encoded_frames,
            "image_url": encoded_frames[0],
            "cursor_actions": manifest.get("cursor_actions") or [],
            "github_capture_viewport": manifest.get("viewport") or {},
            "capture_status": "captured",
            "github_capture_source_revision": manifest.get("source_revision"),
            "github_capture_captured_at": manifest.get("captured_at"),
        }
        video_path = manifest.get("video")
        if video_path:
            resolved_video = Path(video_path).resolve()
            if capture_dir.resolve() in resolved_video.parents and resolved_video.is_file():
                encoded_video = base64.b64encode(resolved_video.read_bytes()).decode("ascii")
                capture.update({
                    "github_capture_video": f"data:video/mp4;base64,{encoded_video}",
                    "github_capture_duration_seconds": float(manifest.get("duration_seconds") or duration_seconds),
                    "github_capture_fps": int(manifest.get("fps") or 12),
                })
        return capture
    except (subprocess.SubprocessError, OSError, ValueError, json.JSONDecodeError):
        return None
    finally:
        shutil.rmtree(capture_dir, ignore_errors=True)


async def _attach_github_captures(storyboard: Dict[str, Any]) -> Dict[str, Any]:
    scenes = storyboard.get("scenes") or []
    capture_by_url: Dict[str, Optional[Dict[str, Any]]] = {}
    for scene in scenes:
        if scene.get("scene_type") != "github" and scene.get("asset_type") != "github_walkthrough":
            continue
        if scene.get("github_capture_video") or scene.get("github_capture_frames"):
            continue
        repository_url = _validated_github_repository_url(scene.get("repository_url"))
        capture_key = f"{repository_url or ''}|{storyboard.get('aspect_ratio') or '9:16'}|{scene.get('duration_seconds') or 8}"
        if capture_key not in capture_by_url:
            capture_by_url[capture_key] = await _capture_github_repository(
                repository_url,
                storyboard.get("aspect_ratio") or "9:16",
                float(scene.get("duration_seconds") or 8),
            )
        capture = capture_by_url.get(capture_key)
        if capture:
            scene.update(capture)
        else:
            scene["capture_status"] = "unavailable"
    return storyboard

@router.get("/tts/voices")
def get_voices():
    """Returns curated list of high-quality AI voices."""
    return TTSService.get_available_voices()

@router.post("/tts/synthesize", response_model=TTSResponse)
async def synthesize_tts(payload: TTSRequest):
    """Synthesizes text into high-quality AI voice audio with word-level subtitles."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        result = await TTSService.synthesize(
            text=payload.text,
            voice=payload.voice,
            rate=payload.rate,
            pitch=payload.pitch,
            provider=payload.provider or "edge_tts",
            scene_texts=payload.scene_texts,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return result

@router.post("/scene/image", response_model=SceneImageResponse)
async def generate_scene_image(payload: SceneImageRequest):
    """Generates or resolves high-res visual artwork for video scenes using Imagen 3 / Gemini."""
    result = await BlogVideoService.generate_scene_image(
        prompt=payload.prompt,
        scene_number=payload.scene_number,
        aspect_ratio=payload.aspect_ratio,
    )
    return result


@router.post("/github/capture")
async def capture_github_repository(payload: GitHubCaptureRequest):
    capture = await _capture_github_repository(
        payload.repository_url,
        payload.aspect_ratio,
        payload.duration_seconds,
    )
    if not capture:
        raise HTTPException(status_code=422, detail="Repository is unavailable or could not be captured")
    return capture

@router.post("/blog/generate", response_model=BlogGenerateResponse)
async def generate_blog_post(payload: BlogGenerateRequest, db: Session = Depends(get_db)):
    """Generates an SEO-optimized tech blog article from a skill or topic."""
    skill_data = None
    if payload.skill_id:
        skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
        if skill:
            skill_data = _skill_to_content_data(skill)
            if not payload.topic or payload.topic == "Google Antigravity & AI Agent Skills 2026":
                payload.topic = skill.title or skill.name

    result = await BlogVideoService.generate_blog(
        topic=payload.topic or "Google Antigravity & AI Agent Skills",
        skill_data=skill_data,
        tone=payload.tone,
        language=payload.language,
        custom_notes=payload.custom_notes
    )
    return result

@router.post("/storyboard/generate", response_model=StoryboardGenerateResponse)
async def generate_video_storyboard(payload: StoryboardGenerateRequest, db: Session = Depends(get_db)):
    """Generates video storyboard scenes with timed voiceover and visuals."""
    skill_data = None
    if payload.skill_id:
        skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
        if skill:
            skill_data = _skill_to_content_data(skill)

    result = await BlogVideoService.generate_storyboard(
        content=payload.content or "",
        skill_data=skill_data,
        target_duration=payload.target_duration,
        aspect_ratio=payload.aspect_ratio,
        language=payload.language
    )
    return result


@router.post("/video/render")
async def render_video(payload: VideoRenderRequest):
    """Renders the same Remotion composition used by the Player to an MP4 file."""
    if not payload.tts_result.audio_base64:
        raise HTTPException(status_code=400, detail="Audio is required before rendering video")

    frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
    render_script = frontend_dir / "scripts" / "render-skill-video.mjs"
    if not render_script.exists():
        raise HTTPException(status_code=503, detail="Remotion render script is not installed")

    render_dir = Path(tempfile.mkdtemp(prefix="agent-skill-video-"))
    props_path = render_dir / "props.json"
    output_path = render_dir / "skill-video.mp4"
    storyboard_payload = payload.storyboard.model_dump()
    scene_texts = [str(scene.get("voiceover_text") or "") for scene in storyboard_payload.get("scenes") or []]
    expected_revision = TTSService.narration_revision(
        scene_texts,
        payload.tts_result.voice,
        payload.tts_result.rate,
        payload.tts_result.pitch,
    )
    if not payload.tts_result.narration_revision:
        shutil.rmtree(render_dir, ignore_errors=True)
        raise HTTPException(
            status_code=409,
            detail="Narration audio is missing its script revision. Synthesize the voice again before export.",
        )
    if payload.tts_result.narration_revision != expected_revision:
        shutil.rmtree(render_dir, ignore_errors=True)
        raise HTTPException(
            status_code=409,
            detail="Storyboard or voice settings changed after synthesis. Regenerate narration before export.",
        )
    storyboard_payload = await _attach_github_captures(storyboard_payload)
    # Never trust stale browser timings during export. Probe the submitted audio
    # again and rebuild every scene boundary before Remotion receives the props.
    tts_payload = TTSService._finalize_timing(payload.tts_result.model_dump(), scene_texts)
    props = {
        "storyboard": storyboard_payload,
        "ttsResult": tts_payload,
        "audioSrc": f"data:audio/mpeg;base64,{payload.tts_result.audio_base64}",
        "skillTitle": payload.skill_title,
        "skillStats": payload.skill_stats,
        "showCaptions": payload.show_captions,
    }
    props_path.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")

    def _run_renderer() -> None:
        subprocess.run(
            [
                "node",
                str(render_script),
                "--props",
                str(props_path),
                "--output",
                str(output_path),
            ],
            cwd=frontend_dir,
            check=True,
            capture_output=True,
            text=True,
            timeout=1200,
        )

    try:
        await asyncio.to_thread(_run_renderer)
    except FileNotFoundError as exc:
        shutil.rmtree(render_dir, ignore_errors=True)
        raise HTTPException(status_code=503, detail="Node.js is required for MP4 rendering") from exc
    except subprocess.TimeoutExpired as exc:
        shutil.rmtree(render_dir, ignore_errors=True)
        raise HTTPException(status_code=504, detail="Video rendering exceeded 20 minutes") from exc
    except subprocess.CalledProcessError as exc:
        shutil.rmtree(render_dir, ignore_errors=True)
        detail = (exc.stderr or exc.stdout or "Remotion renderer failed")[-1200:]
        raise HTTPException(status_code=500, detail=detail) from exc

    if not output_path.exists() or output_path.stat().st_size < 1024:
        shutil.rmtree(render_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Renderer did not produce a valid MP4 file")

    return FileResponse(
        output_path,
        media_type="video/mp4",
        filename="agent-skill-video.mp4",
        headers={
            "X-Studio-Timeline": str(tts_payload.get("timeline_version") or 2),
            "X-Studio-Duration-Ms": str(tts_payload.get("audio_duration_ms") or 0),
            "X-Studio-Caption-Source": str((tts_payload.get("sync_diagnostics") or {}).get("source") or "unknown"),
        },
        background=BackgroundTask(shutil.rmtree, render_dir, ignore_errors=True),
    )
