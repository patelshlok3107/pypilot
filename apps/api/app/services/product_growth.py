from __future__ import annotations

from datetime import date

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.models import PromoCode, PromoRedemption, Subscription, User, UserLearningProfile
from app.services.economy import economy_service

FREE_DAILY_AI_CREDITS = 25


class ProductGrowthService:
    @staticmethod
    def _is_local_mock_subscription(subscription: Subscription) -> bool:
        return subscription.stripe_subscription_id.startswith("local_sub_")

    def _is_paid_active_subscription(self, subscription: Subscription | None) -> bool:
        if not subscription:
            return False
        if subscription.status not in {"active", "trialing"}:
            return False
        if self._is_local_mock_subscription(subscription):
            return False
        return True

    def get_or_create_profile(self, db: Session, user: User) -> UserLearningProfile:
        profile = db.scalar(select(UserLearningProfile).where(UserLearningProfile.user_id == user.id))
        if profile:
            self._reset_credits_if_needed(profile)
            return profile

        profile = UserLearningProfile(
            user_id=user.id,
            onboarding_complete=False,
            ai_credits_remaining=FREE_DAILY_AI_CREDITS,
            ai_credits_reset_date=date.today(),
        )
        db.add(profile)
        db.flush()
        return profile

    def _reset_credits_if_needed(self, profile: UserLearningProfile) -> None:
        today = date.today()
        if profile.ai_credits_reset_date != today:
            profile.ai_credits_remaining = FREE_DAILY_AI_CREDITS
            profile.ai_credits_reset_date = today

    def get_latest_subscription(self, db: Session, user_id: str) -> Subscription | None:
        return db.scalar(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .order_by(desc(Subscription.created_at))
            .limit(1)
        )

    def get_entitlements(self, db: Session, user: User) -> dict:
        profile = self.get_or_create_profile(db, user)
        subscription = self.get_latest_subscription(db, user.id)

        paid_active = self._is_paid_active_subscription(subscription)
        status = subscription.status if paid_active and subscription else "free"
        plan = subscription.plan if paid_active and subscription else "free"
        has_earned_access = economy_service.has_earned_premium_access(db, user.id)
        can_access_premium = paid_active or has_earned_access
        priority_debug_queue = can_access_premium

        if can_access_premium:
            ai_credits = 999999
        else:
            ai_credits = max(0, profile.ai_credits_remaining)

        return {
            "plan_tier": plan,
            "subscription_status": status,
            "can_access_premium": can_access_premium,
            "has_earned_premium_access": has_earned_access,
            "ai_credits_remaining": ai_credits,
            "priority_debug_queue": priority_debug_queue,
        }

    def consume_ai_credit(self, db: Session, user: User, amount: int = 1) -> bool:
        entitlements = self.get_entitlements(db, user)
        if entitlements["can_access_premium"]:
            return True

        profile = self.get_or_create_profile(db, user)
        if profile.ai_credits_remaining < amount:
            return False

        profile.ai_credits_remaining -= amount
        return True

    def pricing_plans(self) -> list[dict]:
        return [
            {
                "code": "free",
                "label": "Free Tier",
                "amount_usd": 0.0,
                "amount_inr": 0,
                "billing_cycle": "once",
                "features": [
                    "25 AI credits per day",
                    "Basic Python lessons",
                    "Community support",
                ],
            },
            {
                "code": "pro-monthly",
                "label": "Pro Monthly",
                "amount_usd": 10.0,
                "amount_inr": 849,
                "billing_cycle": "monthly",
                "features": [
                    "Unlimited AI tutor",
                    "Premium career tracks",
                    "Milestone certificates",
                    "Priority debug queue",
                ],
            },
            {
                "code": "pro-annual",
                "label": "Pro Annual",
                "amount_usd": 50.0,
                "amount_inr": 4199,
                "billing_cycle": "annual",
                "features": [
                    "Everything in Pro Monthly",
                    "Massive annual discount",
                    "Early access to new features",
                    "Advanced report exports",
                ],
            },
        ]

    def pricing_preview(
        self,
        db: Session,
        billing_cycle: str,
        is_student: bool,
        promo_code: str | None,
    ) -> dict:
        base_amount = 10.0 if billing_cycle == "monthly" else 50.0
        if billing_cycle == "free":
            base_amount = 0.0

        discount = 0
        applied = None

        if is_student:
            discount = max(discount, 30)

        if promo_code:
            code = promo_code.strip().upper()
            promo = db.scalar(select(PromoCode).where(PromoCode.code == code, PromoCode.active.is_(True)))
            if promo:
                if not promo.student_only or is_student:
                    discount = max(discount, promo.discount_percent)
                    applied = promo.code

        final_amount = round(float(base_amount * (1 - discount / 100)), 2)
        return {
            "base_amount_usd": base_amount,
            "discount_percent": discount,
            "final_amount_usd": max(0.0, final_amount),
            "applied_promo_code": applied,
        }

    def apply_promo_redemption(self, db: Session, user: User, promo_code: str | None, is_student: bool) -> str | None:
        if not promo_code:
            return None

        code = promo_code.strip().upper()
        promo = db.scalar(select(PromoCode).where(PromoCode.code == code, PromoCode.active.is_(True)))
        if not promo:
            return None

        if promo.student_only and not is_student:
            return None

        if promo.redemptions_count >= promo.max_redemptions:
            return None

        existing = db.scalar(
            select(PromoRedemption).where(PromoRedemption.promo_code_id == promo.id, PromoRedemption.user_id == user.id)
        )
        if not existing:
            db.add(PromoRedemption(promo_code_id=promo.id, user_id=user.id))
            promo.redemptions_count += 1

        return promo.code


product_growth_service = ProductGrowthService()
