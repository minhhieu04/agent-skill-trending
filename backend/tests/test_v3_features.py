import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from models.skill import Skill
from models.bundle import SkillBundle

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Ensure test skill exists
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

    bundle = db.query(SkillBundle).first()
    if not bundle:
        bundle = SkillBundle(
            slug="antigravity-data-stack",
            name="Google Antigravity Master Stack",
            title="🪐 Google Antigravity & Data Intelligence Stack",
            description="Complete bundle for building enterprise subagents.",
            icon="Sparkles",
            badge="Google Deepmind",
            category="ai-agent",
            target_stack="Google Antigravity",
            tags=["antigravity", "gemini"],
            skill_ids=[skill.id]
        )
        db.add(bundle)
        db.commit()

    db.close()
    yield

client = TestClient(app)

def test_export_antigravity_format():
    skills_res = client.get("/api/v1/skills/trending")
    assert skills_res.status_code == 200
    skills = skills_res.json()
    assert len(skills) > 0
    first_id = skills[0]["id"]

    res = client.get(f"/api/v1/skills/{first_id}/export/antigravity")
    assert res.status_code == 200
    data = res.json()
    assert data["ide"] == "Google Antigravity"
    assert "SKILL.md" in data["file_name"]
    assert "---" in data["content"]

def test_export_codex_format():
    skills_res = client.get("/api/v1/skills/trending")
    first_id = skills_res.json()[0]["id"]

    res = client.get(f"/api/v1/skills/{first_id}/export/codex")
    assert res.status_code == 200
    data = res.json()
    assert data["ide"] == "OpenAI Codex / Copilot"
    assert "copilot-instructions.md" in data["file_name"]

def test_export_cursor_format():
    skills_res = client.get("/api/v1/skills/trending")
    first_id = skills_res.json()[0]["id"]

    res = client.get(f"/api/v1/skills/{first_id}/export/cursor")
    assert res.status_code == 200
    data = res.json()
    assert data["ide"] == "Cursor"
    assert ".mdc" in data["file_name"]

def test_security_scanner_endpoint():
    skills_res = client.get("/api/v1/skills/trending")
    first_id = skills_res.json()[0]["id"]

    res = client.get(f"/api/v1/skills/{first_id}/security")
    assert res.status_code == 200
    data = res.json()
    assert "security_rating" in data
    assert "security_score" in data
    assert "badge_text" in data
    assert data["security_score"] >= 0

def test_bundles_endpoints():
    res = client.get("/api/v1/bundles")
    assert res.status_code == 200
    bundles = res.json()
    assert len(bundles) > 0
    slug = bundles[0]["slug"]

    # Detail
    detail_res = client.get(f"/api/v1/bundles/{slug}")
    assert detail_res.status_code == 200
    assert detail_res.json()["slug"] == slug

    # Export bundle
    export_res = client.get(f"/api/v1/bundles/{slug}/export/antigravity")
    assert export_res.status_code == 200
    assert "combined_content" in export_res.json()

def test_playground_simulation():
    res = client.post("/api/v1/playground/simulate", json={
        "prompt": "Viết hàm xử lý concurrent trong Golang",
        "target_ide": "antigravity"
    })
    assert res.status_code == 200
    data = res.json()
    assert "before_code" in data
    assert "after_code" in data
    assert len(data["applied_rules"]) > 0
    assert data["latency_ms"] > 0
