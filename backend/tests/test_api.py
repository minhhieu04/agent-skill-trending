import pytest
from fastapi.testclient import TestClient
from main import app, seed_initial_curated_skills

@pytest.fixture(autouse=True)
def setup_db():
    seed_initial_curated_skills()

def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "Agent Skill Trending" in response.json()["message"]

def test_get_trending_skills():
    with TestClient(app) as client:
        response = client.get("/api/v1/skills/trending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

def test_get_categories():
    with TestClient(app) as client:
        response = client.get("/api/v1/skills/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        keys = [c["key"] for c in data]
        assert "coding-agent" in keys
        assert "mcp-server" in keys

def test_get_and_update_preferences():
    with TestClient(app) as client:
        # GET
        res_get = client.get("/api/v1/preferences")
        assert res_get.status_code == 200
        current_pref = res_get.json()
        assert "preferred_categories" in current_pref

        # PUT
        update_data = {
            "user_name": "Hiếu",
            "preferred_categories": ["coding-agent", "mcp-server"],
            "preferred_languages": ["Python", "TypeScript"],
            "preferred_runtimes": ["Claude Code", "Cursor"],
            "interested_tags": ["mcp", "agent"],
            "min_stars": 100,
            "min_trending_score": 30,
            "only_recent_activity_days": 60
        }
        res_put = client.put("/api/v1/preferences", json=update_data)
        assert res_put.status_code == 200
        updated = res_put.json()
        assert updated["min_stars"] == 100
