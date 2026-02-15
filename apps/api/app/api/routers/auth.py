import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import AuthUser, LoginRequest, SignupRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _send_signup_emails(user: User) -> None:
    # Best-effort email delivery; auth flow should not fail if SMTP is unavailable.
    if not (
        settings.smtp_host
        and settings.smtp_port
        and settings.smtp_user
        and settings.smtp_password
        and settings.smtp_from
    ):
        return

    greeting = EmailMessage()
    greeting["Subject"] = "Welcome to PyPilot"
    greeting["From"] = settings.smtp_from
    greeting["To"] = user.email
    greeting.set_content(
        f"Hi {user.full_name},\n\nWelcome to PyPilot! We're excited to have you on board.\n\nIf you have any questions, reply to this email.\n\n- The PyPilot Team"
    )

    designer_msg: EmailMessage | None = None
    if settings.designer_email:
        designer_msg = EmailMessage()
        designer_msg["Subject"] = "Designer Contact"
        designer_msg["From"] = settings.smtp_from
        designer_msg["To"] = user.email
        designer_msg.set_content(
            f"Hi {user.full_name},\n\nIf you'd like to contact our product designer, you can reach them at: {settings.designer_email}\n\nBest,\nPyPilot Team"
        )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(greeting)
            if designer_msg:
                smtp.send_message(designer_msg)
    except Exception as exc:
        print(f"Signup email send failed: {exc}")


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    normalized_email = payload.email.strip().lower()
    normalized_name = payload.full_name.strip()

    existing = db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    if existing:
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        email=normalized_email,
        full_name=normalized_name,
        hashed_password=get_password_hash(payload.password),
        xp=0,
        level=1,
        streak_days=0,
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered") from exc

    db.refresh(user)
    _send_signup_emails(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=AuthUser(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            xp=user.xp,
            level=user.level,
            streak_days=user.streak_days,
            is_admin=user.is_admin,
        ),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.strip().lower()))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=AuthUser(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            xp=user.xp,
            level=user.level,
            streak_days=user.streak_days,
            is_admin=user.is_admin,
        ),
    )

