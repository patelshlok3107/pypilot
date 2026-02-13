from __future__ import annotations

from sqlalchemy import and_, asc, func, select
from sqlalchemy.orm import Session

from app.db.models import Lesson, LessonProgress, Module, User
from app.services.mastery import mastery_service


class RecommendationService:
    def recommend_next_lesson(self, db: Session, user: User) -> dict:
        weak_row = db.execute(
            select(
                Lesson.id,
                Lesson.title,
                Lesson.objective,
                Module.id.label("module_id"),
                Module.title.label("module_title"),
                func.coalesce(LessonProgress.quiz_score, 0).label("quiz_score"),
                LessonProgress.challenge_passed,
            )
            .select_from(LessonProgress)
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(
                LessonProgress.user_id == user.id,
                and_(
                    LessonProgress.quiz_score.is_(None) | (LessonProgress.quiz_score < 70),
                    LessonProgress.status != "completed",
                )
                | LessonProgress.challenge_passed.is_(False),
            )
            .order_by(asc(func.coalesce(LessonProgress.quiz_score, 0)))
            .limit(1)
        ).first()

        if weak_row is not None:
            lesson_id = int(weak_row[0])
            unlocked, reason = mastery_service.lesson_is_unlocked(db, user, lesson_id)
            if unlocked:
                return {
                    "lesson_id": lesson_id,
                    "lesson_title": weak_row[1],
                    "lesson_objective": weak_row[2],
                    "module_id": int(weak_row[3]),
                    "module_title": weak_row[4],
                    "reason": "Recommended due to weak quiz/challenge performance.",
                    "unlock_reason": None,
                }

            return {
                "lesson_id": lesson_id,
                "lesson_title": weak_row[1],
                "lesson_objective": weak_row[2],
                "module_id": int(weak_row[3]),
                "module_title": weak_row[4],
                "reason": "Weak area detected but module gate is active.",
                "unlock_reason": reason,
            }

        candidate = db.execute(
            select(
                Lesson.id,
                Lesson.title,
                Lesson.objective,
                Module.id.label("module_id"),
                Module.title.label("module_title"),
            )
            .select_from(Lesson)
            .join(Module, Module.id == Lesson.module_id)
            .order_by(Module.order_index.asc(), Lesson.order_index.asc())
        ).all()

        for row in candidate:
            lesson_id = int(row[0])
            progress = db.scalar(
                select(LessonProgress).where(
                    LessonProgress.user_id == user.id,
                    LessonProgress.lesson_id == lesson_id,
                )
            )
            if progress and progress.status == "completed":
                continue

            unlocked, reason = mastery_service.lesson_is_unlocked(db, user, lesson_id)
            if unlocked:
                return {
                    "lesson_id": lesson_id,
                    "lesson_title": row[1],
                    "lesson_objective": row[2],
                    "module_id": int(row[3]),
                    "module_title": row[4],
                    "reason": "Next unlocked lesson in your path.",
                    "unlock_reason": None,
                }

            return {
                "lesson_id": lesson_id,
                "lesson_title": row[1],
                "lesson_objective": row[2],
                "module_id": int(row[3]),
                "module_title": row[4],
                "reason": "Next lesson found but locked behind module mastery.",
                "unlock_reason": reason,
            }

        return {
            "lesson_id": None,
            "lesson_title": None,
            "lesson_objective": None,
            "module_id": None,
            "module_title": None,
            "reason": "No recommendation available. Curriculum complete.",
            "unlock_reason": None,
        }


recommendation_service = RecommendationService()
