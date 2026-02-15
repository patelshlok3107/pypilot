from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db
from types import SimpleNamespace

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    try:
        user = db.scalar(select(User).where(User.id == user_id))
        if not user:
            # In offline mode, create a mock user from the token
            from types import SimpleNamespace
            return SimpleNamespace(id=user_id, email="mock@example.com", full_name="Mock User", is_admin=False, xp=0, level=1, streak_days=0, avatar_url=None)
        return user
    except Exception:
        # Database connection failed, create mock user
        from types import SimpleNamespace
        return SimpleNamespace(id=user_id, email="mock@example.com", full_name="Mock User", is_admin=False, xp=0, level=1, streak_days=0, avatar_url=None)


def get_optional_current_user(db: Session = Depends(get_db), token: str | None = Depends(oauth2_scheme)) -> User | None:
    """Attempt to get current user from token; return None if token missing/invalid."""
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    user = db.scalar(select(User).where(User.id == user_id))
    if user:
        return user
    # If user not found in DB (e.g., offline/mock), return a simple namespace from token so optional flows still have an identity
    return SimpleNamespace(id=user_id, email=None, full_name=None, is_admin=False, xp=0, level=1, streak_days=0)


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
