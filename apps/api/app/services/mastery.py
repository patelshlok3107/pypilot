from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.db.models import Course, Lesson, LessonProgress, Module, ModuleMastery, User

DEFAULT_QUIZ_THRESHOLD = 70


@dataclass
class ModuleGateState:
    module_id: int
    unlocked: bool
    mastered: bool
    average_quiz_score: int
    lessons_completed: int
    total_lessons: int
    challenges_passed: int


class MasteryService:
    def evaluate_module_mastery(
        self,
        db: Session,
        user: User,
        module_id: int,
        quiz_threshold: int = DEFAULT_QUIZ_THRESHOLD,
    ) -> ModuleMastery:
        lesson_ids = db.scalars(
            select(Lesson.id).where(Lesson.module_id == module_id).order_by(Lesson.order_index)
        ).all()
        total_lessons = len(lesson_ids)

        if total_lessons == 0:
            existing = db.scalar(
                select(ModuleMastery).where(
                    ModuleMastery.user_id == user.id,
                    ModuleMastery.module_id == module_id,
                )
            )
            if existing:
                existing.mastery_threshold_met = True
                existing.lessons_completed = 0
                existing.average_quiz_score = 100
                existing.challenges_passed = 0
                return existing

            record = ModuleMastery(
                user_id=user.id,
                module_id=module_id,
                mastery_threshold_met=True,
                average_quiz_score=100,
            )
            db.add(record)
            return record

        completed_lessons = db.scalar(
            select(func.count(LessonProgress.id)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.lesson_id.in_(lesson_ids),
                LessonProgress.status == "completed",
            )
        ) or 0

        avg_quiz_raw = db.scalar(
            select(func.avg(LessonProgress.quiz_score)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.lesson_id.in_(lesson_ids),
                LessonProgress.quiz_score.is_not(None),
            )
        )
        average_quiz_score = int(float(avg_quiz_raw)) if avg_quiz_raw is not None else 0

        challenges_passed = db.scalar(
            select(func.count(LessonProgress.id)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.lesson_id.in_(lesson_ids),
                LessonProgress.challenge_passed.is_(True),
            )
        ) or 0

        mastered = (
            completed_lessons >= total_lessons
            and challenges_passed >= total_lessons
            and average_quiz_score >= quiz_threshold
        )

        record = db.scalar(
            select(ModuleMastery).where(
                ModuleMastery.user_id == user.id,
                ModuleMastery.module_id == module_id,
            )
        )
        if not record:
            record = ModuleMastery(
                user_id=user.id,
                module_id=module_id,
            )
            db.add(record)

        record.lessons_completed = int(completed_lessons)
        record.average_quiz_score = average_quiz_score
        record.challenges_passed = int(challenges_passed)
        record.mastery_threshold_met = mastered
        if mastered and record.unlocked_at is None:
            from datetime import datetime

            record.unlocked_at = datetime.utcnow()
        return record

    def module_gate_states(
        self,
        db: Session,
        user: User,
        course_id: int | None = None,
    ) -> list[ModuleGateState]:
        module_query = select(Module).order_by(Module.order_index)
        if course_id is not None:
            module_query = module_query.where(Module.course_id == course_id)

        modules = db.scalars(module_query).all()
        states: list[ModuleGateState] = []
        previous_mastered = True

        for module in modules:
            mastery = self.evaluate_module_mastery(db, user, module.id)
            total_lessons = db.scalar(
                select(func.count(Lesson.id)).where(Lesson.module_id == module.id)
            ) or 0

            unlocked = previous_mastered
            states.append(
                ModuleGateState(
                    module_id=module.id,
                    unlocked=unlocked,
                    mastered=bool(mastery.mastery_threshold_met),
                    average_quiz_score=mastery.average_quiz_score,
                    lessons_completed=mastery.lessons_completed,
                    total_lessons=int(total_lessons),
                    challenges_passed=mastery.challenges_passed,
                )
            )
            previous_mastered = bool(mastery.mastery_threshold_met)

        return states

    def lesson_is_unlocked(self, db: Session, user: User, lesson_id: int) -> tuple[bool, str | None]:
        lesson = db.scalar(
            select(Lesson).where(Lesson.id == lesson_id).join(Module, Lesson.module_id == Module.id)
        )
        if not lesson:
            return False, "Lesson not found"

        module = db.scalar(select(Module).where(Module.id == lesson.module_id))
        if not module:
            return False, "Module not found"

        ordered_modules = db.scalars(
            select(Module)
            .where(Module.course_id == module.course_id)
            .order_by(Module.order_index)
        ).all()
        if not ordered_modules:
            return True, None

        if ordered_modules[0].id == module.id:
            return True, None

        previous_module_id: int | None = None
        for idx, item in enumerate(ordered_modules):
            if item.id == module.id and idx > 0:
                previous_module_id = ordered_modules[idx - 1].id
                break

        if previous_module_id is None:
            return True, None

        previous_mastery = self.evaluate_module_mastery(db, user, previous_module_id)
        if previous_mastery.mastery_threshold_met:
            return True, None

        return (
            False,
            "Mastery gate locked. Complete prior module with quiz>=70 and challenge pass to unlock.",
        )


mastery_service = MasteryService()
