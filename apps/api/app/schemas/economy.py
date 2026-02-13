from datetime import datetime

from pydantic import BaseModel, Field


class WalletOut(BaseModel):
    xp_credits: int
    referral_credits: int
    premium_unlock_tokens: int


class EconomyTransactionOut(BaseModel):
    id: int
    source: str
    currency: str
    amount: int
    created_at: datetime


class ReferralCreateRequest(BaseModel):
    invited_email: str | None = None


class ReferralCreateResponse(BaseModel):
    code: str
    status: str
    invited_email: str | None = None


class ReferralRedeemRequest(BaseModel):
    code: str = Field(min_length=4, max_length=30)


class ActionStatusResponse(BaseModel):
    success: bool
    detail: str
    expires_at: str | None = None
