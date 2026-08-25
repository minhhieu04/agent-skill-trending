import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from models.skill import Skill

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    skill = db.query(Skill).first()
    if not skill:
        skill = Skill(
            name="google-deepmind/antigravity-agent-skills",
            title="Google Antigravity Customizations",
            repository_url="https://github.com/google-deepmind/antigravity-agent-skills",
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

def test_synthesize_tts_success():
    payload = {
        "text": "Kiểm thử hệ thống giọng đọc AI Hoài My.",
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
    assert data["provider"] == "google_imagen_3"

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

