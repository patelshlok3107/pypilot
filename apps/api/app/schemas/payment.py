from pydantic import AnyHttpUrl, BaseModel, Field


class CheckoutSessionRequest(BaseModel):
    success_url: AnyHttpUrl
    cancel_url: AnyHttpUrl
    billing_cycle: str = Field(default="monthly", pattern="^(monthly|annual)$")
    is_student: bool = False
    promo_code: str | None = None


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class PlanPriceOut(BaseModel):
    code: str
    label: str
    amount_usd: float
    amount_inr: int
    billing_cycle: str
    features: list[str]


class PricingPreviewRequest(BaseModel):
    billing_cycle: str = Field(default="monthly", pattern="^(monthly|annual)$")
    is_student: bool = False
    promo_code: str | None = None


class PricingPreviewResponse(BaseModel):
    base_amount_usd: float
    discount_percent: int
    final_amount_usd: float
    applied_promo_code: str | None


class StripeWebhookAck(BaseModel):
    received: bool = True
