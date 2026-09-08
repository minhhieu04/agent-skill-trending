import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, seed_initial_curated_skills
from database import SessionLocal
from models.skill import Skill
from services.agent_chat_service import AgentChatService

_db_seeded = False

@pytest.fixture(autouse=True)
def setup_db():
    global _db_seeded
    if not _db_seeded:
        seed_initial_curated_skills()
        _db_seeded = True


@pytest.fixture(autouse=True)
def mock_gemini_client():
    """Mock external Gemini API call in unit tests to ensure fast, deterministic, offline-capable execution."""
    mock_response = MagicMock()
    mock_response.text = (
        "### 1. 🎯 Phân tích chuyên sâu từ Cố vấn AI\n\n"
        "Tôi đã rà soát toàn bộ cơ sở dữ liệu và chọn lọc những kỹ năng chuẩn mực nhất cho bài toán của bạn:\n"
        "- **Lý do cốt lõi:** Đáp ứng chính xác yêu cầu kỹ thuật và loại bỏ rủi ro phổ biến.\n"
        "- **Mẹo thực chiến:** Cài đặt trực tiếp vào agent harness và kiểm thử với các case biên.\n\n"
        "### Câu hỏi gợi ý tiếp theo:\n"
        "- Làm sao để tích hợp skill này vào Google Antigravity?\n"
        "- Cho tôi xem ví dụ áp dụng thực tế."
    )
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("google.genai.Client", return_value=mock_client):
        yield mock_client


def test_get_chat_suggestions():
    with TestClient(app) as client:
        # Vietnamese suggestions
        res_vi = client.get("/api/v1/agent-chat/suggestions?language=vi")
        assert res_vi.status_code == 200
        data_vi = res_vi.json()
        assert isinstance(data_vi, list)
        assert len(data_vi) >= 4
        assert any("Golang" in item["title"] or "Go" in item["title"] for item in data_vi)

        # English suggestions
        res_en = client.get("/api/v1/agent-chat/suggestions?language=en")
        assert res_en.status_code == 200
        data_en = res_en.json()
        assert isinstance(data_en, list)
        assert len(data_en) >= 4
        assert any("Golang" in item["title"] for item in data_en)


def test_chat_with_agent_golang_query():
    with TestClient(app) as client:
        payload = {
            "query": "Tôi đang gặp vấn đề rò rỉ goroutine và race condition trong Go microservices.",
            "language": "vi",
            "history": []
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["success"] is True
        assert len(data["message"]) > 50
        assert isinstance(data["recommended_skills"], list)
        # Should be focused recommendations (2 to 4 skills to prevent information overload)
        assert 2 <= len(data["recommended_skills"]) <= 4

        # Verify Golang skill is selected
        skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
        assert any("go" in name.lower() for name in skill_names)

        first_rec = data["recommended_skills"][0]
        assert "skill" in first_rec
        assert "relevance_score" in first_rec
        assert first_rec["relevance_score"] >= 80.0
        assert len(first_rec["match_reasons"]) > 0
        assert any("goroutine" in r.lower() or "go" in r.lower() for r in first_rec["match_reasons"])
        assert first_rec["quick_tip"] is not None

        assert data["retrieval_stats"]["total_skills_scanned"] > 0
        assert len(data["suggested_followups"]) > 0


def test_chat_with_agent_nextjs_query():
    with TestClient(app) as client:
        payload = {
            "query": "Tôi cần phát triển web fullstack bằng Next.js 15 App Router và Server Actions có Zod validation",
            "language": "vi"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
        assert any("nextjs" in name.lower() for name in skill_names)


def test_chat_with_agent_antigravity_query():
    with TestClient(app) as client:
        payload = {
            "query": "Làm thế nào để tạo autonomous subagents và file SKILL.md chuẩn cho Google Antigravity?",
            "language": "vi"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
        assert any("google" in name.lower() or "antigravity" in name.lower() for name in skill_names)


def test_chat_with_agent_uiux_query():
    with TestClient(app) as client:
        payload = {
            "query": "Tôi muốn cải thiện giao diện web, cần AI tuân theo chuẩn WCAG 2.1 và Tailwind CSS tokens",
            "language": "vi"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
        assert any("design" in name.lower() or "uiux" in name.lower() or "ui-ux" in name.lower() or "ui" in name.lower() for name in skill_names)


def test_chat_with_agent_security_vietnamese_diacritics():
    """Verify that Vietnamese queries with diacritics correctly retrieve security/cybersecurity skills."""
    with TestClient(app) as client:
        payload = {
            "query": "Tôi muốn tìm skill bảo mật và quét lỗi sandbox cho agent",
            "language": "vi"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        recommended = data["recommended_skills"]
        assert len(recommended) >= 1

        # Must match security / audit / scan / sandbox skills across name, title, category, or tags
        has_security_skill = any(
            any(k in item["skill"]["name"].lower() or 
                k in item["skill"]["title"].lower() or 
                k in str(item["skill"].get("category", "")).lower() or
                k in str(item["skill"].get("tags", [])).lower()
                for k in ["security", "cyber", "scan", "audit", "sandbox", "guardrail", "bảo mật"])
            for item in recommended
        )
        assert has_security_skill
        first_rec = recommended[0]
        reasons_text = " ".join(first_rec.get("match_reasons", [])).lower()
        assert any(w in reasons_text for w in ["bảo mật", "sandbox", "injection", "an toàn", "security", "quyền"])


def test_chat_with_agent_english_bilingual_reasons():
    """Verify that English queries receive English match reasons and quick tips."""
    with TestClient(app) as client:
        payload = {
            "query": "I am looking for skills to audit agent security and prevent command injection.",
            "language": "en"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["message"]) > 20
        assert len(data["recommended_skills"]) >= 2

        first_rec = data["recommended_skills"][0]
        # Match reasons must be in English
        reasons_text = " ".join(first_rec["match_reasons"]).lower()
        assert any(word in reasons_text for word in ["security", "permission", "guardrail", "prevent", "audit"])
        # Quick tip must be in English
        assert any(word in first_rec["quick_tip"].lower() for word in ["run", "review", "audit", "declare", "place", "use", "install"])


def test_chat_with_agent_multi_turn_history():
    with TestClient(app) as client:
        payload = {
            "query": "Tôi muốn giải thích chi tiết hơn về cách phòng chống goroutine leak với table-driven tests.",
            "history": [
                {
                    "role": "user",
                    "content": "Tôi đang viết Go backend microservices."
                },
                {
                    "role": "assistant",
                    "content": "Bạn nên sử dụng golang-standards/go-agent-skill để áp dụng chuẩn Uber Go Style Guide."
                }
            ],
            "language": "vi"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["recommended_skills"]) >= 2


def test_chat_with_agent_null_safety():
    """Verify that skills with null quality_score, stars, or use_cases do not cause TypeError in reasons formatting."""
    db = SessionLocal()
    try:
        # Create a temporary skill with null metrics
        test_skill = Skill(
            name="test-org/null-metric-skill",
            title="Null Metric Skill Test",
            repository_url="https://github.com/test-org/null-metric-skill",
            quality_score=None,
            stars=None,
            use_cases=None,
            category="testing",
            primary_language="Python"
        )
        db.add(test_skill)
        db.commit()

        reasons_vi = AgentChatService._generate_match_reasons(test_skill, "test query", ["test"], language="vi")
        reasons_en = AgentChatService._generate_match_reasons(test_skill, "test query", ["test"], language="en")
        tip_vi = AgentChatService._generate_quick_tip(test_skill, language="vi")
        tip_en = AgentChatService._generate_quick_tip(test_skill, language="en")

        assert len(reasons_vi) > 0
        assert len(reasons_en) > 0
        assert isinstance(tip_vi, str)
        assert isinstance(tip_en, str)

        db.delete(test_skill)
        db.commit()
    finally:
        db.close()


def test_chat_with_agent_offtopic_query():
    """Verify that off-topic query gracefully returns foundational recommendations without crashing."""
    with TestClient(app) as client:
        payload = {
            "query": "Thời tiết hôm nay thế nào?",
            "language": "vi"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["recommended_skills"]) >= 2
        # Fallback recommendations should have modest relevance scores, not inflated 99%
        first_rec = data["recommended_skills"][0]
        assert first_rec["relevance_score"] <= 75.0


def test_local_rag_fallback_when_gemini_fails():
    """Verify that when Gemini raises an exception, the system gracefully falls back to local RAG synthesis."""
    db = SessionLocal()
    try:
        # Mock Gemini Client to raise ResourceExhausted (429)
        with patch("google.genai.Client") as mock_cls:
            mock_inst = MagicMock()
            mock_inst.models.generate_content.side_effect = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")
            mock_cls.return_value = mock_inst

            import asyncio
            result = asyncio.run(AgentChatService.chat(
                db=db,
                query="Tối ưu concurrency trong Golang",
                language="vi"
            ))

            assert result["success"] is True
            assert result["is_ai_powered"] is False
            assert result["model_used"] == "rag-semantic-engine"
            assert "RAG" in result["message"]
            assert len(result["recommended_skills"]) >= 2
    finally:
        db.close()
