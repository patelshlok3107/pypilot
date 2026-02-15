from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Achievement, LessonProgress, User, UserAchievement


class GamificationService:
    @staticmethod
    def calculate_level(xp: int) -> int:
        level = 1
        threshold = 0
        while xp >= threshold:
            level += 1
            threshold += level * 100
            if level > 100:
                break
        return max(1, level - 1)

    @staticmethod
    def next_level_xp(level: int) -> int:
        total = 0
        for lvl in range(2, level + 1):
            total += lvl * 100
        return total + (level + 1) * 100

    def award_xp(self, db: Session, user: User, amount: int) -> None:
        user.xp += max(0, amount)
        user.level = self.calculate_level(user.xp)

    def update_streak(self, user: User) -> None:
        today = date.today()
        if user.last_active_date == today:
            return
        if user.last_active_date == today - timedelta(days=1):
            user.streak_days += 1
        else:
            user.streak_days = 1
        user.last_active_date = today

    def evaluate_achievements(self, db: Session, user: User) -> list[Achievement]:
        unlocked: list[Achievement] = []

        completed_lessons = db.scalar(
            select(func.count(LessonProgress.id)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.status == "completed",
            )
        ) or 0

        existing_ids = {
            ach_id
            for ach_id in db.scalars(
                select(UserAchievement.achievement_id).where(UserAchievement.user_id == user.id)
            )
        }

        conditions = {
            "first_steps": completed_lessons >= 1,
            "streak_7": user.streak_days >= 7,
            "xp_500": user.xp >= 500,
            "project_finisher": completed_lessons >= 10,
        }

        for code, unlocked_condition in conditions.items():
            if not unlocked_condition:
                continue
            achievement = db.scalar(select(Achievement).where(Achievement.code == code))
            if not achievement or achievement.id in existing_ids:
                continue

            db.add(UserAchievement(user_id=user.id, achievement_id=achievement.id))
            user.xp += achievement.xp_bonus
            unlocked.append(achievement)

        user.level = self.calculate_level(user.xp)
        return unlocked


gamification_service = GamificationService()
