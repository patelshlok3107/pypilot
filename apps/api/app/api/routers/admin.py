from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.models import Course, Lesson, LessonProgress, Submission, Subscription, User
from app.db.session import get_db
from app.schemas.admin import AdminAnalyticsResponse, CourseAdminUpdate, SubscriptionOverview

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> AdminAnalyticsResponse:
    total_users = db.scalar(select(func.count(User.id))) or 0
    paid_users = db.scalar(
        select(func.count(func.distinct(Subscription.user_id))).where(Subscription.status == "active")
    ) or 0

    seven_days_ago = date.today() - timedelta(days=6)
    active_users = db.scalar(
        select(func.count(User.id)).where(User.last_active_date >= seven_days_ago)
    ) or 0

    total_submissions = db.scalar(select(func.count()).select_from(Submission)) or 0

    total_lessons = db.scalar(select(func.count(Lesson.id))) or 1
    completed_records = db.scalar(
        select(func.count(LessonProgress.id)).where(LessonProgress.status == "completed")
    ) or 0
    average_completion_rate = round((completed_records / (max(1, total_users) * total_lessons)) * 100, 2)

    return AdminAnalyticsResponse(
        total_users=total_users,
        paid_users=paid_users,
        active_users_last_7_days=active_users,
        total_submissions=total_submissions,
        average_completion_rate=average_completion_rate,
    )


@router.get("/subscriptions", response_model=list[SubscriptionOverview])
def subscriptions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[SubscriptionOverview]:
    rows = db.execute(
        select(Subscription, User)
        .join(User, User.id == Subscription.user_id)
        .order_by(Subscription.created_at.desc())
    ).all()

    return [
        SubscriptionOverview(
            user_id=user.id,
            email=user.email,
            plan=subscription.plan,
            status=subscription.status,
            current_period_end=(
                subscription.current_period_end.isoformat() if subscription.current_period_end else None
            ),
        )
        for subscription, user in rows
    ]


@router.get("/courses")
def list_courses(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[dict]:
    courses = db.scalars(select(Course).order_by(Course.order_index)).all()
    return [
        {
            "id": course.id,
            "slug": course.slug,
            "title": course.title,
            "difficulty": course.difficulty,
            "is_published": course.is_published,
        }
        for course in courses
    ]


@router.patch("/courses/{course_id}")
def update_course(
    course_id: int,
    payload: CourseAdminUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> dict:
    course = db.scalar(select(Course).where(Course.id == course_id))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if payload.title is not None:
        course.title = payload.title
    if payload.description is not None:
        course.description = payload.description
    if payload.difficulty is not None:
        course.difficulty = payload.difficulty
    if payload.is_published is not None:
        course.is_published = payload.is_published

    db.commit()
    return {"success": True, "course_id": course.id}
