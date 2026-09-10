import uuid
import jwt
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, AsyncMock
import pytest
from fastapi.testclient import TestClient

from main import app, seed_initial_curated_skills
from database import SessionLocal
from models.user import User
from middleware.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from config import settings

@pytest.fixture(autouse=True)
def setup_db():
    seed_initial_curated_skills()

def test_register_and_login_success():
    uname = f"usr_{uuid.uuid4().hex[:8]}"
    pwd = "SecurePassword123!"
    with TestClient(app) as client:
        # Register
        reg_res = client.post("/api/v1/auth/register", json={
            "username": uname,
            "password": pwd,
            "display_name": "Test Account"
        })
        assert reg_res.status_code == 200
        data = reg_res.json()
        assert "access_token" in data
        assert data["user"]["username"] == uname
        assert data["user"]["is_admin"] is False  # Non-first user is non-admin

        # Login
        login_res = client.post("/api/v1/auth/login", json={
            "username": uname,
            "password": pwd
        })
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

def test_register_validations():
    with TestClient(app) as client:
        # 1. Short password (< 8 chars)
        res_short = client.post("/api/v1/auth/register", json={
            "username": f"u_{uuid.uuid4().hex[:6]}",
            "password": "123"
        })
        assert res_short.status_code in [400, 422]

        # 2. Invalid username characters
        res_invalid_uname = client.post("/api/v1/auth/register", json={
            "username": "bad user name!@#",
            "password": "ValidPassword123!"
        })
        assert res_invalid_uname.status_code in [400, 422]

        # 3. Duplicate username
        u_dup = f"dup_{uuid.uuid4().hex[:6]}"
        res_first = client.post("/api/v1/auth/register", json={
            "username": u_dup,
            "password": "ValidPassword123!"
        })
        assert res_first.status_code == 200

        res_second = client.post("/api/v1/auth/register", json={
            "username": u_dup,
            "password": "ValidPassword123!"
        })
        assert res_second.status_code == 400
        assert "already exists" in res_second.json()["detail"].lower()

def test_vietnamese_password_bcrypt_72_bytes():
    with TestClient(app) as client:
        # Valid Vietnamese diacritics password (< 72 bytes)
        vi_pwd = "MậtKhẩuTiếngViệt2026!"
        assert len(vi_pwd.encode("utf-8")) < 72
        uname = f"vi_{uuid.uuid4().hex[:6]}"
        reg_res = client.post("/api/v1/auth/register", json={
            "username": uname,
            "password": vi_pwd,
            "display_name": "Người Dùng Việt"
        })
        assert reg_res.status_code == 200

        # Login with Vietnamese password
        login_res = client.post("/api/v1/auth/login", json={
            "username": uname,
            "password": vi_pwd
        })
        assert login_res.status_code == 200

        # Password exceeding 72 bytes in UTF-8
        long_vi_pwd = "MậtKhẩuSiêuBảoMậtCựcKỳDàiVàPhứcTạpChoHệThốngAgentTrending2026ToànCầuPhátTriển"
        assert len(long_vi_pwd.encode("utf-8")) > 72
        long_uname = f"lng_{uuid.uuid4().hex[:6]}"
        res_long = client.post("/api/v1/auth/register", json={
            "username": long_uname,
            "password": long_vi_pwd
        })
        assert res_long.status_code in [400, 422]

        # Login with > 72 bytes password should return 401 without crashing 500
        res_fail = client.post("/api/v1/auth/login", json={
            "username": uname,
            "password": long_vi_pwd
        })
        assert res_fail.status_code == 401

def test_login_timing_attack_protection():
    with TestClient(app) as client:
        # Non-existent user should return 401 after verifying against dummy hash
        res_ghost = client.post("/api/v1/auth/login", json={
            "username": "ghost_user_that_does_not_exist_999",
            "password": "SomeRandomPassword123!"
        })
        assert res_ghost.status_code == 401
        assert "không chính xác" in res_ghost.json()["detail"]

def test_token_expiration_and_require_exp():
    # 1. Valid token with exp
    valid_token = create_access_token({"sub": "testuser", "id": 10}, expires_delta=timedelta(minutes=30))
    payload = decode_access_token(valid_token)
    assert payload is not None
    assert payload["sub"] == "testuser"
    assert "exp" in payload

    # 2. Expired token
    expired_token = create_access_token({"sub": "testuser", "id": 10}, expires_delta=timedelta(minutes=-10))
    assert decode_access_token(expired_token) is None

    # 3. Token missing 'exp' field entirely
    token_no_exp = jwt.encode({"sub": "testuser", "id": 10}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    # decode_access_token requires 'exp', so it must reject
    assert decode_access_token(token_no_exp) is None

def test_admin_rbac_permissions():
    with TestClient(app) as client:
        # Register regular user (non-admin)
        reg_uname = f"reg_{uuid.uuid4().hex[:6]}"
        client.post("/api/v1/auth/register", json={
            "username": reg_uname,
            "password": "Password123!"
        })
        db = SessionLocal()
        user_reg = db.query(User).filter(User.username == reg_uname).first()
        admin_user = db.query(User).filter(User.username == "hieu").first()
        db.close()

        reg_token = create_access_token({"sub": user_reg.username, "id": user_reg.id})
        admin_token = create_access_token({"sub": admin_user.username, "id": admin_user.id})

        reg_headers = {"Authorization": f"Bearer {reg_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. /auth/users
        assert client.get("/api/v1/auth/users", headers=reg_headers).status_code == 403
        assert client.get("/api/v1/auth/users", headers=admin_headers).status_code == 200

        # 2. /history/audit-log: non-admin gets 200 (own activity); peeking at other user_id gets 403
        assert client.get("/api/v1/history/audit-log", headers=reg_headers).status_code == 200
        assert client.get(f"/api/v1/history/audit-log?user_id={admin_user.id}", headers=reg_headers).status_code == 403
        assert client.get("/api/v1/history/audit-log", headers=admin_headers).status_code == 200

        # 3. /collect/trigger (mock pipeline to ensure fast, offline execution)
        with patch("api.collect.run_full_collection_pipeline"):
            assert client.post("/api/v1/collect/trigger", headers=reg_headers).status_code == 403
            trigger_admin = client.post("/api/v1/collect/trigger", headers=admin_headers)
            # 200 (launched) or 400 (already in progress) are both valid admin responses
            assert trigger_admin.status_code in [200, 400]

def test_protected_heavy_endpoints_require_auth():
    with TestClient(app) as client:
        # 1. /studio/video/render without auth -> 401
        res_render = client.post("/api/v1/studio/video/render", json={
            "storyboard": {"total_duration": 4, "aspect_ratio": "9:16", "scenes": []},
            "tts_result": {"audio_base64": "abc"}
        })
        assert res_render.status_code == 401

        # 2. /daily-digest/{date}/generate without auth -> 401
        res_gen = client.post("/api/v1/daily-digest/today/generate", json={"language": "vi"})
        assert res_gen.status_code == 401

        # 3. /daily-digest/{date}/audio without auth -> 401
        res_aud = client.post("/api/v1/daily-digest/today/audio", json={"voice": "test"})
        assert res_aud.status_code == 401

        # 4. /playground/simulate without auth -> 401
        res_sim = client.post("/api/v1/playground/simulate", json={"prompt": "test"})
        assert res_sim.status_code == 401

        # 5. /skills/{id}/bookmark without auth -> 401
        res_bm = client.post("/api/v1/skills/1/bookmark")
        assert res_bm.status_code == 401

def test_agent_chat_cross_user_session_isolation():
    db = SessionLocal()
    u1 = db.query(User).filter(User.username == "hieu").first()
    u2 = db.query(User).filter(User.username == "developer").first()
    db.close()

    t1 = create_access_token({"sub": u1.username, "id": u1.id})
    t2 = create_access_token({"sub": u2.username, "id": u2.id})

    h1 = {"Authorization": f"Bearer {t1}"}
    h2 = {"Authorization": f"Bearer {t2}"}

    with patch("services.agent_chat_service.AgentChatService.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = {
            "message": "Phản hồi mẫu cho test.",
            "recommended_skills": [],
            "suggested_followups": [],
            "retrieval_stats": {"total_skills_scanned": 1, "candidates_matched": 1, "top_selected": 0},
            "model_used": "mock-gemini",
            "is_ai_powered": True
        }
        with TestClient(app) as client:
            # User 1 creates a session
            sess_res = client.post("/api/v1/agent-chat/sessions", json={"title": "User 1 Chat"}, headers=h1)
            assert sess_res.status_code == 200
            u1_session_id = sess_res.json()["id"]

            # User 2 sends a message referencing User 1's session_id
            # Must NOT crash HTTP 500 (IntegrityError), but safely handle it
            chat_res = client.post("/api/v1/agent-chat/message", json={
                "query": "Hello from user 2",
                "session_id": u1_session_id
            }, headers=h2)
            assert chat_res.status_code == 200
            data = chat_res.json()
            assert data["success"] is True
            # Returned session must belong to User 2 (not clashing or overwriting User 1's session)
            assert data["session_id"] != u1_session_id
