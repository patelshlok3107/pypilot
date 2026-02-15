from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.models import User
from app.db.session import get_db
from app.schemas.payment import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PlanPriceOut,
    PricingPreviewRequest,
    PricingPreviewResponse,
    StripeWebhookAck,
)
from app.services.product_growth import product_growth_service
from app.services.stripe_service import stripe_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/plans", response_model=list[PlanPriceOut])
def plans() -> list[PlanPriceOut]:
    return [PlanPriceOut(**plan) for plan in product_growth_service.pricing_plans()]


@router.post("/preview", response_model=PricingPreviewResponse)
def pricing_preview(
    payload: PricingPreviewRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PricingPreviewResponse:
    result = product_growth_service.pricing_preview(
        db=db,
        billing_cycle=payload.billing_cycle,
        is_student=payload.is_student,
        promo_code=payload.promo_code,
    )
    return PricingPreviewResponse(**result)


@router.post("/checkout", response_model=CheckoutSessionResponse)
def create_checkout(
    payload: CheckoutSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    applied_promo = product_growth_service.apply_promo_redemption(
        db=db,
        user=current_user,
        promo_code=payload.promo_code,
        is_student=payload.is_student,
    )

    url = stripe_service.create_checkout_session(
        user=current_user,
        success_url=str(payload.success_url),
        cancel_url=str(payload.cancel_url),
        billing_cycle=payload.billing_cycle,
        is_student=payload.is_student,
        promo_code=applied_promo,
    )
    if not settings.stripe_secret_key:
        stripe_service.ensure_local_subscription(db, current_user, payload.billing_cycle)
    db.commit()

    return CheckoutSessionResponse(checkout_url=url)


@router.post("/webhook", response_model=StripeWebhookAck)
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
) -> StripeWebhookAck:
    payload = await request.body()
    stripe_service.handle_webhook(db=db, payload=payload, signature=stripe_signature)
    db.commit()
    return StripeWebhookAck(received=True)
