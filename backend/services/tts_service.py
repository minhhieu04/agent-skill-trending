import io
import base64
import logging
import asyncio
from typing import Dict, Any, List, Optional

logger = logging.getLogger("TTSService")

# Curated Hot AI Voices
CURATED_VOICES = [
    {
        "id": "vi-VN-HoaiMyNeural",
        "name": "Hoài My (Nữ)",
        "language": "vi-VN",
        "gender": "female",
        "style": "Viral Reviewer, TikTok Hot",
        "description": "Giọng đọc truyền cảm, rất quen thuộc trên các kênh review phim và video công nghệ triệu view.",
        "preview_text": "Chào các bạn! Hôm nay chúng ta sẽ cùng khám phá một công nghệ AI cực kỳ bùng nổ trong năm 2026."
    },
    {
        "id": "vi-VN-NamMinhNeural",
        "name": "Nam Minh (Nam)",
        "language": "vi-VN",
        "gender": "male",
        "style": "Tech Radar, Thời Sự",
        "description": "Giọng nam trầm ấm, chuyên nghiệp, chuẩn phong cách bản tin công nghệ và podcast chuyên sâu.",
        "preview_text": "Điểm tin công nghệ AI hôm nay: Google Antigravity và DeepMind vừa ra mắt tiêu chuẩn subagent mới."
    },
    {
        "id": "en-US-ChristopherNeural",
        "name": "Christopher (Male)",
        "language": "en-US",
        "gender": "male",
        "style": "Tech Podcast & Keynote",
        "description": "Clear, authoritative American tech voice suitable for developer showcases and system design walkthroughs.",
        "preview_text": "Welcome back developers! In today's episode, we are diving deep into autonomous agent workflows."
    },
    {
        "id": "en-US-JennyNeural",
        "name": "Jenny (Female)",
        "language": "en-US",
        "gender": "female",
        "style": "Tutorial & Explainer",
        "description": "Energetic, crisp and friendly voice ideal for quick tutorials, SaaS demos and product highlights.",
        "preview_text": "Here is how you can boost your coding velocity by 10x with this new trending AI skill."
    },
    {
        "id": "en-GB-SoniaNeural",
        "name": "Sonia (Female UK)",
        "language": "en-GB",
        "gender": "female",
        "style": "Documentary & Story",
        "description": "Refined British accent for high-end tech documentaries and architecture deep dives.",
        "preview_text": "Let us analyze the profound impact of Model Context Protocol on modern software engineering."
    },
    {
        "id": "ja-JP-NanamiNeural",
        "name": "Nanami (Female JP)",
        "language": "ja-JP",
        "gender": "female",
        "style": "Anime & Tech Review",
        "description": "Expressive Japanese voice popular for developer anime recaps and Asia tech trends.",
        "preview_text": "みなさん、こんにちは！最新のAIエージェントのトレンドを見ていきましょう。"
    }
]

class TTSService:
    @staticmethod
    def get_available_voices() -> List[Dict[str, Any]]:
        """Returns list of curated hot voices with metadata."""
        return CURATED_VOICES

    @staticmethod
    async def synthesize(
        text: str,
        voice: str = "vi-VN-HoaiMyNeural",
        rate: str = "+0%",
        pitch: str = "+0Hz"
    ) -> Dict[str, Any]:
        """
        Synthesizes text to speech using edge-tts.
        Returns base64 audio and word-level subtitle timings.
        """
        clean_text = text.strip()
        if not clean_text:
            return {
                "audio_base64": "",
                "duration_seconds": 0.0,
                "subtitle_entries": [],
                "voice": voice,
                "status": "empty_text"
            }

        try:
            import edge_tts
            communicate = edge_tts.Communicate(clean_text, voice, rate=rate, pitch=pitch)
            
            audio_chunks = []
            subtitle_entries = []
            
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    # chunk has offset, duration, text
                    offset_ms = chunk["offset"] / 10000  # 100ns units to ms
                    duration_ms = chunk["duration"] / 10000
                    subtitle_entries.append({
                        "text": chunk["text"],
                        "start_ms": int(offset_ms),
                        "end_ms": int(offset_ms + duration_ms)
                    })

            full_audio_bytes = b"".join(audio_chunks)
            audio_base64 = base64.b64encode(full_audio_bytes).decode("utf-8")
            
            # Calculate estimated duration
            duration_sec = 0.0
            if subtitle_entries:
                duration_sec = subtitle_entries[-1]["end_ms"] / 1000.0
            else:
                # Approximate duration based on word count (avg 150 words/min = 2.5 words/sec)
                words = len(clean_text.split())
                duration_sec = max(1.5, words / 2.5)
                # Generate synthetic word timings if edge-tts didn't emit word boundary
                subtitle_entries = TTSService._generate_synthetic_timings(clean_text, duration_sec)

            return {
                "audio_base64": audio_base64,
                "duration_seconds": round(duration_sec, 2),
                "subtitle_entries": subtitle_entries,
                "voice": voice,
                "status": "success"
            }

        except Exception as e:
            logger.warning(f"Edge-TTS synthesis error or fallback needed: {e}")
            # Fallback to simulated audio timings so UI flow is never broken
            words = clean_text.split()
            estimated_duration = max(2.0, len(words) * 0.35)
            synthetic_subtitles = TTSService._generate_synthetic_timings(clean_text, estimated_duration)
            
            return {
                "audio_base64": "",
                "duration_seconds": round(estimated_duration, 2),
                "subtitle_entries": synthetic_subtitles,
                "voice": voice,
                "status": "fallback_simulated",
                "message": f"TTS synthesis note: {str(e)}"
            }

    @staticmethod
    def _generate_synthetic_timings(text: str, total_duration_sec: float) -> List[Dict[str, Any]]:
        """Generates proportional word-level timestamps when exact boundaries are missing."""
        words = text.split()
        if not words:
            return []
        
        total_ms = int(total_duration_sec * 1000)
        word_duration = total_ms // len(words)
        
        entries = []
        current_time = 0
        for w in words:
            entries.append({
                "text": w,
                "start_ms": current_time,
                "end_ms": current_time + word_duration
            })
            current_time += word_duration
            
        return entries
