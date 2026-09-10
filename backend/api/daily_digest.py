import logging
import base64
import json
import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.skill import Skill
from models.user import User
from services.daily_digest_service import DailyDigestService
from services.tts_service import TTSService
from middleware.auth import get_current_user, get_optional_current_user

logger = logging.getLogger("DailyDigestRouter")

router = APIRouter(prefix="/daily-digest", tags=["Daily AI Podcast & Feed"])


def validate_and_normalize_date(date_str: str) -> str:
    """
    Validates and normalizes date parameter.
    Resolves 'today', 'current', 'latest', 'now', or empty strings to today's local date (YYYY-MM-DD).
    Validates against YYYY-MM-DD pattern and validates calendar date validity.
    Raises HTTPException(400) on invalid date format or calendar date.
    """
    if not date_str:
        return datetime.now().strftime("%Y-%m-%d")

    clean_date = date_str.strip().lower()
    if clean_date in ("today", "current", "latest", "now"):
        return datetime.now().strftime("%Y-%m-%d")

    # Must match YYYY-MM-DD format
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", clean_date):
        raise HTTPException(
            status_code=400,
            detail=f"Định dạng ngày không hợp lệ: '{date_str}'. Định dạng yêu cầu là YYYY-MM-DD hoặc 'today'."
        )

    # Must be valid calendar date
    try:
        valid_date = datetime.strptime(clean_date, "%Y-%m-%d")
        return valid_date.strftime("%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Ngày không hợp lệ trong lịch: '{date_str}'. Định dạng yêu cầu là YYYY-MM-DD."
        )


class AudioSynthesizeRequest(BaseModel):
    voice: Optional[str] = "vi-VN-NamMinhNeural"
    rate: Optional[str] = "+5%"
    force_regenerate: Optional[bool] = False


class RegenerateRequest(BaseModel):
    language: Optional[str] = "vi"
    model: Optional[str] = "gemini-3.8-flash"


class TranslateDigestRequest(BaseModel):
    target_language: Optional[str] = "en"
    model: Optional[str] = "gemini-3.8-flash"


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
def _normalize_skill_summaries(summaries) -> list:
    if not summaries or not isinstance(summaries, list):
        return []
    import re
    cleaned = []
    for item in summaries:
        if isinstance(item, dict):
            item_copy = dict(item)
            if "social_post" in item_copy and isinstance(item_copy["social_post"], dict):
                post_copy = dict(item_copy["social_post"])
                if "badge" in post_copy and post_copy["badge"]:
                    # Strip leading emoji/symbols from badge
                    post_copy["badge"] = re.sub(r'^[^\w\s\u00C0-\u1EF9]+', '', str(post_copy["badge"])).strip()
                item_copy["social_post"] = post_copy
            cleaned.append(item_copy)
        else:
            cleaned.append(item)
    return cleaned


@router.get("/{date_str}")
async def get_daily_digest(
    date_str: str,
    auto_generate: bool = Query(True, description="Automatically generate if not existing"),
    db: Session = Depends(get_db)
):
    """
    Gets the podcast digest and practical skill summaries for a specific date (YYYY-MM-DD).
    """
    date_str = validate_and_normalize_date(date_str)
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
            "skill_summaries": _normalize_skill_summaries(digest.skill_summaries),
            "total_skills_count": digest.total_skills_count,
            "has_audio": has_real_audio,
            "podcast_duration_sec": digest.podcast_duration_sec or 0.0,
            "podcast_voice": digest.podcast_voice,
            "source_model": digest.source_model,
            "updated_at": digest.updated_at.isoformat() if digest.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting daily digest for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{date_str}/generate")
async def regenerate_daily_digest(
    date_str: str,
    payload: RegenerateRequest = RegenerateRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forces AI to re-analyze skills and re-generate the podcast script & practical summary.
    Requires admin privileges.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền tái tạo bản tin")
    date_str = validate_and_normalize_date(date_str)
    try:
        digest = await DailyDigestService.generate_digest(
            db=db,
            date_str=date_str,
            language=payload.language or "vi",
            model=payload.model or "gemini-3.8-flash",
            force_regenerate=True
        )
        return {
            "id": digest.id,
            "digest_date": digest.digest_date,
            "title": digest.title,
            "summary_markdown": digest.summary_markdown,
            "podcast_script": digest.podcast_script,
            "highlights": _normalize_highlights(digest.highlights),
            "skill_summaries": _normalize_skill_summaries(digest.skill_summaries),
            "total_skills_count": digest.total_skills_count,
            "has_audio": bool(digest.podcast_audio_base64),
            "podcast_duration_sec": digest.podcast_duration_sec or 0.0,
            "podcast_voice": digest.podcast_voice,
            "source_model": digest.source_model,
            "updated_at": digest.updated_at.isoformat() if digest.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating daily digest for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{date_str}/translate")
async def translate_daily_digest(
    date_str: str,
    payload: TranslateDigestRequest = TranslateDigestRequest(),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Translates the daily digest and skill summaries to target language (e.g. 'en' or 'vi') using Gemini 3.8 Flash.
    Available to all users. AI-powered translation is used when logged in.
    """
    date_str = validate_and_normalize_date(date_str)
    try:
        translated = await DailyDigestService.translate_digest(
            db=db,
            date_str=date_str,
            target_lang=payload.target_language or "en",
            model=payload.model or "gemini-3.8-flash",
            is_authenticated=bool(current_user)
        )
        if isinstance(translated, dict) and "skill_summaries" in translated:
            translated["skill_summaries"] = _normalize_skill_summaries(translated["skill_summaries"])
        return translated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating daily digest for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{date_str}/audio")
async def synthesize_audio(
    date_str: str,
    payload: AudioSynthesizeRequest = AudioSynthesizeRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates TTS audio for the daily podcast episode using Google AI Studio / Gemini / EdgeTTS.
    Returns audio_base64 and duration.
    Force regeneration requires admin privileges.
    """
    if payload.force_regenerate and (not current_user or not current_user.is_admin):
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền ép tạo lại audio")
    date_str = validate_and_normalize_date(date_str)
    try:
        result = await DailyDigestService.synthesize_podcast_audio(
            db=db,
            date_str=date_str,
            voice=payload.voice or "gemini-Aoede",
            rate=payload.rate or "+5%",
            force_regenerate=bool(payload.force_regenerate)
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synthesizing podcast audio for {date_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{date_str}/audio-stream")
async def stream_podcast_audio(
    date_str: str,
    voice: str = Query("gemini-Aoede"),
    rate: str = Query("+5%"),
    force: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Streams audio bytes directly to the browser (audio/mpeg or audio/wav).
    Enables native HTML5 audio playback and instant buffering.
    """
    date_str = validate_and_normalize_date(date_str)
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
    date_str = validate_and_normalize_date(date_str)
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

