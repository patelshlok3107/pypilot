from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Course, Lesson, Module, User
from app.db.session import get_db
from app.api.deps import get_current_user
from app.schemas.course import (
    CodingChallengeOut,
    CourseOut,
    LessonOut,
    LessonPremiumInsightOut,
    ModuleOut,
    QuizQuestionOut,
)
from app.services.premium_learning import premium_learning_service
from app.services.product_growth import product_growth_service

router = APIRouter(prefix="/courses", tags=["courses"])


def serialize_course(course: Course) -> CourseOut:
    modules = sorted(course.modules, key=lambda item: item.order_index)
    return CourseOut(
        id=course.id,
        slug=course.slug,
        title=course.title,
        description=course.description,
        difficulty=course.difficulty,
        order_index=course.order_index,
        modules=[
            ModuleOut(
                id=module.id,
                title=module.title,
                description=module.description,
                order_index=module.order_index,
                xp_reward=module.xp_reward,
                lessons=[
                    LessonOut(
                        id=lesson.id,
                        title=lesson.title,
                        objective=lesson.objective,
                        content_md=lesson.content_md,
                        order_index=lesson.order_index,
                        estimated_minutes=lesson.estimated_minutes,
                        quiz_questions=[
                            QuizQuestionOut(
                                id=question.id,
                                prompt=question.prompt,
                                options=question.options,
                                correct_option=question.correct_option,
                                explanation=question.explanation,
                            )
                            for question in lesson.quiz_questions
                        ],
                        coding_challenges=[
                            CodingChallengeOut(
                                id=challenge.id,
                                title=challenge.title,
                                prompt=challenge.prompt,
                                starter_code=challenge.starter_code,
                                difficulty=challenge.difficulty,
                                xp_reward=challenge.xp_reward,
                            )
                            for challenge in lesson.coding_challenges
                        ],
                    )
                    for lesson in sorted(module.lessons, key=lambda l: l.order_index)
                ],
            )
            for module in modules
        ],
    )


@router.get("/catalog", response_model=list[CourseOut])
def catalog(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[CourseOut]:
    courses = db.scalars(
        select(Course)
        .where(Course.is_published.is_(True))
        .order_by(Course.order_index)
        .options(
            selectinload(Course.modules)
            .selectinload(Module.lessons)
            .selectinload(Lesson.quiz_questions),
            selectinload(Course.modules)
            .selectinload(Module.lessons)
            .selectinload(Lesson.coding_challenges),
        )
    ).all()

    return [serialize_course(course) for course in courses]


@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CourseOut:
    course = db.scalar(
        select(Course)
        .where(Course.id == course_id, Course.is_published.is_(True))
        .options(
            selectinload(Course.modules)
            .selectinload(Module.lessons)
            .selectinload(Lesson.quiz_questions),
            selectinload(Course.modules)
            .selectinload(Module.lessons)
            .selectinload(Lesson.coding_challenges),
        )
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return serialize_course(course)


@router.get("/lessons/{lesson_id}/premium-insights", response_model=LessonPremiumInsightOut)
def lesson_premium_insights(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LessonPremiumInsightOut:
    entitlements = product_growth_service.get_entitlements(db, current_user)
    if not entitlements["can_access_premium"]:
        raise HTTPException(status_code=403, detail="Upgrade required for premium learning insights")

    lesson = db.scalar(
        select(Lesson)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Lesson.id == lesson_id, Course.is_published.is_(True))
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return premium_learning_service.build_lesson_premium_insight(lesson)
