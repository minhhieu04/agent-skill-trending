import pytest
import uuid
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User
from models.audit_log import AuditLog
from middleware.auth import hash_password, create_access_token

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_audit_log_rbac_and_master_view(db_session):
    with TestClient(app) as client:
        # Create an admin user and a normal user
        admin_uname = f"admin_{uuid.uuid4().hex[:6]}"
        user_uname = f"user_{uuid.uuid4().hex[:6]}"

        admin = User(
            username=admin_uname,
            display_name="System Admin",
            password_hash=hash_password("adminpass123"),
            is_admin=True
        )
        user = User(
            username=user_uname,
            display_name="Normal User",
            password_hash=hash_password("userpass123"),
            is_admin=False
        )
        db_session.add_all([admin, user])
        db_session.commit()
        db_session.refresh(admin)
        db_session.refresh(user)

        admin_token = create_access_token({"sub": admin.username, "id": admin.id})
        user_token = create_access_token({"sub": user.username, "id": user.id})

        # Add distinct audit logs
        log_admin = AuditLog(
            user_id=admin.id,
            username=admin.username,
            action="update_preferences",
            target_type="preference",
            target_id=1,
            ip_address="198.51.100.10"
        )
        log_user = AuditLog(
            user_id=user.id,
            username=user.username,
            action="bookmark",
            target_type="skill",
            target_id=42,
            ip_address="203.0.113.55"
        )
        log_system = AuditLog(
            user_id=None,
            username="system_gemini",
            action="quota_exceeded",
            target_type="gemini_ai",
            detail={"source": "gemini_ai", "reason": "Rate limited"},
            ip_address="system:internal"
        )
        db_session.add_all([log_admin, log_user, log_system])
        db_session.commit()

        # 1. Unauthenticated guest: blocked with 401
        guest_res = client.get("/api/v1/history/audit-log")
        assert guest_res.status_code == 401

        # 2. Normal user: allowed with 200, strictly scoped to own records ("My Activity")
        user_res = client.get(
            "/api/v1/history/audit-log",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert user_res.status_code == 200
        user_data = user_res.json()
        assert len(user_data) > 0
        assert all(item["user_id"] == user.id for item in user_data)
        assert all(item["username"] == user.username for item in user_data)
        assert not any(item["username"] == admin.username for item in user_data)
        assert not any(item["username"] == "system_gemini" for item in user_data)

        # 3. Normal user trying to bypass RBAC: peeking at another user_id or username returns 403
        tamper_res = client.get(
            f"/api/v1/history/audit-log?user_id={admin.id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert tamper_res.status_code == 403

        tamper_uname_res = client.get(
            f"/api/v1/history/audit-log?username={admin.username}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert tamper_uname_res.status_code == 403

        # Normal user stats: returns 200 and reflects only user's personal activity
        user_stats_res = client.get(
            "/api/v1/history/audit-log/stats?days=7",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert user_stats_res.status_code == 200
        user_stats = user_stats_res.json()
        assert user_stats["total_events"] == len(user_data)

        # 4. Admin user: Master view sees all logs
        admin_res = client.get(
            "/api/v1/history/audit-log",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert admin_res.status_code == 200
        admin_data = admin_res.json()
        admin_usernames = {item["username"] for item in admin_data}
        assert user.username in admin_usernames
        assert admin.username in admin_usernames

        # Admin filter by username
        filter_res = client.get(
            f"/api/v1/history/audit-log?username={user.username}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert filter_res.status_code == 200
        filter_data = filter_res.json()
        assert all(item["username"] == user.username for item in filter_data)

def test_audit_log_pagination_envelope(db_session):
    with TestClient(app) as client:
        admin_uname = f"admin_{uuid.uuid4().hex[:6]}"
        admin = User(
            username=admin_uname,
            display_name="Admin",
            password_hash=hash_password("adminpass123"),
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)

        token = create_access_token({"sub": admin.username, "id": admin.id})

        # Test envelope pagination
        res = client.get(
            "/api/v1/history/audit-log?page=1&page_size=10",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert "has_next" in data
        assert "has_prev" in data
        assert data["page"] == 1
        assert data["page_size"] == 10
        assert isinstance(data["items"], list)

        # Backward-compatible call without page parameter
        compat_res = client.get(
            "/api/v1/history/audit-log?limit=5",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert compat_res.status_code == 200
        compat_data = compat_res.json()
        assert isinstance(compat_data, list)
        assert len(compat_data) <= 5

def test_audit_log_ip_extraction_and_login_failed(db_session):
    with TestClient(app) as client:
        # Failed login attempt with custom reverse proxy header
        test_ip = "192.0.2.145"
        non_existent_user = f"intruder_{uuid.uuid4().hex[:6]}"

        login_res = client.post(
            "/api/v1/auth/login",
            json={"username": non_existent_user, "password": "wrongpassword"},
            headers={"CF-Connecting-IP": test_ip}
        )
        assert login_res.status_code == 401

        # Verify login_failed audit log was recorded with exact IP
        failed_log = db_session.query(AuditLog).filter(
            AuditLog.action == "login_failed",
            AuditLog.username == non_existent_user
        ).first()

        assert failed_log is not None
        assert failed_log.ip_address == test_ip
        assert failed_log.detail.get("attempted_username") == non_existent_user

def test_audit_stats_with_charts_and_timeline(db_session):
    with TestClient(app) as client:
        admin_uname = f"admin_{uuid.uuid4().hex[:6]}"
        admin = User(
            username=admin_uname,
            display_name="Admin",
            password_hash=hash_password("adminpass123"),
            is_admin=True
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)

        token = create_access_token({"sub": admin.username, "id": admin.id})

        res = client.get(
            "/api/v1/history/audit-log/stats?days=7",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        stats = res.json()

        assert "total_events" in stats
        assert "quota_exceeded_count" in stats
        assert "collection_completed_count" in stats
        assert "failed_count" in stats
        assert "success_count" in stats
        assert "error_rate_percent" in stats
        assert "daily_timeline" in stats
        assert "action_distribution" in stats

        assert isinstance(stats["daily_timeline"], list)
        assert len(stats["daily_timeline"]) == 7
        for day in stats["daily_timeline"]:
            assert "date" in day
            assert "total" in day
            assert "success" in day
            assert "error" in day

        assert isinstance(stats["action_distribution"], list)
        for act in stats["action_distribution"]:
            assert "action" in act
            assert "label" in act
            assert "count" in act
            assert "percentage" in act

def test_ip_helper_edge_cases():
    from middleware.ip_helper import get_client_ip

    class DummyRequest:
        def __init__(self, headers=None, client_host=None):
            self.headers = headers or {}
            self.client = type("Client", (), {"host": client_host})() if client_host else None

    # Case 1: IPv4 with port
    req1 = DummyRequest(headers={"X-Forwarded-For": "203.0.113.195:8080, 10.0.0.1"})
    assert get_client_ip(req1) == "203.0.113.195"

    # Case 2: Bracketed IPv6 with port
    req2 = DummyRequest(headers={"CF-Connecting-IP": "[2001:db8::1]:443"})
    assert get_client_ip(req2) == "2001:db8::1"

    # Case 3: Leading empty/comma entries in proxy chain
    req3 = DummyRequest(headers={"X-Forwarded-For": " ,  , 198.51.100.22 , 10.0.0.1"})
    assert get_client_ip(req3) == "198.51.100.22"

    # Case 4: Fallback to direct client host
    req4 = DummyRequest(client_host="172.16.0.5")
    assert get_client_ip(req4) == "172.16.0.5"

    # Case 5: Complete fallback for scheduler/background
    assert get_client_ip(None, fallback="system:scheduler") == "system:scheduler"

