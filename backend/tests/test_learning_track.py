import pytest
from fastapi.testclient import TestClient
from main import app

def test_ai_recommend_track_endpoint():
    with TestClient(app) as client:
        # 1. Test with Vietnamese frontend goal
        res = client.post("/api/v1/skills/ai-recommend-track", json={
            "goal_query": "Tôi muốn học frontend với React và Next.js",
            "language": "vi",
            "max_skills": 6
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["roadmap"]) >= 3
        assert isinstance(data["recommended_skills"], list)
        assert len(data["ai_tips"]) > 0
        assert "React" in str(data["target_technologies"]) or "Next" in str(data["target_technologies"]) or "Frontend" in data["summary"]

        # 2. Test with Golang goal
        res_go = client.post("/api/v1/skills/ai-recommend-track", json={
            "goal_query": "Tối ưu hóa hiệu năng và backend bằng Golang",
            "language": "vi"
        })
        assert res_go.status_code == 200
        data_go = res_go.json()
        assert data_go["success"] is True
        assert len(data_go["roadmap"]) >= 3
