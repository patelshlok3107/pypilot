from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import EconomyTransaction, User
from app.db.session import get_db
from app.schemas.economy import (
    ActionStatusResponse,
    EconomyTransactionOut,
    ReferralCreateRequest,
    ReferralCreateResponse,
    ReferralRedeemRequest,
    WalletOut,
)
from app.services.economy import economy_service

router = APIRouter(prefix="/economy", tags=["economy"])


@router.get("/wallet", response_model=WalletOut)
def wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WalletOut:
    wallet_record = economy_service.get_or_create_wallet(db, current_user)
    db.commit()
    return WalletOut(
        xp_credits=wallet_record.xp_credits,
        referral_credits=wallet_record.referral_credits,
        premium_unlock_tokens=wallet_record.premium_unlock_tokens,
    )


@router.get("/transactions", response_model=list[EconomyTransactionOut])
def transactions(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[EconomyTransactionOut]:
    rows = db.scalars(
        select(EconomyTransaction)
        .where(EconomyTransaction.user_id == current_user.id)
        .order_by(desc(EconomyTransaction.created_at))
        .limit(max(1, min(limit, 100)))
    ).all()

    return [
        EconomyTransactionOut(
            id=item.id,
            source=item.source,
            currency=item.currency,
            amount=item.amount,
            created_at=item.created_at,
        )
        for item in rows
    ]


@router.post("/referrals/create", response_model=ReferralCreateResponse)
def create_referral(
    payload: ReferralCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReferralCreateResponse:
    invite = economy_service.create_referral(db, current_user, payload.invited_email)
    db.commit()
    return ReferralCreateResponse(
        code=invite.code,
        status=invite.status,
        invited_email=invite.invited_email,
    )


@router.post("/referrals/redeem", response_model=ActionStatusResponse)
def redeem_referral(
    payload: ReferralRedeemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActionStatusResponse:
    result = economy_service.redeem_referral(db, current_user, payload.code)
    if result["success"]:
        db.commit()
    else:
        db.rollback()
    return ActionStatusResponse(success=result["success"], detail=result["detail"])


@router.post("/premium/unlock", response_model=ActionStatusResponse)
def unlock_premium(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActionStatusResponse:
    result = economy_service.grant_premium_from_wallet(db, current_user, days=7)
    if result["success"]:
        db.commit()
    else:
        db.rollback()
    return ActionStatusResponse(
        success=result["success"],
        detail="Premium access unlocked for 7 days." if result["success"] else result["detail"],
        expires_at=result.get("expires_at"),
    )
