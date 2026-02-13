from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.models import (
    Course,
    EventLog,
    LearningTrack,
    Lesson,
    LessonProgress,
    Module,
    Submission,
    Subscription,
    User,
)
from app.db.session import get_db
from app.schemas.admin import (
    AdminAnalyticsResponse,
    AdminHealthResponse,
    CourseAdminUpdate,
    LessonAdminUpdate,
    ModuleAdminUpdate,
    SubscriptionOverview,
    TrackAdminUpdate,
)
from app.services.audit import log_event
from app.services.observability import observability_service

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


@router.get("/health", response_model=AdminHealthResponse)
def health(
    _: User = Depends(get_current_admin),
) -> AdminHealthResponse:
    snapshot = observability_service.snapshot()
    return AdminHealthResponse(
        total_requests=snapshot.total_requests,
        total_errors=snapshot.total_errors,
        avg_latency_ms=snapshot.avg_latency_ms,
        p95_latency_ms=snapshot.p95_latency_ms,
        slow_requests=snapshot.slow_requests,
        routes=snapshot.routes,
        slow_queries=observability_service.slow_queries(),
    )


@router.get("/events")
def recent_events(
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(
        select(EventLog).order_by(desc(EventLog.created_at)).limit(max(1, min(limit, 300)))
    ).all()
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "event_type": row.event_type,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "severity": row.severity,
            "payload_json": row.payload_json,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


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
    current_user: User = Depends(get_current_admin),
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

    log_event(
        db,
        "admin.course_updated",
        user_id=current_user.id,
        entity_type="course",
        entity_id=str(course.id),
        payload=payload.model_dump(exclude_none=True),
    )
    db.commit()
    return {"success": True, "course_id": course.id}


@router.get("/modules")
def list_modules(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(select(Module).order_by(Module.course_id, Module.order_index)).all()
    return [
        {
            "id": item.id,
            "course_id": item.course_id,
            "title": item.title,
            "description": item.description,
            "order_index": item.order_index,
            "xp_reward": item.xp_reward,
        }
        for item in rows
    ]


@router.patch("/modules/{module_id}")
def update_module(
    module_id: int,
    payload: ModuleAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    module = db.scalar(select(Module).where(Module.id == module_id))
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if payload.title is not None:
        module.title = payload.title
    if payload.description is not None:
        module.description = payload.description
    if payload.order_index is not None:
        module.order_index = payload.order_index
    if payload.xp_reward is not None:
        module.xp_reward = payload.xp_reward

    log_event(
        db,
        "admin.module_updated",
        user_id=current_user.id,
        entity_type="module",
        entity_id=str(module.id),
        payload=payload.model_dump(exclude_none=True),
    )
    db.commit()
    return {"success": True, "module_id": module.id}


@router.get("/lessons")
def list_lessons(
    module_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[dict]:
    query = select(Lesson).order_by(Lesson.module_id, Lesson.order_index)
    if module_id is not None:
        query = query.where(Lesson.module_id == module_id)
    rows = db.scalars(query).all()
    return [
        {
            "id": item.id,
            "module_id": item.module_id,
            "title": item.title,
            "objective": item.objective,
            "order_index": item.order_index,
            "estimated_minutes": item.estimated_minutes,
        }
        for item in rows
    ]


@router.patch("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: int,
    payload: LessonAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if payload.title is not None:
        lesson.title = payload.title
    if payload.objective is not None:
        lesson.objective = payload.objective
    if payload.content_md is not None:
        lesson.content_md = payload.content_md
    if payload.order_index is not None:
        lesson.order_index = payload.order_index
    if payload.estimated_minutes is not None:
        lesson.estimated_minutes = payload.estimated_minutes

    log_event(
        db,
        "admin.lesson_updated",
        user_id=current_user.id,
        entity_type="lesson",
        entity_id=str(lesson.id),
        payload=payload.model_dump(exclude_none=True),
    )
    db.commit()
    return {"success": True, "lesson_id": lesson.id}


@router.get("/tracks")
def list_tracks(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(select(LearningTrack).order_by(LearningTrack.order_index)).all()
    return [
        {
            "id": item.id,
            "slug": item.slug,
            "name": item.name,
            "premium_only": item.premium_only,
            "order_index": item.order_index,
        }
        for item in rows
    ]


@router.patch("/tracks/{track_id}")
def update_track(
    track_id: int,
    payload: TrackAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    track = db.scalar(select(LearningTrack).where(LearningTrack.id == track_id))
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if payload.name is not None:
        track.name = payload.name
    if payload.description is not None:
        track.description = payload.description
    if payload.outcome is not None:
        track.outcome = payload.outcome
    if payload.target_audience is not None:
        track.target_audience = payload.target_audience
    if payload.premium_only is not None:
        track.premium_only = payload.premium_only
    if payload.order_index is not None:
        track.order_index = payload.order_index

    log_event(
        db,
        "admin.track_updated",
        user_id=current_user.id,
        entity_type="track",
        entity_id=str(track.id),
        payload=payload.model_dump(exclude_none=True),
    )
    db.commit()
    return {"success": True, "track_id": track.id}
