import base64
import io
import wave
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from models.skill import Skill
from api.studio import VideoSceneItem
from services.blog_video_service import BlogVideoService
from services.tts_service import TTSService

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    skill = db.query(Skill).first()
    if not skill:
        skill = Skill(
            name="google/skills",
            title="Google Agent Skills & Antigravity Plugins",
            repository_url="https://github.com/google/skills",
            category="skill-file",
            tags=["antigravity", "gemini"],
            runtimes=["Google Antigravity", "Cursor"],
            primary_language="Python",
            stars=15000,
            trending_score=98.0
        )
        db.add(skill)
        db.commit()
        db.refresh(skill)
    db.close()
    yield

client = TestClient(app)

def test_get_tts_voices():
    res = client.get("/api/v1/studio/tts/voices")
    assert res.status_code == 200
    voices = res.json()
    assert isinstance(voices, list)
    assert len(voices) >= 6
    
    # Verify required fields
    voice_ids = [v["id"] for v in voices]
    assert "vi-VN-HoaiMyNeural" in voice_ids
    assert "vi-VN-NamMinhNeural" in voice_ids
    assert "en-US-ChristopherNeural" in voice_ids
    
    for v in voices:
        assert "id" in v
        assert "name" in v
        assert "language" in v
        assert "gender" in v
        assert "preview_text" in v

def test_generate_blog_default_topic():
    payload = {
        "topic": "AI Agent Architecture 2026",
        "tone": "professional",
        "language": "vi"
    }
    res = client.post("/api/v1/studio/blog/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "title" in data
    assert "content" in data
    assert "tags" in data
    assert "word_count" in data
    assert data["word_count"] > 50
    assert "#" in data["content"]

def test_generate_blog_from_skill():
    db = SessionLocal()
    skill = db.query(Skill).first()
    skill_id = skill.id if skill else None
    db.close()

    payload = {
        "skill_id": skill_id,
        "tone": "hype",
        "language": "vi"
    }
    res = client.post("/api/v1/studio/blog/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] is not None
    assert len(data["content"]) > 100

def test_generate_storyboard_scenes():
    payload = {
        "content": "Deep dive into Antigravity Subagents",
        "target_duration": 60,
        "aspect_ratio": "9:16",
        "language": "vi"
    }
    res = client.post("/api/v1/studio/storyboard/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_duration"] > 0
    assert data["aspect_ratio"] == "9:16"
    assert "scenes" in data
    assert len(data["scenes"]) >= 3
    
    for scene in data["scenes"]:
        assert "scene_number" in scene
        assert "title" in scene
        assert "voiceover_text" in scene
        assert "visual_description" in scene
        assert "duration_seconds" in scene
        assert scene["duration_seconds"] > 0


def test_storyboard_schema_preserves_rich_visual_fields():
    scene = VideoSceneItem(
        scene_number=2,
        scene_type="github",
        title="Repository walkthrough",
        voiceover_text="Open the real repository and inspect its README.",
        visual_description="GitHub browser walkthrough with cursor actions.",
        duration_seconds=8,
        repository_url="https://github.com/example/verified-skill",
        repository_owner="example",
        repository_name="verified-skill",
        stars_count=321,
        cursor_actions=[{"at": 0.4, "x": 0.5, "y": 0.3, "type": "click"}],
        github_capture_viewport={"width": 1000, "height": 1400},
        visual_beats=[{"at": 0.04, "badge": "HOOK", "title": "Repo", "detail": "Verified"}],
    ).model_dump()
    assert scene["scene_type"] == "github"
    assert scene["repository_url"].endswith("verified-skill")
    assert scene["stars_count"] == 321
    assert scene["cursor_actions"][0]["type"] == "click"
    assert scene["github_capture_viewport"]["height"] == 1400
    assert scene["visual_beats"][0]["badge"] == "HOOK"


def test_curated_storyboard_uses_verified_skill_data():
    storyboard = BlogVideoService._generate_curated_storyboard(
        "Verified Skill",
        target_duration=60,
        aspect_ratio="9:16",
        language="vi",
        skill_data={
            "name": "example/verified-skill",
            "repository_url": "https://github.com/example/verified-skill",
            "description": "A repository-backed workflow skill.",
            "readme_preview": "# Verified Skill\n\n```bash\ngit clone https://github.com/example/verified-skill\n```",
            "primary_language": "Python",
            "stars": 321,
            "forks": 12,
            "open_issues": 4,
            "trending_score": 87.5,
            "use_cases": ["Repository review", "Safe setup"],
            "runtimes": ["Codex"],
        },
    )
    github_scene = next(scene for scene in storyboard["scenes"] if scene["scene_type"] == "github")
    stat_scene = next(scene for scene in storyboard["scenes"] if scene["scene_type"] == "stat")
    terminal_scene = next(scene for scene in storyboard["scenes"] if scene["scene_type"] == "terminal")
    assert storyboard["total_duration"] == 60
    assert github_scene["repository_name"] == "verified-skill"
    assert stat_scene["stars_count"] == 321
    assert "45,000" not in stat_scene["voiceover_text"]
    assert terminal_scene["terminal_command"] == "git clone https://github.com/example/verified-skill"
    assert all(len(scene["visual_beats"]) == 3 for scene in storyboard["scenes"])
    assert [beat["at"] for beat in terminal_scene["visual_beats"]] == [0.04, 0.38, 0.72]
    assert all(beat["anchor_text"] in terminal_scene["voiceover_text"] for beat in terminal_scene["visual_beats"])
    assert storyboard["narration_word_count"] <= storyboard["target_word_budget"]


def test_short_storyboard_caps_narration_to_requested_duration():
    storyboard = BlogVideoService._generate_curated_storyboard(
        "Public Agent Skill Demo",
        target_duration=30,
        aspect_ratio="9:16",
        language="vi",
        skill_data={
            "name": "google/skills",
            "repository_url": "https://github.com/google/skills",
            "description": "Bản kiểm thử công khai cho quy trình đọc nguồn và trình bày agent skill.",
            "readme_preview": "Đọc tài liệu, kiểm tra repository và thử trong sandbox.",
            "primary_language": "TypeScript",
            "use_cases": ["Đọc tài liệu", "Kiểm tra repository", "Thử trong sandbox"],
            "runtimes": ["Codex", "Claude Code", "Cursor"],
        },
    )
    spoken_words = sum(
        len(scene["voiceover_text"].split()) for scene in storyboard["scenes"]
    )
    assert storyboard["total_duration"] == 30
    assert spoken_words == storyboard["narration_word_count"]
    assert spoken_words <= 72


def test_long_storyboard_adds_distinct_deep_dive_scenes():
    storyboard = BlogVideoService._generate_curated_storyboard(
        "Long Skill Review",
        target_duration=180,
        aspect_ratio="9:16",
        language="vi",
        skill_data={
            "repository_url": "https://github.com/google/skills",
            "description": "Agent skills for Google products and technologies.",
            "primary_language": "Python",
            "use_cases": ["Cloud onboarding", "Repository review", "Agent setup"],
            "runtimes": ["Codex", "Antigravity"],
            "security_rating": "review_required",
        },
    )
    titles = [scene["title"] for scene in storyboard["scenes"]]
    assert storyboard["total_duration"] == 180
    assert len(storyboard["scenes"]) == 16
    assert len(titles) == len(set(titles))
    assert any(scene["scene_type"] == "security" for scene in storyboard["scenes"])


def test_tts_timing_uses_encoded_audio_duration_and_scene_segments():
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(8000)
        wav_file.writeframes(b"\x00\x00" * 16000)

    result = TTSService._finalize_timing(
        {
            "audio_base64": base64.b64encode(wav_buffer.getvalue()).decode("ascii"),
            "duration_seconds": 1.0,
            "subtitle_entries": [
                {"text": "xin", "start_ms": 0, "end_ms": 350},
                {"text": "chào", "start_ms": 350, "end_ms": 800},
                {"text": "github", "start_ms": 900, "end_ms": 1500},
            ],
            "timing_quality": "word",
        },
        ["xin chào", "github"],
    )
    assert result["duration_seconds"] == pytest.approx(2.0, abs=0.02)
    assert result["scene_segments"][0]["end_ms"] == 1200
    assert result["scene_segments"][1]["end_ms"] == pytest.approx(2000, abs=20)
    assert result["timeline_version"] == 2
    assert result["caption_lead_ms"] == 90
    assert result["sync_diagnostics"]["audio_duration_ms"] == pytest.approx(2000, abs=20)


def test_google_ssml_and_timepoints_produce_real_word_timeline():
    ssml, words = TTSService._build_google_timepoint_ssml("Xin chào GitHub & Codex.")
    assert words == ["Xin", "chào", "GitHub", "&", "Codex."]
    assert ssml.count("<mark name=") == len(words)
    assert "&amp;" in ssml

    timepoints = [
        SimpleNamespace(mark_name=f"w{index}", time_seconds=index * 0.25)
        for index in range(len(words))
    ]
    subtitles = TTSService._subtitles_from_timepoints(timepoints, words)
    assert [entry["text"] for entry in subtitles] == words
    assert subtitles[2]["start_ms"] == 500
    assert subtitles[2]["end_ms"] == 750


def test_estimated_timing_is_cadence_aware_instead_of_uniform():
    subtitles = TTSService._generate_synthetic_timings("Nhanh, rồi dừng. Tiếp tục", 3.0)
    durations = [entry["end_ms"] - entry["start_ms"] for entry in subtitles]
    assert subtitles[-1]["end_ms"] == 3000
    assert durations[2] > durations[-1]


def test_provider_clock_drift_is_scaled_instead_of_collapsing_last_scene():
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(8000)
        wav_file.writeframes(b"\x00\x00" * 16000)

    result = TTSService._finalize_timing(
        {
            "audio_base64": base64.b64encode(wav_buffer.getvalue()).decode("ascii"),
            "duration_seconds": 3.0,
            "subtitle_entries": [
                {"text": "scene", "start_ms": 0, "end_ms": 800},
                {"text": "one", "start_ms": 800, "end_ms": 1500},
                {"text": "scene", "start_ms": 1500, "end_ms": 2300},
                {"text": "two", "start_ms": 2300, "end_ms": 3000},
            ],
            "timing_quality": "word",
        },
        ["scene one", "scene two"],
    )

    assert result["duration_seconds"] == pytest.approx(2.0, abs=0.02)
    assert result["sync_diagnostics"]["timestamp_scale"] == pytest.approx(2 / 3, abs=0.001)
    assert result["scene_segments"][0]["end_ms"] == 1000
    assert result["scene_segments"][1]["end_ms"] == pytest.approx(2000, abs=20)
    assert result["scene_segments"][1]["end_ms"] - result["scene_segments"][1]["start_ms"] >= 900


def test_provider_clock_shorter_than_audio_is_scaled_to_audio_clock():
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(8000)
        wav_file.writeframes(b"\x00\x00" * 16000)

    result = TTSService._finalize_timing(
        {
            "audio_base64": base64.b64encode(wav_buffer.getvalue()).decode("ascii"),
            "duration_seconds": 1.5,
            "subtitle_entries": [
                {"text": "audio", "start_ms": 0, "end_ms": 700},
                {"text": "clock", "start_ms": 700, "end_ms": 1500},
            ],
            "timing_quality": "word",
        },
        ["audio clock"],
    )

    assert result["sync_diagnostics"]["timestamp_scale"] == pytest.approx(4 / 3, abs=0.001)
    assert result["subtitle_entries"][-1]["end_ms"] == pytest.approx(2000, abs=2)


def test_narration_revision_changes_with_script_or_voice_settings():
    baseline = TTSService.narration_revision(["scene one", "scene two"], "voice-a", "+5%", "+0Hz")
    assert baseline == TTSService.narration_revision(["scene   one", "scene two"], "voice-a", "+5%", "+0Hz")
    assert baseline != TTSService.narration_revision(["scene one", "scene changed"], "voice-a", "+5%", "+0Hz")
    assert baseline != TTSService.narration_revision(["scene one", "scene two"], "voice-b", "+5%", "+0Hz")
    assert baseline != TTSService.narration_revision(["scene one", "scene two"], "voice-a", "+15%", "+0Hz")


def test_video_render_rejects_stale_narration_before_rendering():
    revision = TTSService.narration_revision(["original narration"], "voice-a", "+0%", "+0Hz")
    response = client.post("/api/v1/studio/video/render", json={
        "storyboard": {
            "total_duration": 4,
            "aspect_ratio": "9:16",
            "scenes": [{
                "scene_number": 1,
                "title": "Changed",
                "voiceover_text": "changed narration",
                "visual_description": "Test",
                "duration_seconds": 4,
            }],
        },
        "tts_result": {
            "audio_base64": "dGVzdA==",
            "duration_seconds": 4,
            "subtitle_entries": [],
            "voice": "voice-a",
            "rate": "+0%",
            "pitch": "+0Hz",
            "status": "success",
            "narration_revision": revision,
        },
    })
    assert response.status_code == 409
    assert "changed after synthesis" in response.json()["detail"]

def test_synthesize_tts_success():
    payload = {
        "text": "Kiểm thử hệ thống. Giọng đọc AI Hoài My.",
        "scene_texts": ["Kiểm thử hệ thống.", "Giọng đọc AI Hoài My."],
        "voice": "vi-VN-HoaiMyNeural",
        "rate": "+0%"
    }
    res = client.post("/api/v1/studio/tts/synthesize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "audio_base64" in data
    assert "duration_seconds" in data
    assert "subtitle_entries" in data
    assert data["duration_seconds"] > 0
    assert isinstance(data["subtitle_entries"], list)
    assert len(data["scene_segments"]) == 2
    assert data["scene_segments"][-1]["end_ms"] == pytest.approx(data["duration_seconds"] * 1000, abs=2)
    assert len(data["narration_revision"]) == 64
    assert data["actual_provider"] == "edge_tts"

def test_synthesize_tts_empty_validation():
    payload = {
        "text": "   ",
        "voice": "vi-VN-HoaiMyNeural"
    }
    res = client.post("/api/v1/studio/tts/synthesize", json=payload)
    assert res.status_code == 400

def test_generate_scene_image():
    payload = {
        "prompt": "3D glowing AI Agent hologram in cyberpunk laboratory",
        "scene_number": 1
    }
    res = client.post("/api/v1/studio/scene/image", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "image_url" in data
    assert "scene_number" in data
    assert data["scene_number"] == 1
    assert data["provider"] in ("google_imagen_3", "unsplash_curated")

def test_synthesize_google_wavenet():
    payload = {
        "text": "Thử nghiệm giọng đọc Google WaveNet chất lượng cao.",
        "voice": "vi-VN-Wavenet-A",
        "provider": "google_tts"
    }
    res = client.post("/api/v1/studio/tts/synthesize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "audio_base64" in data
    assert "subtitle_entries" in data

def test_synthesize_gemini_2_native_audio():
    payload = {
        "text": "Testing Gemini 2.0 Flash Native Live Audio streaming output.",
        "voice": "gemini-Aoede",
        "provider": "gemini_audio"
    }
    res = client.post("/api/v1/studio/tts/synthesize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "audio_base64" in data
    assert "subtitle_entries" in data
