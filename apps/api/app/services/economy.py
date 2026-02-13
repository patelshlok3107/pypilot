from __future__ import annotations

from datetime import date, datetime, timedelta
from secrets import token_hex

from sqlalchemy import and_, desc, select
from sqlalchemy.orm import Session

from app.db.models import (
    EconomyTransaction,
    PremiumAccessGrant,
    ReferralInvite,
    User,
    UserWallet,
    UserWeeklyUnlockMission,
    WeeklyUnlockMission,
)
from app.services.audit import log_event


class EconomyService:
    def get_or_create_wallet(self, db: Session, user: User) -> UserWallet:
        wallet = db.scalar(select(UserWallet).where(UserWallet.user_id == user.id))
        if wallet:
            return wallet

        wallet = UserWallet(user_id=user.id, xp_credits=0, referral_credits=0, premium_unlock_tokens=0)
        db.add(wallet)
        db.flush()
        return wallet

    def _record_txn(
        self,
        db: Session,
        user_id: str,
        source: str,
        currency: str,
        amount: int,
        metadata: dict | None = None,
    ) -> None:
        db.add(
            EconomyTransaction(
                user_id=user_id,
                source=source,
                currency=currency,
                amount=amount,
                metadata_json=metadata or {},
            )
        )

    def award_lesson_completion_credits(self, db: Session, user: User, lesson_id: int) -> UserWallet:
        wallet = self.get_or_create_wallet(db, user)
        wallet.xp_credits += 3
        self._record_txn(
            db,
            user.id,
            source="lesson_completion",
            currency="xp_credit",
            amount=3,
            metadata={"lesson_id": lesson_id},
        )
        if wallet.xp_credits >= 100:
            wallet.xp_credits -= 100
            wallet.premium_unlock_tokens += 1
            self._record_txn(
                db,
                user.id,
                source="xp_credit_conversion",
                currency="premium_unlock_token",
                amount=1,
                metadata={"spent_xp_credits": 100},
            )
        return wallet

    def _week_start(self, when: date | None = None) -> date:
        today = when or date.today()
        return today - timedelta(days=today.weekday())

    def ensure_weekly_mission(self, db: Session) -> WeeklyUnlockMission:
        week_start = self._week_start()
        mission = db.scalar(
            select(WeeklyUnlockMission).where(
                WeeklyUnlockMission.week_start == week_start,
                WeeklyUnlockMission.active.is_(True),
            )
        )
        if mission:
            return mission

        mission = WeeklyUnlockMission(
            week_start=week_start,
            title="Mastery Sprint",
            description="Complete 3 lessons with at least one quiz score above 75 to earn unlock credits.",
            required_lessons=3,
            required_quiz_score=75,
            reward_credits=2,
            active=True,
        )
        db.add(mission)
        db.flush()
        return mission

    def update_weekly_progress(
        self,
        db: Session,
        user: User,
        *,
        lesson_completed: bool,
        quiz_score: int | None,
    ) -> UserWeeklyUnlockMission:
        mission = self.ensure_weekly_mission(db)
        progress = db.scalar(
            select(UserWeeklyUnlockMission).where(
                UserWeeklyUnlockMission.user_id == user.id,
                UserWeeklyUnlockMission.mission_id == mission.id,
            )
        )
        if not progress:
            progress = UserWeeklyUnlockMission(
                user_id=user.id,
                mission_id=mission.id,
                lessons_progress=0,
                best_quiz_score=0,
                completed=False,
            )
            db.add(progress)
            db.flush()

        if lesson_completed:
            progress.lessons_progress += 1
        if quiz_score is not None:
            progress.best_quiz_score = max(progress.best_quiz_score, quiz_score)

        if (
            not progress.completed
            and progress.lessons_progress >= mission.required_lessons
            and progress.best_quiz_score >= mission.required_quiz_score
        ):
            progress.completed = True
            progress.completed_at = datetime.utcnow()
            wallet = self.get_or_create_wallet(db, user)
            wallet.referral_credits += mission.reward_credits
            self._record_txn(
                db,
                user.id,
                source="weekly_mission_completion",
                currency="referral_credit",
                amount=mission.reward_credits,
                metadata={"mission_id": mission.id},
            )
            log_event(
                db,
                "weekly_mission.completed",
                user_id=user.id,
                entity_type="weekly_unlock_mission",
                entity_id=str(mission.id),
                payload={
                    "reward_credits": mission.reward_credits,
                    "lessons_progress": progress.lessons_progress,
                    "best_quiz_score": progress.best_quiz_score,
                },
            )

        return progress

    def create_referral(self, db: Session, user: User, invited_email: str | None = None) -> ReferralInvite:
        code = f"REF{token_hex(4).upper()}"
        invite = ReferralInvite(
            inviter_user_id=user.id,
            invited_email=invited_email.lower() if invited_email else None,
            code=code,
            status="pending",
            reward_xp=120,
            reward_credits=1,
        )
        db.add(invite)
        db.flush()
        return invite

    def redeem_referral(self, db: Session, user: User, code: str) -> dict:
        invite = db.scalar(select(ReferralInvite).where(ReferralInvite.code == code.upper()))
        if not invite:
            return {"success": False, "detail": "Referral code not found"}
        if invite.inviter_user_id == user.id:
            return {"success": False, "detail": "You cannot redeem your own referral code"}
        if invite.status == "rewarded":
            return {"success": False, "detail": "Referral code already redeemed"}

        inviter = db.scalar(select(User).where(User.id == invite.inviter_user_id))
        if not inviter:
            return {"success": False, "detail": "Inviter account not found"}

        invite.invited_user_id = user.id
        invite.status = "rewarded"
        invite.rewarded_at = datetime.utcnow()

        inviter_wallet = self.get_or_create_wallet(db, inviter)
        inviter_wallet.referral_credits += invite.reward_credits
        inviter_wallet.premium_unlock_tokens += 1
        inviter.xp += invite.reward_xp

        self._record_txn(
            db,
            inviter.id,
            source="referral_reward",
            currency="referral_credit",
            amount=invite.reward_credits,
            metadata={"referral_code": invite.code, "invited_user_id": user.id},
        )
        self._record_txn(
            db,
            inviter.id,
            source="referral_reward",
            currency="premium_unlock_token",
            amount=1,
            metadata={"referral_code": invite.code, "invited_user_id": user.id},
        )
        return {"success": True, "detail": "Referral redeemed successfully"}

    def grant_premium_from_wallet(self, db: Session, user: User, days: int = 7) -> dict:
        wallet = self.get_or_create_wallet(db, user)
        if wallet.premium_unlock_tokens <= 0:
            return {"success": False, "detail": "No premium unlock tokens available"}

        wallet.premium_unlock_tokens -= 1
        grant = PremiumAccessGrant(
            user_id=user.id,
            source="wallet_token",
            granted_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=days),
            metadata_json={"days": days},
        )
        db.add(grant)
        self._record_txn(
            db,
            user.id,
            source="premium_unlock_spend",
            currency="premium_unlock_token",
            amount=-1,
            metadata={"days": days},
        )
        log_event(
            db,
            "premium_access.granted",
            user_id=user.id,
            entity_type="premium_access_grant",
            payload={"source": "wallet_token", "days": days},
        )
        return {"success": True, "expires_at": grant.expires_at.isoformat()}

    def has_earned_premium_access(self, db: Session, user_id: str) -> bool:
        now = datetime.utcnow()
        grant = db.scalar(
            select(PremiumAccessGrant)
            .where(
                PremiumAccessGrant.user_id == user_id,
                and_(
                    PremiumAccessGrant.expires_at.is_(None)
                    | (PremiumAccessGrant.expires_at >= now)
                ),
            )
            .order_by(desc(PremiumAccessGrant.granted_at))
            .limit(1)
        )
        return grant is not None


economy_service = EconomyService()
