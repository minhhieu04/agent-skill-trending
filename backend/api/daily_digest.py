import logging
import base64
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.skill import Skill
from services.daily_digest_service import DailyDigestService
from services.tts_service import TTSService

logger = logging.getLogger("DailyDigestRouter")

router = APIRouter(prefix="/daily-digest", tags=["Daily AI Podcast & Feed"])


class AudioSynthesizeRequest(BaseModel):
    voice: Optional[str] = "vi-VN-NamMinhNeural"
    rate: Optional[str] = "+5%"
    force_regenerate: Optional[bool] = False


class RegenerateRequest(BaseModel):
    language: Optional[str] = "vi"


@router.get("/voices")
def get_podcast_voices():
    """
    Returns all curated AI voices supported across Edge-TTS, Gemini 2.0 Live Native Audio, and Google WaveNet.
    """
    return {"voices": TTSService.get_available_voices()}


@router.get("/dates")
def get_available_dates(db: Session = Depends(get_db)):
    """
    Returns list of dates that have skills or existing daily digests.
    """
    try:
        dates = DailyDigestService.get_available_dates(db)
        return {"dates": dates}
    except Exception as e:
        logger.error(f"Error fetching digest dates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _normalize_highlights(raw_hl) -> list:
    if not raw_hl:
        return []
    if isinstance(raw_hl, list):
        return [str(h) for h in raw_hl if h]
    if isinstance(raw_hl, str):
        try:
            parsed = json.loads(raw_hl)
            if isinstance(parsed, list):
                return [str(h) for h in parsed if h]
        except Exception:
            pass
        lines = [line.strip().lstrip("-*•0123456789. ") for line in raw_hl.split("\n") if line.strip()]
        return lines if lines else [raw_hl.strip()]
    return [str(raw_hl)]


@router.get("/{date_str}")
async def get_daily_digest(
    date_str: str,
    auto_generate: bool = Query(True, description="Automatically generate if not existing"),
    db: Session = Depends(get_db)
):
    """
    Gets the podcast digest and practical skill summaries for a specific date (YYYY-MM-DD).
    """
    try:
        digest = await DailyDigestService.generate_digest(
            db=db,
            date_str=date_str,
            force_regenerate=False
        )
        has_real_audio = bool(digest.podcast_audio_base64 and len(digest.podcast_audio_base64) > 1000)
        return {
            "id": digest.id,
            "digest_date": digest.digest_date,
            "title": digest.title,
            "summary_markdown": digest.summary_markdown,
            "podcast_script": digest.podcast_script,
            "highlights": _normalize_highlights(digest.highlights),
            "skill_summaries": digest.skill_summaries or [],
            "total_skills_count": digest.total_skills_count,
            "has_audio": has_real_audio,
            "audio_base64": digest.podcast_audio_base64 if has_real_audio else None,
            "podcast_duration_sec": digest.podcast_duration_sec or 0.0,
            "podcast_voice": digest.podcast_voice,
            "source_model": digest.source_model,
            "updated_at": digest.updated_at.isoformat() if digest.updated_at else None
        }
    except Exception as e:
        logger.error(f"Error getting daily digest for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{date_str}/generate")
async def regenerate_daily_digest(
    date_str: str,
    payload: RegenerateRequest = RegenerateRequest(),
    db: Session = Depends(get_db)
):
    """
    Forces AI to re-analyze skills and re-generate the podcast script & practical summary.
    """
    try:
        digest = await DailyDigestService.generate_digest(
            db=db,
            date_str=date_str,
            language=payload.language or "vi",
            force_regenerate=True
        )
        return {
            "id": digest.id,
            "digest_date": digest.digest_date,
            "title": digest.title,
            "summary_markdown": digest.summary_markdown,
            "podcast_script": digest.podcast_script,
            "highlights": _normalize_highlights(digest.highlights),
            "skill_summaries": digest.skill_summaries or [],
            "total_skills_count": digest.total_skills_count,
            "has_audio": bool(digest.podcast_audio_base64),
            "podcast_duration_sec": digest.podcast_duration_sec or 0.0,
            "podcast_voice": digest.podcast_voice,
            "source_model": digest.source_model,
            "updated_at": digest.updated_at.isoformat() if digest.updated_at else None
        }
    except Exception as e:
        logger.error(f"Error regenerating daily digest for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{date_str}/audio")
async def synthesize_audio(
    date_str: str,
    payload: AudioSynthesizeRequest = AudioSynthesizeRequest(),
    db: Session = Depends(get_db)
):
    """
    Generates TTS audio for the daily podcast episode using EdgeTTS / Gemini.
    Returns audio_base64 and duration.
    """
    try:
        result = await DailyDigestService.synthesize_podcast_audio(
            db=db,
            date_str=date_str,
            voice=payload.voice or "vi-VN-NamMinhNeural",
            rate=payload.rate or "+5%",
            force_regenerate=bool(payload.force_regenerate)
        )
        return result
    except Exception as e:
        logger.error(f"Error synthesizing podcast audio for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{date_str}/audio-stream")
async def stream_podcast_audio(
    date_str: str,
    voice: str = Query("vi-VN-NamMinhNeural"),
    rate: str = Query("+5%"),
    force: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Streams audio bytes directly to the browser (audio/mpeg or audio/wav).
    Enables native HTML5 audio playback and instant buffering.
    """
    try:
        result = await DailyDigestService.synthesize_podcast_audio(
            db=db,
            date_str=date_str,
            voice=voice,
            rate=rate,
            force_regenerate=force
        )
        raw_b64 = result.get("audio_base64", "")
        if not raw_b64:
            raise HTTPException(status_code=500, detail="Audio synthesis did not return audio data")

        audio_bytes = base64.b64decode(raw_b64)
        media_type = "audio/wav" if raw_b64.startswith("UklG") else "audio/mpeg"
        return Response(content=audio_bytes, media_type=media_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming audio for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{date_str}/skills/{skill_id}/post")
async def get_skill_social_post(
    date_str: str,
    skill_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns the complete Social Media Tech Post for a specific skill in the digest.
    """
    try:
        digest = await DailyDigestService.generate_digest(
            db=db,
            date_str=date_str,
            force_regenerate=False
        )
        for item in (digest.skill_summaries or []):
            if item.get("skill_id") == skill_id:
                post = item.get("social_post")
                if not post:
                    skill = db.query(Skill).filter(Skill.id == skill_id).first()
                    if skill:
                        post = DailyDigestService._generate_social_post(skill, item)
                        item["social_post"] = post
                        db.commit()
                if post:
                    return {
                        "date": date_str,
                        "skill_id": skill_id,
                        "title": item.get("title"),
                        "social_post": post
                    }

        # Fallback: check if skill exists directly in db for that date
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if skill:
            analysis = DailyDigestService._analyze_skill_practical_value(skill)
            return {
                "date": date_str,
                "skill_id": skill_id,
                "title": analysis.get("title"),
                "social_post": analysis.get("social_post")
            }

        raise HTTPException(
            status_code=404,
            detail=f"Không tìm thấy bài post mạng xã hội cho công cụ ID {skill_id} trong bản tin ngày {date_str}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching skill social post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

