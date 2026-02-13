from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _extract_token(request: Request, bearer_token: str | None) -> str | None:
    if bearer_token:
        return bearer_token
    cookie_token = request.cookies.get(settings.auth_cookie_name)
    if cookie_token:
        return cookie_token
    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    resolved_token = _extract_token(request, token)
    if not resolved_token:
        raise credentials_exception

    try:
        payload = decode_access_token(resolved_token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise credentials_exception
    return user


def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User | None:
    resolved_token = _extract_token(request, token)
    if not resolved_token:
        return None

    try:
        payload = decode_access_token(resolved_token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    return db.scalar(select(User).where(User.id == user_id))


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
