import asyncio
import base64
import hashlib
import html
import io
import json
import logging
import re
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import Dict, Any, List, Optional
from config import settings

logger = logging.getLogger("TTSService")

# Curated Hot AI Voices: Gemini 2.0 Live Native Audio + Google WaveNet + Edge-TTS (Diểm Phúc, Minh Hiếu)
CURATED_VOICES = [
    # --- Vietnamese Voices ---
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

    # --- Gemini 2.0 Live Native Audio Voices (Direct Multimodal Streaming) ---
    {
        "id": "gemini-Aoede",
        "name": "Gemini 2.0 Live - Aoede (Nữ - Biểu Cảm)",
        "provider": "gemini_audio",
        "language": "multi",
        "gender": "female",
        "style": "Gemini 2.0 Multimodal Native Audio",
        "description": "Mô hình âm thanh Gemini 2.0 Flash Native Audio trực tiếp, biểu cảm linh hoạt, độ trễ siêu thấp.",
        "preview_text": "Hello! I am Aoede, streaming live from Gemini 2.0 native audio with expressive storytelling tone.",
        "recommended_preset": "hype",
        "badge": "GEMINI 2.0"
    },
    {
        "id": "gemini-Puck",
        "name": "Gemini 2.0 Live - Puck (Nam - Năng Động)",
        "provider": "gemini_audio",
        "language": "multi",
        "gender": "male",
        "style": "Gemini 2.0 Multimodal Native Audio",
        "description": "Giọng nam trẻ trung, đầy nhiệt huyết, tối ưu cho video Shorts, TikTok và tech demos.",
        "preview_text": "Hey what is up developers! Puck here, powered by Gemini 2.0 live native audio stream.",
        "recommended_preset": "hype",
        "badge": "GEMINI 2.0"
    },
    {
        "id": "gemini-Charon",
        "name": "Gemini 2.0 Live - Charon (Nam - Trầm Lắng)",
        "provider": "gemini_audio",
        "language": "multi",
        "gender": "male",
        "style": "Gemini 2.0 Multimodal Native Audio",
        "description": "Giọng nam trầm tĩnh, sâu lắng, hoàn hảo cho podcast công nghệ và phân tích kiến trúc.",
        "preview_text": "Welcome. This is Charon speaking via Gemini 2.0 native audio intelligence.",
        "recommended_preset": "professional",
        "badge": "GEMINI 2.0"
    },
    {
        "id": "gemini-Kore",
        "name": "Gemini 2.0 Live - Kore (Nữ - Trong Trẻo)",
        "provider": "gemini_audio",
        "language": "multi",
        "gender": "female",
        "style": "Gemini 2.0 Multimodal Native Audio",
        "description": "Giọng nữ trong trẻo, tự nhiên, thích hợp cho video giải thích sản phẩm và tutorial.",
        "preview_text": "Hi there! I am Kore, your AI co-host for today's developer deep dive.",
        "recommended_preset": "professional",
        "badge": "GEMINI 2.0"
    },
    {
        "id": "gemini-Fenrir",
        "name": "Gemini 2.0 Live - Fenrir (Nam - Bản Lĩnh)",
        "provider": "gemini_audio",
        "language": "multi",
        "gender": "male",
        "style": "Gemini 2.0 Multimodal Native Audio",
        "description": "Giọng nam đĩnh đạc, uy lực, rất thích hợp cho bài thuyết trình Keynote và ra mắt tính năng lớn.",
        "preview_text": "Let us explore the future of agentic engineering with Gemini 2.0 native capabilities.",
        "recommended_preset": "hype",
        "badge": "GEMINI 2.0"
    },

    # --- English & International Voices ---
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
        "preview_text": "Here is how this agent skill can support a real developer workflow with source-backed guidance.",
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
    def narration_revision(
        scene_texts: Optional[List[str]],
        voice: str,
        rate: str,
        pitch: str,
    ) -> str:
        """Fingerprint the exact narration inputs used to produce an audio track."""
        payload = {
            "scene_texts": [re.sub(r"\s+", " ", text or "").strip() for text in (scene_texts or [])],
            "voice": voice or "",
            "rate": rate or "+0%",
            "pitch": pitch or "+0Hz",
        }
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    @staticmethod
    def get_available_voices() -> List[Dict[str, Any]]:
        """Returns list of curated hot voices with metadata."""
        return CURATED_VOICES

    @staticmethod
    def _script_words(text: str) -> List[str]:
        """Tokenize exactly as the Studio sends narration to TTS."""
        return re.findall(r"\S+", text or "")

    @staticmethod
    def _build_google_timepoint_ssml(text: str) -> tuple[str, List[str]]:
        """Add a Google SSML mark before every spoken word for real karaoke starts."""
        words = TTSService._script_words(text)
        marked_words = [
            f'<mark name="w{index}"/>{html.escape(word, quote=True)}'
            for index, word in enumerate(words)
        ]
        return f"<speak>{' '.join(marked_words)}</speak>", words

    @staticmethod
    def _subtitles_from_timepoints(timepoints: Any, words: List[str]) -> List[Dict[str, Any]]:
        starts_by_index: Dict[int, int] = {}
        for timepoint in timepoints or []:
            name = str(getattr(timepoint, "mark_name", ""))
            match = re.fullmatch(r"w(\d+)", name)
            if not match:
                continue
            word_index = int(match.group(1))
            if word_index >= len(words):
                continue
            starts_by_index[word_index] = max(0, round(float(timepoint.time_seconds) * 1000))

        # Partial timepoint streams are worse than a cadence-aware fallback because
        # missing marks would shift every following caption.
        if len(starts_by_index) != len(words):
            return []

        entries: List[Dict[str, Any]] = []
        for index, word in enumerate(words):
            start_ms = starts_by_index[index]
            next_start_ms = starts_by_index.get(index + 1, start_ms + 420)
            entries.append({
                "text": word,
                "start_ms": start_ms,
                "end_ms": max(start_ms + 1, next_start_ms),
            })
        return entries

    @staticmethod
    async def synthesize(
        text: str,
        voice: str = "vi-VN-HoaiMyNeural",
        rate: str = "+0%",
        pitch: str = "+0Hz",
        provider: str = "edge_tts",
        scene_texts: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes text to speech using selected AI audio engine:
        1. gemini_audio: Gemini 2.0 Flash Native Audio Output
        2. google_tts: Google Cloud WaveNet / Journey TTS
        3. edge_tts: Microsoft Edge Neural TTS (Free, high quality)
        """
        clean_text = text.strip()
        if not clean_text:
            return {
                "audio_base64": "",
                "duration_seconds": 0.0,
                "subtitle_entries": [],
                "voice": voice,
                "status": "empty_text",
                "timing_quality": "estimated",
            }

        # Never synthesize a silently truncated script: that creates an audio
        # track whose spoken words cannot match the submitted scene list.
        if len(clean_text) > 5000:
            raise ValueError("TTS input exceeds the 5000 character limit")

        def finalize(result: Dict[str, Any], actual_provider: str) -> Dict[str, Any]:
            result["voice"] = voice
            result["rate"] = rate
            result["pitch"] = pitch
            result["requested_provider"] = provider
            result["actual_provider"] = actual_provider
            result["narration_revision"] = TTSService.narration_revision(
                scene_texts,
                voice,
                rate,
                pitch,
            )
            return TTSService._finalize_timing(result, scene_texts)


        # 1. Gemini 2.0 Native Audio path
        if provider == "gemini_audio" or voice.startswith("gemini-"):
            result = await TTSService._synthesize_gemini_audio(clean_text, voice, rate, pitch)
            if result:
                return finalize(result, "gemini_audio")
            logger.info("Gemini 2.0 Native Audio unavailable, falling back to Edge-TTS")

        # 2. Google Cloud TTS path
        if provider == "google_tts":
            result = await TTSService._synthesize_google_cloud(clean_text, voice, rate, pitch)
            if result:
                return finalize(result, "google_tts")
            logger.info("Google Cloud TTS unavailable, falling back to Edge-TTS")

        # 3. Edge-TTS path (primary or reliable fallback)
        result = await TTSService._synthesize_edge_tts(clean_text, voice, rate, pitch)
        return finalize(result, "edge_tts")

    @staticmethod
    def _probe_audio_duration(audio_base64: str) -> Optional[float]:
        if not audio_base64:
            return None
        try:
            audio_bytes = base64.b64decode(audio_base64)
            try:
                with wave.open(io.BytesIO(audio_bytes), "rb") as wav_file:
                    frame_rate = wav_file.getframerate()
                    frame_count = wav_file.getnframes()
                    if frame_rate > 0 and frame_count > 0:
                        return frame_count / frame_rate
            except (EOFError, wave.Error):
                # Edge-TTS and cloud providers generally return compressed audio.
                # Let ffprobe handle those formats when it is available.
                pass

            with tempfile.TemporaryDirectory(prefix="agent-skill-audio-") as temp_dir:
                audio_path = Path(temp_dir) / "voice-track"
                audio_path.write_bytes(audio_bytes)
                completed = subprocess.run(
                    [
                        "ffprobe", "-v", "error",
                        "-show_entries", "format=duration",
                        "-of", "default=noprint_wrappers=1:nokey=1",
                        str(audio_path),
                    ],
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=20,
                )
                duration = float(completed.stdout.strip())
                return duration if duration > 0 else None
        except (OSError, ValueError, subprocess.SubprocessError):
            return None

    @staticmethod
    def _finalize_timing(result: Dict[str, Any], scene_texts: Optional[List[str]]) -> Dict[str, Any]:
        """Lock every visual boundary to the encoded audio, never storyboard estimates."""
        actual_duration = TTSService._probe_audio_duration(result.get("audio_base64", ""))
        if actual_duration:
            result["duration_seconds"] = round(actual_duration, 3)

        duration_ms = int(round(float(result.get("duration_seconds") or 0) * 1000))
        subtitles = result.get("subtitle_entries") or []
        timing_quality = result.get("timing_quality") or "estimated"
        if timing_quality == "estimated" and actual_duration:
            result["subtitle_entries"] = TTSService._generate_synthetic_timings(
                " ".join(scene_texts or []) or " ".join(item.get("text", "") for item in subtitles),
                actual_duration,
            )
            subtitles = result["subtitle_entries"]

        raw_caption_end_ms = max(
            (int(subtitle.get("end_ms") or 0) for subtitle in subtitles),
            default=0,
        )
        timestamp_scale = 1.0
        # Edge speech metadata can use a clock that is longer than the encoded
        # MP3 stream (observed as a near-linear drift). Clamping only the tail
        # collapses many words into the final frame. Scale the complete stream
        # to the decoded audio clock instead.
        if (
            duration_ms > 0
            and raw_caption_end_ms > 0
            and abs(raw_caption_end_ms - duration_ms) > max(120, duration_ms * 0.02)
        ):
            timestamp_scale = duration_ms / raw_caption_end_ms
            subtitles = [
                {
                    **subtitle,
                    "start_ms": round(int(subtitle.get("start_ms") or 0) * timestamp_scale),
                    "end_ms": round(int(subtitle.get("end_ms") or 0) * timestamp_scale),
                }
                for subtitle in subtitles
            ]

        normalized_subtitles: List[Dict[str, Any]] = []
        previous_start = 0
        for index, subtitle in enumerate(subtitles):
            text = str(subtitle.get("text") or "").strip()
            if not text:
                continue
            start_ms = max(previous_start, int(subtitle.get("start_ms") or 0))
            if duration_ms:
                start_ms = min(start_ms, max(0, duration_ms - 1))
            next_start = None
            if index + 1 < len(subtitles):
                next_start = max(start_ms + 1, int(subtitles[index + 1].get("start_ms") or 0))
            raw_end = int(subtitle.get("end_ms") or start_ms + 1)
            end_ms = max(start_ms + 1, raw_end)
            if next_start is not None:
                end_ms = min(end_ms, next_start)
            if duration_ms:
                end_ms = min(end_ms, duration_ms)
            normalized_subtitles.append({"text": text, "start_ms": start_ms, "end_ms": end_ms})
            previous_start = start_ms
        result["subtitle_entries"] = normalized_subtitles
        subtitles = normalized_subtitles

        normalized_scenes = [(text or "").strip() for text in (scene_texts or [])]
        if normalized_scenes:
            segments: List[Dict[str, int]] = []
            scene_word_counts = [max(1, len(TTSService._script_words(text))) for text in normalized_scenes]
            total_scene_words = sum(scene_word_counts)
            subtitle_cursor = 0
            cumulative_words = 0
            for scene_index, scene_text in enumerate(normalized_scenes):
                subtitle_start = subtitle_cursor
                cumulative_words += scene_word_counts[scene_index]
                subtitle_end = (
                    len(subtitles)
                    if scene_index == len(normalized_scenes) - 1
                    else min(len(subtitles), round(cumulative_words / total_scene_words * len(subtitles)))
                )
                if scene_index < len(normalized_scenes) - 1 and subtitle_end <= subtitle_start and subtitle_start < len(subtitles):
                    subtitle_end = subtitle_start + 1
                start_ms = 0 if scene_index == 0 else segments[-1]["end_ms"]
                next_start = subtitles[subtitle_end].get("start_ms") if subtitle_end < len(subtitles) else None
                end_ms = duration_ms if scene_index == len(normalized_scenes) - 1 else int(
                    next_start
                    if next_start is not None
                    else subtitles[subtitle_end - 1].get("end_ms", start_ms + 1)
                    if subtitle_end > subtitle_start
                    else start_ms + 1
                )
                end_ms = max(int(start_ms) + 1, min(duration_ms or end_ms, end_ms))
                segments.append({
                    "scene_index": scene_index,
                    "start_ms": int(start_ms),
                    "end_ms": end_ms,
                    "subtitle_start_index": subtitle_start,
                    "subtitle_end_index": subtitle_end,
                })
                subtitle_cursor = subtitle_end
            result["scene_segments"] = segments

        result["timing_quality"] = timing_quality
        result["timeline_version"] = 2
        result["audio_duration_ms"] = duration_ms
        # Speech marks can trail audible phonemes slightly because of provider and
        # MP3 encoder latency. Rendering 90 ms ahead feels locked without flashing
        # the next word too early; estimated providers get a little more lead.
        result["caption_lead_ms"] = 140 if timing_quality == "estimated" else 90
        last_caption_end = subtitles[-1]["end_ms"] if subtitles else 0
        result["sync_diagnostics"] = {
            "audio_duration_ms": duration_ms,
            "last_caption_end_ms": last_caption_end,
            "tail_ms": max(0, duration_ms - last_caption_end),
            "raw_caption_end_ms": raw_caption_end_ms,
            "timestamp_scale": round(timestamp_scale, 6),
            "scene_count": len(normalized_scenes),
            "subtitle_count": len(subtitles),
            "source": "provider_boundaries" if timing_quality == "word" else "cadence_estimate",
        }
        return result

    @staticmethod
    async def _synthesize_gemini_audio(
        text: str, voice: str, rate: str, pitch: str
    ) -> Optional[Dict[str, Any]]:
        """
        Synthesizes speech using Gemini 2.0 Flash Native Audio Output.
        """
        if not settings.GEMINI_API_KEY:
            return None

        # Extract voice name (e.g., 'gemini-Aoede' -> 'Aoede')
        voice_name = voice.replace("gemini-", "")
        if voice_name not in ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]:
            voice_name = "Aoede"

        try:
            from google import genai
            from google.genai import types as genai_types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"Please read the following text aloud with natural intonation, clear pronunciation, and expressive emotion. Do not include any explanations or intro text, only speak the exact words:\n\n{text}"

            config = genai_types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=genai_types.SpeechConfig(
                    voice_config=genai_types.VoiceConfig(
                        prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                            voice_name=voice_name
                        )
                    )
                )
            )

            # Use asyncio.to_thread to avoid blocking the event loop
            response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.0-flash",
                contents=prompt,
                config=config
            )

            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "inline_data") and part.inline_data:
                        audio_data = part.inline_data.data
                        if isinstance(audio_data, bytes):
                            audio_b64 = base64.b64encode(audio_data).decode("utf-8")
                        else:
                            logger.warning("Gemini audio data is not bytes, skipping")
                            continue

                        words = text.split()
                        estimated_duration = max(2.0, len(words) * 0.38)
                        subtitle_entries = TTSService._generate_synthetic_timings(text, estimated_duration)

                        return {
                            "audio_base64": audio_b64,
                            "duration_seconds": round(estimated_duration, 2),
                            "subtitle_entries": subtitle_entries,
                            "voice": voice,
                            "status": "success",
                            "message": f"Gemini 2.0 Native Audio ({voice_name})",
                            "timing_quality": "estimated",
                        }

        except Exception as e:
            logger.warning(f"Gemini 2.0 Native Audio synthesis failed: {e}")
            return None

        return None


    @staticmethod
    async def _synthesize_google_cloud(
        text: str, voice: str, rate: str, pitch: str
    ) -> Optional[Dict[str, Any]]:
        """
        Attempts Google Cloud Text-to-Speech synthesis with real SSML timepoints.
        Returns None if unavailable (not installed or no credentials).
        """
        gcloud_voice_map = {
            "vi-VN-Wavenet-A": ("vi-VN", "vi-VN-Wavenet-A"),
            "vi-VN-Wavenet-B": ("vi-VN", "vi-VN-Wavenet-B"),
            "en-US-Journey-F": ("en-US", "en-US-Journey-F"),
        }
        if voice not in gcloud_voice_map:
            return None

        try:
            # Word marks are exposed by the v1beta1 request. They are used as the
            # canonical karaoke clock instead of spreading words evenly.
            from google.cloud import texttospeech_v1beta1 as texttospeech
            client = texttospeech.TextToSpeechClient()

            lang_code, voice_name = gcloud_voice_map[voice]

            speaking_rate = 1.0
            if rate:
                try:
                    pct = int(rate.replace("%", "").replace("+", ""))
                    speaking_rate = max(0.25, min(4.0, 1.0 + pct / 100.0))
                except ValueError:
                    pass

            pitch_semitones = 0.0
            if pitch:
                try:
                    hz = float(pitch.replace("Hz", "").replace("+", ""))
                    pitch_semitones = max(-20.0, min(20.0, hz * 1.5))
                except ValueError:
                    pass

            marked_ssml, words = TTSService._build_google_timepoint_ssml(text)
            synthesis_input = texttospeech.SynthesisInput(ssml=marked_ssml)
            voice_params = texttospeech.VoiceSelectionParams(
                language_code=lang_code,
                name=voice_name,
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
                pitch=pitch_semitones,
            )

            request = texttospeech.SynthesizeSpeechRequest(
                input=synthesis_input,
                voice=voice_params,
                audio_config=audio_config,
                enable_time_pointing=[
                    texttospeech.SynthesizeSpeechRequest.TimepointType.SSML_MARK
                ],
            )

            # Use asyncio.to_thread to avoid blocking the event loop.
            response = await asyncio.to_thread(
                client.synthesize_speech,
                request=request,
            )
            audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")
            subtitle_entries = TTSService._subtitles_from_timepoints(response.timepoints, words)
            has_exact_timepoints = len(subtitle_entries) == len(words) and len(words) > 0
            estimated_duration = max(2.0, len(words) * 0.38)
            if not has_exact_timepoints:
                subtitle_entries = TTSService._generate_synthetic_timings(text, estimated_duration)

            return {
                "audio_base64": audio_base64,
                "duration_seconds": round(estimated_duration, 2),
                "subtitle_entries": subtitle_entries,
                "voice": voice,
                "status": "success",
                "message": "Google Cloud TTS WaveNet + SSML speech marks",
                "timing_quality": "word" if has_exact_timepoints else "estimated",
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
        Synthesizes using Edge-TTS with automatic voice mapping for Google and Gemini voice IDs.
        """
        voice_map = {
            "vi-VN-Wavenet-A": "vi-VN-HoaiMyNeural",
            "vi-VN-Wavenet-B": "vi-VN-NamMinhNeural",
            "en-US-Journey-F": "en-US-JennyNeural",
            "gemini-Aoede": "en-US-JennyNeural",
            "gemini-Puck": "en-US-ChristopherNeural",
            "gemini-Charon": "vi-VN-NamMinhNeural",
            "gemini-Kore": "vi-VN-HoaiMyNeural",
            "gemini-Fenrir": "en-US-ChristopherNeural",
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
                "status": "success",
                "timing_quality": "word",
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
                "message": f"TTS synthesis note: {str(e)}",
                "timing_quality": "estimated",
            }

    @staticmethod
    def _generate_synthetic_timings(text: str, total_duration_sec: float) -> List[Dict[str, Any]]:
        """Generate cadence-aware timings when a provider has no speech marks."""
        words = TTSService._script_words(text)
        if not words:
            return []

        total_ms = max(1.0, total_duration_sec * 1000)
        weights: List[float] = []
        for word in words:
            clean_length = len(re.sub(r"[^\wÀ-ỹ]", "", word, flags=re.UNICODE))
            weight = 1.0 + min(clean_length, 12) * 0.035
            if re.search(r"[.!?…][\"')\]]*$", word):
                weight += 0.72
            elif re.search(r"[,;:][\"')\]]*$", word):
                weight += 0.34
            weights.append(weight)
        weight_total = sum(weights)

        entries: List[Dict[str, Any]] = []
        current_time = 0.0
        for index, word in enumerate(words):
            word_duration = total_ms * weights[index] / weight_total
            entries.append({
                "text": word,
                "start_ms": round(current_time),
                "end_ms": min(round(total_ms), max(round(current_time) + 1, round(current_time + word_duration))),
            })
            current_time += word_duration

        entries[-1]["end_ms"] = round(total_ms)
        return entries
