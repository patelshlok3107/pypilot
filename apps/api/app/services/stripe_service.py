from datetime import datetime, timezone

import stripe
from fastapi import HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Subscription, User

if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


class StripeService:
    def _price_id_for_cycle(self, billing_cycle: str) -> str:
        if billing_cycle == "annual" and settings.stripe_price_id_annual:
            return settings.stripe_price_id_annual
        return settings.stripe_price_id

    def create_checkout_session(
        self,
        user: User,
        success_url: str,
        cancel_url: str,
        billing_cycle: str = "monthly",
        is_student: bool = False,
        promo_code: str | None = None,
    ) -> str:
        plan_tier = "pro-annual" if billing_cycle == "annual" else "pro-monthly"

        if not settings.stripe_secret_key:
            raise HTTPException(
                status_code=503,
                detail="Payments are not configured. Add Stripe keys to enable paid subscriptions.",
            )

        metadata = {
            "user_id": user.id,
            "plan_tier": plan_tier,
            "billing_cycle": billing_cycle,
            "is_student": str(is_student).lower(),
            "promo_code": promo_code or "",
        }

        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": self._price_id_for_cycle(billing_cycle), "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email,
            metadata=metadata,
        )
        return session.url

    def handle_webhook(self, db: Session, payload: bytes, signature: str | None) -> None:
        if not settings.stripe_secret_key or not settings.stripe_webhook_secret:
            return

        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=signature,
                secret=settings.stripe_webhook_secret,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid Stripe payload") from exc
        except stripe.error.SignatureVerificationError as exc:
            raise HTTPException(status_code=400, detail="Invalid Stripe signature") from exc

        event_type = event.get("type")
        event_data = event.get("data", {}).get("object", {})

        if event_type == "checkout.session.completed":
            user_id = event_data.get("metadata", {}).get("user_id")
            customer_id = event_data.get("customer")
            subscription_id = event_data.get("subscription")
            plan_tier = event_data.get("metadata", {}).get("plan_tier", "pro")
            if user_id and customer_id and subscription_id:
                self._upsert_subscription(
                    db=db,
                    user_id=user_id,
                    customer_id=customer_id,
                    subscription_id=subscription_id,
                    plan=plan_tier,
                    status="active",
                    current_period_end=None,
                )

        if event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
            subscription_id = event_data.get("id")
            if subscription_id:
                current_period_end = event_data.get("current_period_end")
                period_end_dt = None
                if current_period_end:
                    period_end_dt = datetime.fromtimestamp(current_period_end, tz=timezone.utc)
                subscription = db.scalar(
                    select(Subscription).where(Subscription.stripe_subscription_id == subscription_id)
                )
                if subscription:
                    subscription.status = event_data.get("status", "incomplete")
                    subscription.current_period_end = period_end_dt

    def _upsert_subscription(
        self,
        db: Session,
        user_id: str,
        customer_id: str,
        subscription_id: str,
        plan: str,
        status: str,
        current_period_end: datetime | None,
    ) -> None:
        existing = db.scalar(
            select(Subscription).where(Subscription.stripe_subscription_id == subscription_id)
        )
        if existing:
            existing.plan = plan
            existing.status = status
            existing.current_period_end = current_period_end
            return

        record = Subscription(
            user_id=user_id,
            stripe_customer_id=customer_id,
            stripe_subscription_id=subscription_id,
            plan=plan,
            status=status,
            current_period_end=current_period_end,
        )
        db.add(record)

    def ensure_local_subscription(self, db: Session, user: User, billing_cycle: str = "monthly") -> Subscription:
        plan_tier = "pro-annual" if billing_cycle == "annual" else "pro-monthly"
        if billing_cycle == "free":
            plan_tier = "free"
        existing = db.scalar(
            select(Subscription)
            .where(Subscription.user_id == user.id)
            .order_by(desc(Subscription.created_at))
            .limit(1)
        )

        if existing and existing.status in {"active", "trialing", "incomplete"}:
            existing.plan = plan_tier
            existing.status = "incomplete" if billing_cycle in {"monthly", "annual"} else existing.status
            return existing

        record = Subscription(
            user_id=user.id,
            stripe_customer_id=f"local_{user.id[:8]}",
            stripe_subscription_id=f"local_sub_{user.id[:8]}_{int(datetime.now(timezone.utc).timestamp())}",
            plan=plan_tier,
            status="incomplete" if billing_cycle in {"monthly", "annual"} else "active",
            current_period_end=None,
        )
        db.add(record)
        return record


stripe_service = StripeService()
