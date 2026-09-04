import pytest
import uuid
from fastapi.testclient import TestClient
from main import app, seed_initial_curated_skills

@pytest.fixture(autouse=True)
def setup_db():
    seed_initial_curated_skills()

def test_auth_flow():
    unique_user = f"user_{uuid.uuid4().hex[:6]}"
    with TestClient(app) as client:
        # Register new user
        reg_res = client.post("/api/v1/auth/register", json={
            "username": unique_user,
            "password": "testpassword123",
            "display_name": "Teammate Test"
        })
        assert reg_res.status_code == 200
        data = reg_res.json()
        assert "access_token" in data
        assert data["user"]["username"] == unique_user
        token = data["access_token"]

        # Test /me with token
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["username"] == unique_user

        # Login with correct password
        login_res = client.post("/api/v1/auth/login", json={
            "username": unique_user,
            "password": "testpassword123"
        })
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

        # Login with wrong password
        fail_login = client.post("/api/v1/auth/login", json={
            "username": unique_user,
            "password": "wrongpassword"
        })
        assert fail_login.status_code == 401

def test_history_and_audit_logs():
    with TestClient(app) as client:
        # Get collection runs
        runs_res = client.get("/api/v1/history/runs")
        assert runs_res.status_code == 200
        runs = runs_res.json()
        assert isinstance(runs, list)

        # Get audit logs
        audit_res = client.get("/api/v1/history/audit-log")
        assert audit_res.status_code == 200
        audits = audit_res.json()
        assert isinstance(audits, list)


def test_skills_compare():
    with TestClient(app) as client:
        skills_res = client.get("/api/v1/skills/trending?limit=10")
        skills = skills_res.json()
        if len(skills) < 2:
            from database import SessionLocal
            from models.skill import Skill
            db = SessionLocal()
            for i in range(2):
                db.add(Skill(
                    name=f"test/skill-{i}-{uuid.uuid4().hex[:4]}",
                    title=f"Test Skill {i}",
                    repository_url=f"https://github.com/test/skill-{i}-{uuid.uuid4().hex[:4]}",
                    use_cases=["Test Case 1"],
                    comparison_notes="Notes",
                    trending_score=90.0 + i
                ))
            db.commit()
            db.close()
            skills_res = client.get("/api/v1/skills/trending?limit=10")
            skills = skills_res.json()

        assert len(skills) >= 2
        ids = [skills[0]["id"], skills[1]["id"]]

        # Compare them
        comp_res = client.post("/api/v1/skills/compare", json={"skill_ids": ids})
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert len(comp_data) == 2
        assert "use_cases" in comp_data[0]
        assert "comparison_notes" in comp_data[0]
