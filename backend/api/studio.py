from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

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

class TTSRequest(BaseModel):
    text: str
    voice: str = "vi-VN-HoaiMyNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    provider: Optional[str] = "edge_tts"

class SubtitleEntryItem(BaseModel):
    text: str
    start_ms: int
    end_ms: int

class TTSResponse(BaseModel):
    audio_base64: str
    duration_seconds: float
    subtitle_entries: List[SubtitleEntryItem]
    voice: str
    status: str
    message: Optional[str] = None

class SceneImageRequest(BaseModel):
    prompt: str
    scene_number: int = 1

class SceneImageResponse(BaseModel):
    scene_number: int
    image_url: str
    prompt: str
    status: str
    provider: str

@router.get("/tts/voices")
def get_voices():
    """Returns curated list of high-quality AI voices."""
    return TTSService.get_available_voices()

@router.post("/tts/synthesize", response_model=TTSResponse)
async def synthesize_tts(payload: TTSRequest):
    """Synthesizes text into high-quality AI voice audio with word-level subtitles."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    result = await TTSService.synthesize(
        text=payload.text,
        voice=payload.voice,
        rate=payload.rate,
        pitch=payload.pitch,
        provider=payload.provider or "edge_tts"
    )
    return result

@router.post("/scene/image", response_model=SceneImageResponse)
async def generate_scene_image(payload: SceneImageRequest):
    """Generates or resolves high-res visual artwork for video scenes using Imagen 3 / Gemini."""
    result = await BlogVideoService.generate_scene_image(
        prompt=payload.prompt,
        scene_number=payload.scene_number
    )
    return result

@router.post("/blog/generate", response_model=BlogGenerateResponse)
async def generate_blog_post(payload: BlogGenerateRequest, db: Session = Depends(get_db)):
    """Generates an SEO-optimized tech blog article from a skill or topic."""
    skill_data = None
    if payload.skill_id:
        skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
        if skill:
            skill_data = {
                "name": skill.name,
                "title": skill.title or skill.name,
                "description": skill.description or skill.ai_summary,
                "primary_language": skill.primary_language,
                "runtimes": skill.runtimes or ["Antigravity", "Cursor"],
                "stars": skill.stars,
                "trending_score": skill.trending_score
            }
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
            skill_data = {
                "name": skill.name,
                "title": skill.title or skill.name,
                "description": skill.description or skill.ai_summary,
                "primary_language": skill.primary_language,
                "runtimes": skill.runtimes or ["Antigravity", "Cursor"]
            }

    result = await BlogVideoService.generate_storyboard(
        content=payload.content or "",
        skill_data=skill_data,
        target_duration=payload.target_duration,
        aspect_ratio=payload.aspect_ratio,
        language=payload.language
    )
    return result
