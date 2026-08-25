from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

from database import get_db
from models.user import User
from models.user_preference import UserPreference
from models.audit_log import AuditLog
from middleware.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None
    avatar_color: Optional[str] = "from-emerald-500 to-teal-600"

class LoginRequest(BaseModel):
    username: str
    password: str

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
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    username = data.username.strip().lower()
    if not username or len(username) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 characters")
    if not data.password or len(data.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    display_name = data.display_name.strip() if data.display_name else username.capitalize()
    
    # Check if first user -> make admin
    is_admin = db.query(User).count() == 0 or username == "hieu"

    user = User(
        username=username,
        display_name=display_name,
        password_hash=hash_password(data.password),
        avatar_color=data.avatar_color or "from-emerald-500 to-teal-600",
        is_admin=is_admin,
        created_at=datetime.utcnow(),
        last_login_at=datetime.utcnow()
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
        detail={"display_name": user.display_name, "is_admin": user.is_admin}
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": user.username, "id": user.id})
    return AuthResponse(access_token=token, user=user)

@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    username = data.username.strip().lower()
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác"
        )

    user.last_login_at = datetime.utcnow()
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="login",
        target_type="user",
        target_id=user.id,
        detail={"timestamp": datetime.utcnow().isoformat()}
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
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.asc()).all()
