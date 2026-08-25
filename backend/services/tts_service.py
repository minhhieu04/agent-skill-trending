import base64
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("TTSService")

# Curated Hot AI Voices (Edge-TTS + Google WaveNet & Journey)
CURATED_VOICES = [
    # Vietnamese Voices
    {
        "id": "vi-VN-HoaiMyNeural",
        "name": "Diểm Phúc (Nữ - Truyền Cảm)",
        "provider": "edge_tts",
        "language": "vi-VN",
        "gender": "female",
        "style": "Viral Reviewer, TikTok Hot",
        "description": "Giọng đọc truyền cảm, giàu năng lượng, rất quen thuộc trên các kênh review công nghệ triệu view.",
        "preview_text": "Chào các bạn! Tôi là Diểm Phúc - cùng khám phá công nghệ AI cực kỳ bùng nổ trong năm 2026.",
        "recommended_preset": "hype",
        "badge": "HOT"
    },
    {
        "id": "vi-VN-NamMinhNeural",
        "name": "Minh Hiếu (Nam - Trầm Ấm)",
        "provider": "edge_tts",
        "language": "vi-VN",
        "gender": "male",
        "style": "Tech Radar, Thời Sự",
        "description": "Giọng nam trầm ấm, chuyên nghiệp, chuẩn phong cách bản tin công nghệ và podcast chuyên sâu.",
        "preview_text": "Điểm tin công nghệ AI hôm nay: Tôi là Minh Hiếu - Google Antigravity vừa ra mắt tiêu chuẩn subagent mới.",
        "recommended_preset": "professional",
        "badge": "STUDIO"
    },
    {
        "id": "vi-VN-Wavenet-A",
        "name": "Google WaveNet (Nữ - Chuẩn Studio)",
        "provider": "google_tts",
        "language": "vi-VN",
        "gender": "female",
        "style": "Google Cloud DeepMind WaveNet",
        "description": "Giọng đọc công nghệ WaveNet độc quyền của Google với ngữ điệu tự nhiên, chuẩn âm chuẩn thanh điệu.",
        "preview_text": "Xin chào! Đây là giọng đọc nhân tạo Google WaveNet chất lượng cao phục vụ video công nghệ.",
        "recommended_preset": "professional",
        "badge": "GOOGLE AI"
    },
    {
        "id": "vi-VN-Wavenet-B",
        "name": "Google WaveNet (Nam - Phát Thanh)",
        "provider": "google_tts",
        "language": "vi-VN",
        "gender": "male",
        "style": "Google Studio Broadcast",
        "description": "Giọng nam phát thanh viên Google DeepMind rõ ràng, mạch lạc, rất thích hợp cho video hướng dẫn lập trình.",
        "preview_text": "Google Cloud Text to Speech mang đến trải nghiệm âm thanh sống động cho ứng dụng của bạn.",
        "recommended_preset": "professional",
        "badge": "GOOGLE AI"
    },
    # English Voices
    {
        "id": "en-US-Journey-F",
        "name": "Google Journey (Female - Expressive)",
        "provider": "google_tts",
        "language": "en-US",
        "gender": "female",
        "style": "DeepMind Next-Gen Journey",
        "description": "Google's most advanced expressive voice model with human-like breathing and natural pauses.",
        "preview_text": "Hey developers, let's explore how Google Antigravity is reshaping modern software architecture.",
        "recommended_preset": "hype",
        "badge": "GOOGLE AI"
    },
    {
        "id": "en-US-ChristopherNeural",
        "name": "Christopher (Male - Keynote)",
        "provider": "edge_tts",
        "language": "en-US",
        "gender": "male",
        "style": "Tech Podcast & Keynote",
        "description": "Clear, authoritative American tech voice suitable for developer showcases and system design walkthroughs.",
        "preview_text": "Welcome back developers! In today's episode, we are diving deep into autonomous agent workflows.",
        "recommended_preset": "professional",
        "badge": "PRO"
    },
    {
        "id": "en-US-JennyNeural",
        "name": "Jenny (Female - Energetic)",
        "provider": "edge_tts",
        "language": "en-US",
        "gender": "female",
        "style": "Tutorial & Explainer",
        "description": "Energetic, crisp and friendly voice ideal for quick tutorials, SaaS demos and product highlights.",
        "preview_text": "Here is how you can boost your coding velocity by 10x with this new trending AI skill.",
        "recommended_preset": "hype",
        "badge": "HOT"
    },
    {
        "id": "en-GB-SoniaNeural",
        "name": "Sonia (Female UK - Elegant)",
        "provider": "edge_tts",
        "language": "en-GB",
        "gender": "female",
        "style": "Documentary & Story",
        "description": "Refined British accent for high-end tech documentaries and architecture deep dives.",
        "preview_text": "Let us analyze the profound impact of Model Context Protocol on modern software engineering.",
        "recommended_preset": "deep_dive",
        "badge": "UK"
    },
    {
        "id": "ja-JP-NanamiNeural",
        "name": "Nanami (Female JP - Anime)",
        "provider": "edge_tts",
        "language": "ja-JP",
        "gender": "female",
        "style": "Anime & Tech Review",
        "description": "Expressive Japanese voice popular for developer anime recaps and Asia tech trends.",
        "preview_text": "みなさん、こんにちは！最新のAIエージェントのトレンドを見ていきましょう。",
        "recommended_preset": "hype",
        "badge": "JP"
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
        pitch: str = "+0Hz",
        provider: str = "edge_tts"
    ) -> Dict[str, Any]:
        """
        Synthesizes text to speech.
        - If provider == 'google_tts': tries Google Cloud TTS first, falls back to Edge-TTS.
        - If provider == 'edge_tts': uses Edge-TTS directly.
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

        # Try Google Cloud TTS for google_tts provider
        if provider == "google_tts":
            result = await TTSService._synthesize_google_cloud(clean_text, voice, rate, pitch)
            if result:
                return result
            logger.info("Google Cloud TTS unavailable, falling back to Edge-TTS")

        # Edge-TTS (primary or fallback)
        return await TTSService._synthesize_edge_tts(clean_text, voice, rate, pitch)

    @staticmethod
    async def _synthesize_google_cloud(
        text: str, voice: str, rate: str, pitch: str
    ) -> Optional[Dict[str, Any]]:
        """
        Attempts Google Cloud Text-to-Speech synthesis.
        Returns None if unavailable (not installed or no credentials).
        """
        # Only supported Google voice IDs
        gcloud_voice_map = {
            "vi-VN-Wavenet-A": ("vi-VN", "vi-VN-Wavenet-A"),
            "vi-VN-Wavenet-B": ("vi-VN", "vi-VN-Wavenet-B"),
            "en-US-Journey-F": ("en-US", "en-US-Journey-F"),
        }
        if voice not in gcloud_voice_map:
            return None

        try:
            from google.cloud import texttospeech
            client = texttospeech.TextToSpeechClient()

            lang_code, voice_name = gcloud_voice_map[voice]

            # Convert rate string "+15%" → speaking_rate 1.15
            speaking_rate = 1.0
            if rate:
                try:
                    pct = int(rate.replace("%", "").replace("+", ""))
                    speaking_rate = max(0.25, min(4.0, 1.0 + pct / 100.0))
                except ValueError:
                    pass

            # Convert pitch string "+2Hz" → semitones (approximation)
            pitch_semitones = 0.0
            if pitch:
                try:
                    hz = float(pitch.replace("Hz", "").replace("+", ""))
                    pitch_semitones = max(-20.0, min(20.0, hz * 1.5))
                except ValueError:
                    pass

            synthesis_input = texttospeech.SynthesisInput(text=text)
            voice_params = texttospeech.VoiceSelectionParams(
                language_code=lang_code,
                name=voice_name,
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
                pitch=pitch_semitones,
            )

            response = client.synthesize_speech(
                input=synthesis_input, voice=voice_params, audio_config=audio_config
            )
            audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")

            # Google Cloud TTS basic tier doesn't emit word boundaries — estimate timings
            words = text.split()
            estimated_duration = max(2.0, len(words) * 0.38)
            subtitle_entries = TTSService._generate_synthetic_timings(text, estimated_duration)

            return {
                "audio_base64": audio_base64,
                "duration_seconds": round(estimated_duration, 2),
                "subtitle_entries": subtitle_entries,
                "voice": voice,
                "status": "success",
                "message": "Google Cloud TTS WaveNet"
            }

        except ImportError:
            logger.info("google-cloud-texttospeech not installed, falling back to Edge-TTS")
            return None
        except Exception as e:
            logger.warning(f"Google Cloud TTS synthesis failed: {e}")
            return None

    @staticmethod
    async def _synthesize_edge_tts(
        text: str, voice: str, rate: str, pitch: str
    ) -> Dict[str, Any]:
        """
        Synthesizes using Edge-TTS with automatic voice mapping for Google voice IDs.
        Returns word-level subtitle timings from WordBoundary events.
        """
        # Map Google voice IDs to nearest Edge-TTS equivalents
        voice_map = {
            "vi-VN-Wavenet-A": "vi-VN-HoaiMyNeural",
            "vi-VN-Wavenet-B": "vi-VN-NamMinhNeural",
            "en-US-Journey-F": "en-US-JennyNeural",
        }
        target_voice = voice_map.get(voice, voice)

        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, target_voice, rate=rate, pitch=pitch)

            audio_chunks: List[bytes] = []
            subtitle_entries: List[Dict[str, Any]] = []

            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    offset_ms = chunk["offset"] / 10000  # 100ns → ms
                    duration_ms = chunk["duration"] / 10000
                    subtitle_entries.append({
                        "text": chunk["text"],
                        "start_ms": int(offset_ms),
                        "end_ms": int(offset_ms + duration_ms)
                    })

            full_audio_bytes = b"".join(audio_chunks)
            audio_base64 = base64.b64encode(full_audio_bytes).decode("utf-8")

            if subtitle_entries:
                duration_sec = subtitle_entries[-1]["end_ms"] / 1000.0
            else:
                duration_sec = max(1.5, len(text.split()) / 2.5)
                subtitle_entries = TTSService._generate_synthetic_timings(text, duration_sec)

            return {
                "audio_base64": audio_base64,
                "duration_seconds": round(duration_sec, 2),
                "subtitle_entries": subtitle_entries,
                "voice": voice,
                "status": "success"
            }

        except Exception as e:
            logger.warning(f"Edge-TTS synthesis error: {e}")
            words = text.split()
            estimated_duration = max(2.0, len(words) * 0.35)
            synthetic_subtitles = TTSService._generate_synthetic_timings(text, estimated_duration)
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
