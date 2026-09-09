import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, seed_initial_curated_skills
from database import SessionLocal
from models.skill import Skill
from models.user import User
from models.agent_chat import ChatSession, ChatMessage
from services.agent_chat_service import AgentChatService
from middleware.auth import create_access_token, hash_password

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


@pytest.fixture
def auth_client():
    """Provides a TestClient pre-configured with a valid user Authorization Bearer token."""
    db = SessionLocal()
    user = db.query(User).filter(User.username == "test_chat_user").first()
    if not user:
        user = User(
            username="test_chat_user",
            display_name="Chat Tester",
            password_hash=hash_password("secret123"),
            is_admin=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.username})
    db.close()

    with TestClient(app) as client:
        client.headers.update({"Authorization": f"Bearer {token}"})
        yield client


def test_get_chat_suggestions():
    """Suggestions endpoint is public so visitors can see quick-start prompt chips."""
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


def test_agent_chat_unauthenticated_returns_401():
    """Agent Chat endpoints require authentication; calling without token must return 401."""
    with TestClient(app) as client:
        payload = {
            "query": "Tôi muốn học Golang",
            "language": "vi"
        }
        res = client.post("/api/v1/agent-chat/message", json=payload)
        assert res.status_code == 401

        res_sessions = client.get("/api/v1/agent-chat/sessions")
        assert res_sessions.status_code == 401


def test_chat_with_agent_golang_query(auth_client):
    payload = {
        "query": "Tôi đang gặp vấn đề rò rỉ goroutine và race condition trong Go microservices.",
        "language": "vi",
        "history": []
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is True
    assert "session_id" in data
    assert len(data["message"]) > 50
    assert isinstance(data["recommended_skills"], list)
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


def test_chat_with_agent_nextjs_query(auth_client):
    payload = {
        "query": "Tôi cần phát triển web fullstack bằng Next.js 15 App Router và Server Actions có Zod validation",
        "language": "vi"
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
    assert any("nextjs" in name.lower() for name in skill_names)


def test_chat_with_agent_antigravity_query(auth_client):
    payload = {
        "query": "Làm thế nào để tạo autonomous subagents và file SKILL.md chuẩn cho Google Antigravity?",
        "language": "vi"
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
    assert any("google/skills" in name or "agent" in name.lower() for name in skill_names)


def test_chat_with_agent_uiux_query(auth_client):
    payload = {
        "query": "Thiết kế hệ thống design system, responsive UI và Tailwind CSS dark mode cho SaaS",
        "language": "vi"
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
    assert any("ui-ux" in name.lower() or "design" in name.lower() for name in skill_names)


def test_chat_with_agent_short_uiux_query(auth_client):
    payload = {
        "query": "UI UX",
        "language": "vi"
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    top_skill = data["recommended_skills"][0]
    assert "ui-ux" in top_skill["skill"]["name"].lower() or "design" in top_skill["skill"]["name"].lower()


def test_chat_with_agent_security_vietnamese_diacritics(auth_client):
    payload = {
        "query": "Tôi muốn kiểm tra bảo mật, quét mã độc và sandbox cho MCP servers",
        "language": "vi"
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    skill_names = [item["skill"]["name"] for item in data["recommended_skills"]]
    assert any("security" in name.lower() or "sandbox" in name.lower() or "mcp" in name.lower() for name in skill_names)


def test_chat_with_agent_english_bilingual_reasons(auth_client):
    payload = {
        "query": "How to build microservices in Golang with high concurrency?",
        "language": "en"
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    first_rec = data["recommended_skills"][0]
    assert len(first_rec["match_reasons"]) > 0
    assert any("goroutine" in r.lower() or "go" in r.lower() or "uber" in r.lower() for r in first_rec["match_reasons"])


def test_chat_with_agent_multi_turn_history(auth_client):
    payload_turn1 = {
        "query": "Tôi muốn làm ứng dụng Next.js",
        "language": "vi",
        "history": []
    }
    res1 = auth_client.post("/api/v1/agent-chat/message", json=payload_turn1)
    assert res1.status_code == 200
    sess_id = res1.json()["session_id"]

    payload_turn2 = {
        "session_id": sess_id,
        "query": "Còn về phần kiểm thử và tối ưu SEO thì cấu hình như thế nào?",
        "language": "vi",
        "history": [
            {"role": "user", "content": "Tôi muốn làm ứng dụng Next.js"},
            {"role": "assistant", "content": "Nên dùng nextjs-agent-rules cho App Router."}
        ]
    }
    res2 = auth_client.post("/api/v1/agent-chat/message", json=payload_turn2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    assert data2["session_id"] == sess_id


def test_chat_with_agent_database_persistence_and_crud(auth_client):
    """Verify that messages and sessions are correctly persisted in DB and can be retrieved, updated, and deleted."""
    # 1. Send first message
    query_text = "Tối ưu hóa performance database PostgreSQL và indexing"
    res1 = auth_client.post("/api/v1/agent-chat/message", json={
        "query": query_text,
        "language": "vi"
    })
    assert res1.status_code == 200
    data1 = res1.json()
    session_id = data1["session_id"]
    assert session_id.startswith("session-")

    # 2. Check DB directly for session and messages
    db = SessionLocal()
    try:
        db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        assert db_session is not None
        assert db_session.user_id is not None
        assert len(db_session.messages) == 2  # 1 user + 1 assistant
        user_m = db_session.messages[0]
        asst_m = db_session.messages[1]
        assert user_m.role == "user"
        assert user_m.content == query_text
        assert asst_m.role == "assistant"
        assert len(asst_m.recommended_skills) > 0
    finally:
        db.close()

    # 3. GET /sessions API
    res_list = auth_client.get("/api/v1/agent-chat/sessions")
    assert res_list.status_code == 200
    sessions_data = res_list.json()
    assert any(s["id"] == session_id for s in sessions_data)

    # 4. GET /sessions/{id} API
    res_detail = auth_client.get(f"/api/v1/agent-chat/sessions/{session_id}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert detail_data["id"] == session_id
    assert len(detail_data["messages"]) == 2

    # 5. PATCH /sessions/{id} rename API
    new_title = "Tiêu đề mới tối ưu DB"
    res_patch = auth_client.patch(f"/api/v1/agent-chat/sessions/{session_id}", json={"title": new_title})
    assert res_patch.status_code == 200
    assert res_patch.json()["title"] == new_title

    # 6. DELETE /sessions/{id} API
    res_del = auth_client.delete(f"/api/v1/agent-chat/sessions/{session_id}")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True

    # 7. Verify deletion in DB
    db = SessionLocal()
    try:
        deleted_sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        assert deleted_sess is None
        # Messages should be cascade deleted
        remaining_msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
        assert len(remaining_msgs) == 0
    finally:
        db.close()


def test_chat_with_agent_offtopic_query(auth_client):
    payload = {
        "query": "Thời tiết hôm nay thế nào?",
        "language": "vi"
    }
    res = auth_client.post("/api/v1/agent-chat/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["recommended_skills"]) >= 2
    first_rec = data["recommended_skills"][0]
    assert first_rec["relevance_score"] <= 75.0


def test_local_rag_fallback_when_gemini_fails():
    """Verify that when Gemini raises an exception, the system gracefully falls back to local RAG synthesis."""
    db = SessionLocal()
    try:
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
