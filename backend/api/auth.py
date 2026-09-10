import re
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone
from typing import Optional, List

from database import get_db
from models.user import User
from models.user_preference import UserPreference
from models.audit_log import AuditLog
from middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from middleware.ip_helper import get_client_ip

router = APIRouter(prefix="/auth", tags=["Authentication"])

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_.-]+$")
DUMMY_HASH = hash_password("dummy_timing_attack_mitigation_secret_2026")

class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=72)
    display_name: Optional[str] = Field(None, max_length=128)
    avatar_color: Optional[str] = Field("from-emerald-500 to-teal-600", max_length=32)

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    is_admin: bool
    created_at: datetime
    last_login_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/register", response_model=AuthResponse)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    username = data.username.strip().lower()
    client_ip = get_client_ip(request)
    if not username or len(username) < 2 or len(username) > 64:
        raise HTTPException(status_code=400, detail="Username must be between 2 and 64 characters")
    if not USERNAME_REGEX.match(username):
        raise HTTPException(
            status_code=400,
            detail="Username can only contain letters, numbers, underscores, hyphens, and dots"
        )
    if not data.password or len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    pw_bytes = data.password.encode("utf-8")
    if len(pw_bytes) > 72:
        raise HTTPException(status_code=400, detail="Password cannot exceed 72 bytes")

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    display_name = data.display_name.strip() if data.display_name else username.capitalize()
    if len(display_name) > 128:
        display_name = display_name[:128]

    # Only first user ever registered becomes admin
    is_admin = db.query(User).count() == 0

    now = datetime.now(timezone.utc)
    user = User(
        username=username,
        display_name=display_name,
        password_hash=hash_password(data.password),
        avatar_color=data.avatar_color or "from-emerald-500 to-teal-600",
        is_admin=is_admin,
        created_at=now,
        last_login_at=now
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default user preference for this specific user
    pref = UserPreference(
        user_id=user.id,
        user_name=user.display_name,
        preferred_categories=["coding-agent", "mcp-server", "skill-file", "workflow-automation", "devtools"],
        preferred_languages=["Python", "TypeScript", "Go", "Rust"],
        preferred_runtimes=["Claude Code", "Cursor", "Gemini CLI", "Windsurf", "Aider"],
        interested_tags=["agent", "skills", "automation", "mcp", "llm", "code-generation"]
    )
    db.add(pref)

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="register",
        target_type="user",
        target_id=user.id,
        detail={"display_name": user.display_name, "is_admin": user.is_admin},
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": user.username, "id": user.id})
    return AuthResponse(access_token=token, user=user)

@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    username = data.username.strip().lower()
    client_ip = get_client_ip(request)
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        # Run password verification on dummy hash to mitigate timing attacks
        verify_password(data.password, DUMMY_HASH)
        fail_audit = AuditLog(
            user_id=None,
            username=username,
            action="login_failed",
            target_type="user",
            target_id=None,
            detail={"attempted_username": username, "reason": "invalid_credentials"},
            ip_address=client_ip
        )
        db.add(fail_audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác"
        )

    if not verify_password(data.password, user.password_hash):
        # Record security audit log for failed login attempt
        fail_audit = AuditLog(
            user_id=user.id,
            username=username,
            action="login_failed",
            target_type="user",
            target_id=user.id,
            detail={"attempted_username": username, "reason": "invalid_credentials"},
            ip_address=client_ip
        )
        db.add(fail_audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác"
        )

    now = datetime.now(timezone.utc)
    user.last_login_at = now

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="login",
        target_type="user",
        target_id=user.id,
        detail={"timestamp": now.isoformat()},
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "id": user.id})
    return AuthResponse(access_token=token, user=user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(User).order_by(User.created_at.asc()).all()
