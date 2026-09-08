import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app, seed_initial_curated_skills
from database import SessionLocal
from models.skill import Skill


@pytest.fixture(autouse=True)
def setup_db():
    seed_initial_curated_skills()


def test_get_daily_digest_dates():
    with TestClient(app) as client:
        res = client.get("/api/v1/daily-digest/dates")
        assert res.status_code == 200
        data = res.json()
        assert "dates" in data
        assert isinstance(data["dates"], list)
        assert len(data["dates"]) > 0
        first_date = data["dates"][0]
        assert "date" in first_date
        assert "skills_count" in first_date
        assert "has_digest" in first_date


def test_get_or_generate_daily_digest():
    with TestClient(app) as client:
        # First get available dates
        res_dates = client.get("/api/v1/daily-digest/dates")
        date_str = res_dates.json()["dates"][0]["date"]

        # Get daily digest for that date
        res = client.get(f"/api/v1/daily-digest/{date_str}")
        assert res.status_code == 200
        data = res.json()
        assert data["digest_date"] == date_str
        assert "title" in data
        assert "podcast_script" in data
        assert len(data["podcast_script"]) > 20
        assert "highlights" in data
        assert "skill_summaries" in data
        assert len(data["skill_summaries"]) > 0

        # Verify practical value fields in each skill summary
        first_skill = data["skill_summaries"][0]
        assert "what_it_does" in first_skill
        assert "pain_point_solved" in first_skill
        assert "target_audience" in first_skill
        assert "quick_start_prompt" in first_skill
        assert len(first_skill["what_it_does"]) > 10

        # Verify Social Media Post fields
        assert "social_post" in first_skill
        post = first_skill["social_post"]
        assert "hook" in post
        assert len(post["hook"]) > 10
        assert "pain_point_story" in post
        assert "before" in post["pain_point_story"]
        assert "after" in post["pain_point_story"]
        assert "core_mechanism" in post
        assert "key_features" in post
        assert len(post["key_features"]) >= 2
        assert "code_example" in post
        assert "code" in post["code_example"]
        assert "pros_and_cons" in post
        assert "who_should_use" in post
        assert "hashtags" in post
        assert "reactions" in post
        assert post["reactions"]["likes"] > 0


def test_get_skill_social_post_endpoint():
    with TestClient(app) as client:
        res_dates = client.get("/api/v1/daily-digest/dates")
        date_str = res_dates.json()["dates"][0]["date"]

        res_digest = client.get(f"/api/v1/daily-digest/{date_str}")
        assert res_digest.status_code == 200
        digest_data = res_digest.json()
        first_skill = digest_data["skill_summaries"][0]
        skill_id = first_skill["skill_id"]

        # Call endpoint to get social post for this skill
        res_post = client.get(f"/api/v1/daily-digest/{date_str}/skills/{skill_id}/post")
        assert res_post.status_code == 200
        post_data = res_post.json()
        assert post_data["skill_id"] == skill_id
        assert "social_post" in post_data
        assert post_data["social_post"]["skill_id"] == skill_id
        assert len(post_data["social_post"]["hook"]) > 5


def test_domain_analysis_specificity():
    from services.daily_digest_service import DailyDigestService

    # 1. Test Camofox Browser
    s_camo = Skill(
        id=991,
        name="jo-inc/camofox-browser",
        title="Camofox Browser",
        description="Stealth headless browser for AI agents — bypass Cloudflare, bot detection, and anti-scraping. Drop-in Puppeteer/Playwright replacement.",
        category="devtools",
        tags=["trending", "daily"],
        stars=9725
    )
    res_camo = DailyDigestService._analyze_skill_practical_value(s_camo)
    assert "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" not in res_camo["what_it_does"]
    assert "Cloudflare" in res_camo["what_it_does"] or "tàng hình" in res_camo["what_it_does"]
    assert "social_post" in res_camo
    assert "Cloudflare" in res_camo["social_post"]["hook"] or "403" in res_camo["social_post"]["hook"]

    # 2. Test Lightpanda Browser
    s_panda = Skill(
        id=992,
        name="lightpanda-io/browser",
        title="Browser",
        description="Lightpanda: the headless browser designed for AI and automation",
        category="workflow-automation",
        tags=["trending", "daily"],
        stars=34862
    )
    res_panda = DailyDigestService._analyze_skill_practical_value(s_panda)
    assert "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" not in res_panda["what_it_does"]
    assert "Zig" in res_panda["what_it_does"] or "RAM" in res_panda["what_it_does"] or "Headless" in res_panda["what_it_does"]
    assert "RAM" in res_panda["social_post"]["hook"] or "Zig" in res_panda["social_post"]["hook"]

    # 3. Test Hyperframes
    s_hyper = Skill(
        id=993,
        name="heygen-com/hyperframes",
        title="Hyperframes",
        description="Write HTML. Render video. Built for agents.",
        category="devtools",
        tags=["trending", "daily"],
        stars=45980
    )
    res_hyper = DailyDigestService._analyze_skill_practical_value(s_hyper)
    assert "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" not in res_hyper["what_it_does"]
    assert "HTML" in res_hyper["what_it_does"] or "video" in res_hyper["what_it_does"]
    assert "HTML" in res_hyper["social_post"]["hook"] or "video" in res_hyper["social_post"]["hook"]

    # 4. Test Context-Mode
    s_ctx = Skill(
        id=994,
        name="mksglu/context-mode",
        title="Context Mode",
        description="Context window optimization for AI coding agents. Sandboxes tool output (98% reduction), persists session memory.",
        category="mcp-server",
        tags=["trending", "daily"],
        stars=20847
    )
    res_ctx = DailyDigestService._analyze_skill_practical_value(s_ctx)
    assert "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" not in res_ctx["what_it_does"]
    assert "token" in res_ctx["what_it_does"] or "Context" in res_ctx["what_it_does"]
    assert "token" in res_ctx["social_post"]["hook"]

    # 5. Test Google Agent Skills
    s_google = Skill(
        id=995,
        name="google/skills",
        title="Google Agent Skills",
        description="Official Google agent skill harness for autonomous subagents and Antigravity.",
        category="coding-agent",
        tags=["agent", "google", "deepmind"],
        stars=12500
    )
    res_google = DailyDigestService._analyze_skill_practical_value(s_google)
    assert "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" not in res_google["what_it_does"]
    assert "Google" in res_google["what_it_does"] or "Google" in res_google["social_post"]["hook"]
    assert "google/skills" in res_google["social_post"]["code_example"]["code"]

    # 6. Test Codex Prompt Standards
    s_codex = Skill(
        id=996,
        name="openai/codex-prompt-standards",
        title="Codex Prompt Standards",
        description="Repository instructions and prompt standards for OpenAI Codex and GitHub Copilot CLI.",
        category="devtools",
        tags=["prompt", "codex", "copilot"],
        stars=8200
    )
    res_codex = DailyDigestService._analyze_skill_practical_value(s_codex)
    assert "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" not in res_codex["what_it_does"]
    assert "Copilot" in res_codex["social_post"]["hook"] or "Codex" in res_codex["social_post"]["hook"]
    assert "copilot-instructions.md" in res_codex["social_post"]["code_example"]["filename"]

    # 7. Test Generic Skill with Dynamic Readme Code Extraction & Comparison Notes
    s_custom = Skill(
        id=997,
        name="acme/pgvector-agent",
        title="PGVector Agent",
        description="High performance pgvector agent pipeline for Postgres.",
        category="database",
        primary_language="Python",
        stars=1500,
        tags=["postgres", "vector"],
        readme_preview="```python\nimport pgvector\nclient = pgvector.connect()\nclient.query('embedding')\n```",
        use_cases=["Tự động hóa indexing vector", "Tìm kiếm tương đồng ngữ nghĩa"],
        comparison_notes="Trước đây dev phải tự viết query SQL phức tạp, giờ đây thư viện tự động optimize HNSW index."
    )
    res_custom = DailyDigestService._analyze_skill_practical_value(s_custom)
    assert "Tối ưu hóa và tự động hóa quy trình phát triển liên quan đến" not in res_custom["what_it_does"]
    assert "HNSW index" in res_custom["pain_point_solved"]
    assert "import pgvector" in res_custom["social_post"]["code_example"]["code"]
    assert res_custom["social_post"]["code_example"]["language"] == "python"
    assert "Đừng bỏ lỡ công cụ" not in str(res_custom)
    assert "Khởi động trải nghiệm" not in str(res_custom)


def test_regenerate_daily_digest():
    with TestClient(app) as client:
        res_dates = client.get("/api/v1/daily-digest/dates")
        date_str = res_dates.json()["dates"][0]["date"]

        res = client.post(f"/api/v1/daily-digest/{date_str}/generate", json={"language": "vi"})
        assert res.status_code == 200
        data = res.json()
        assert data["digest_date"] == date_str
        assert "title" in data
        assert "skill_summaries" in data


@pytest.mark.asyncio
async def test_synthesize_podcast_audio():
    with patch("services.tts_service.TTSService.synthesize", new_callable=AsyncMock) as mock_tts:
        mock_tts.return_value = {
            "audio_base64": "UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
            "duration_seconds": 35.5,
            "voice": "vi-VN-NamMinhNeural",
            "status": "success"
        }

        with TestClient(app) as client:
            res_dates = client.get("/api/v1/daily-digest/dates")
            date_str = res_dates.json()["dates"][0]["date"]

            res = client.post(
                f"/api/v1/daily-digest/{date_str}/audio",
                json={"voice": "vi-VN-NamMinhNeural", "force_regenerate": True}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["date"] == date_str
            assert data["audio_base64"] != ""
            assert data["duration_seconds"] > 0


def test_get_podcast_voices():
    with TestClient(app) as client:
        res = client.get("/api/v1/daily-digest/voices")
        assert res.status_code == 200
        data = res.json()
        assert "voices" in data
        voices = data["voices"]
        assert len(voices) >= 10
        voice_ids = [v["id"] for v in voices]
        assert "vi-VN-NamMinhNeural" in voice_ids
        assert "vi-VN-HoaiMyNeural" in voice_ids
        assert "gemini-Aoede" in voice_ids
        assert "gemini-Puck" in voice_ids
        assert "en-US-Journey-F" in voice_ids
        providers = {v["provider"] for v in voices}
        assert "edge_tts" in providers
        assert "gemini_audio" in providers
        assert "google_tts" in providers


@pytest.mark.asyncio
async def test_stream_podcast_audio():
    with patch("services.tts_service.TTSService.synthesize", new_callable=AsyncMock) as mock_tts:
        mock_tts.return_value = {
            "audio_base64": "UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
            "duration_seconds": 35.5,
            "voice": "gemini-Puck",
            "status": "success"
        }

        with TestClient(app) as client:
            res_dates = client.get("/api/v1/daily-digest/dates")
            date_str = res_dates.json()["dates"][0]["date"]

            res = client.get(
                f"/api/v1/daily-digest/{date_str}/audio-stream?voice=gemini-Puck&force=true"
            )
            assert res.status_code == 200
            assert res.headers["content-type"] in ["audio/wav", "audio/mpeg"]
            assert len(res.content) > 0


