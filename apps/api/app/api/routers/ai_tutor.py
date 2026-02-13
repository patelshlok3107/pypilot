from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.ai import (
    AITutorResponse,
    DebugCodeRequest,
    ExplainConceptRequest,
    PracticeProblemRequest,
    PracticeProblemResponse,
)
from app.core.config import settings
from app.services.ai_tutor import ai_tutor_service
from app.services.product_growth import product_growth_service

router = APIRouter(prefix="/ai", tags=["ai"])


def _consume_or_raise(db: Session, user: User) -> None:
    # Skip credit consumption for offline AI - it has unlimited access
    if settings.use_offline_ai:
        return
    
    # Skip credit consumption if database is not available
    try:
        allowed = product_growth_service.consume_ai_credit(db, user, amount=1)
        if not allowed:
            raise HTTPException(
                status_code=402,
                detail="Daily AI credit limit reached. Upgrade to Pro for unlimited AI tutor support.",
            )
    except Exception:
        # Database not available, allow usage
        print("Database not available, skipping credit consumption")
        pass


@router.post("/explain", response_model=AITutorResponse)
async def explain_concept(
    payload: ExplainConceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AITutorResponse:
    _consume_or_raise(db, current_user)

    response = await ai_tutor_service.explain_concept(
        topic=payload.topic,
        level=payload.student_level,
        context=payload.context,
    )

    entitlements = product_growth_service.get_entitlements(db, current_user)
    db.commit()

    return AITutorResponse(
        response=response,
        ai_credits_remaining=entitlements["ai_credits_remaining"],
    )


@router.post("/debug", response_model=AITutorResponse)
async def debug_code(
    payload: DebugCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AITutorResponse:
    _consume_or_raise(db, current_user)

    response = await ai_tutor_service.debug_code(
        code=payload.code,
        error_message=payload.error_message,
    )

    entitlements = product_growth_service.get_entitlements(db, current_user)
    db.commit()

    return AITutorResponse(
        response=response,
        ai_credits_remaining=entitlements["ai_credits_remaining"],
    )


@router.post("/practice", response_model=PracticeProblemResponse)
async def generate_practice_problem(
    payload: PracticeProblemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PracticeProblemResponse:
    _consume_or_raise(db, current_user)

    generated = await ai_tutor_service.generate_practice(
        topic=payload.topic,
        difficulty=payload.difficulty,
    )

    # Handle database availability
    try:
        entitlements = product_growth_service.get_entitlements(db, current_user)
        db.commit()
        ai_credits = entitlements["ai_credits_remaining"]
    except Exception:
        # Database not available, provide default values
        ai_credits = 999  # Unlimited for demo purposes
        print("Database not available, using default credits")

    return PracticeProblemResponse(
        **generated,
        ai_credits_remaining=ai_credits,
    )
