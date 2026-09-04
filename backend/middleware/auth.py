import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from models.user import User

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization:
        raise credentials_exception

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise credentials_exception
    token = parts[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise credentials_exception

    username = payload["sub"]
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise credentials_exception
    return user

def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization:
        return None
    try:
        parts = authorization.split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        token = parts[1].strip()
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        return db.query(User).filter(User.username == payload["sub"]).first()
    except Exception:
        return None
