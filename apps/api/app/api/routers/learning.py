from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Lesson, LessonAttempt, LessonTranslation, User
from app.db.session import get_db
from app.schemas.learning import (
    LearningRecommendationOut,
    LessonAttemptHeartbeatRequest,
    LessonAttemptOut,
    LessonAttemptStartRequest,
    ModuleGateOut,
)
from app.services.audit import log_event
from app.services.mastery import mastery_service
from app.services.recommendation import recommendation_service

router = APIRouter(prefix="/learning", tags=["learning"])


@router.get("/recommendation", response_model=LearningRecommendationOut)
def recommendation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LearningRecommendationOut:
    result = recommendation_service.recommend_next_lesson(db, current_user)
    return LearningRecommendationOut(**result)


@router.get("/gates", response_model=list[ModuleGateOut])
def module_gates(
    course_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ModuleGateOut]:
    states = mastery_service.module_gate_states(db, current_user, course_id=course_id)
    return [
        ModuleGateOut(
            module_id=item.module_id,
            unlocked=item.unlocked,
            mastered=item.mastered,
            average_quiz_score=item.average_quiz_score,
            lessons_completed=item.lessons_completed,
            total_lessons=item.total_lessons,
            challenges_passed=item.challenges_passed,
        )
        for item in states
    ]


@router.post("/lessons/{lesson_id}/attempts/start", response_model=LessonAttemptOut)
def start_lesson_attempt(
    lesson_id: int,
    payload: LessonAttemptStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LessonAttemptOut:
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    metadata = {
        "heartbeat_count": 0,
        "engaged_heartbeat_count": 0,
        "last_heartbeat_at": None,
        "started_at": datetime.utcnow().isoformat(),
    }
    if payload.metadata_json:
        metadata.update(payload.metadata_json)

    attempt = LessonAttempt(
        user_id=current_user.id,
        lesson_id=lesson_id,
        status="started",
        dwell_seconds=max(0, payload.dwell_seconds),
        metadata_json=metadata,
    )
    db.add(attempt)
    log_event(
        db,
        "lesson_attempt.started",
        user_id=current_user.id,
        entity_type="lesson",
        entity_id=str(lesson_id),
        payload={"attempt_id": None},
    )
    db.commit()
    db.refresh(attempt)

    return LessonAttemptOut(
        attempt_id=attempt.id,
        lesson_id=attempt.lesson_id,
        status=attempt.status,
        dwell_seconds=attempt.dwell_seconds,
        challenge_passed=attempt.challenge_passed,
        anti_fake_passed=attempt.anti_fake_passed,
        created_at=attempt.created_at,
        updated_at=attempt.updated_at,
    )


@router.post("/lessons/{lesson_id}/attempts/heartbeat", response_model=LessonAttemptOut)
def heartbeat_lesson_attempt(
    lesson_id: int,
    payload: LessonAttemptHeartbeatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LessonAttemptOut:
    attempt = db.scalar(
        select(LessonAttempt).where(
            LessonAttempt.id == payload.attempt_id,
            LessonAttempt.user_id == current_user.id,
            LessonAttempt.lesson_id == lesson_id,
        )
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Lesson attempt not found")

    metadata = dict(attempt.metadata_json or {})
    now = datetime.utcnow()

    previous_heartbeat_iso = metadata.get("last_heartbeat_at")
    previous_heartbeat: datetime | None = None
    if isinstance(previous_heartbeat_iso, str):
        try:
            previous_heartbeat = datetime.fromisoformat(previous_heartbeat_iso)
        except ValueError:
            previous_heartbeat = None

    heartbeat_count = int(metadata.get("heartbeat_count", 0) or 0) + 1
    engaged_heartbeat_count = int(metadata.get("engaged_heartbeat_count", 0) or 0)
    if previous_heartbeat is None or (now - previous_heartbeat).total_seconds() >= 10:
        engaged_heartbeat_count += 1

    metadata.update(
        {
            "heartbeat_count": heartbeat_count,
            "engaged_heartbeat_count": engaged_heartbeat_count,
            "last_heartbeat_at": now.isoformat(),
        }
    )
    if payload.metadata_json:
        metadata.update(payload.metadata_json)

    attempt.dwell_seconds = max(attempt.dwell_seconds, payload.dwell_seconds)
    attempt.metadata_json = metadata
    if attempt.status == "started":
        attempt.status = "in_progress"
    db.commit()
    db.refresh(attempt)

    return LessonAttemptOut(
        attempt_id=attempt.id,
        lesson_id=attempt.lesson_id,
        status=attempt.status,
        dwell_seconds=attempt.dwell_seconds,
        challenge_passed=attempt.challenge_passed,
        anti_fake_passed=attempt.anti_fake_passed,
        created_at=attempt.created_at,
        updated_at=attempt.updated_at,
    )


@router.get("/lessons/{lesson_id}/localized")
def localized_lesson(
    lesson_id: int,
    lang: str = Query(default="en"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if lang.lower() in {"en", "en-us", "en-in"}:
        return {
            "lesson_id": lesson.id,
            "language": "en",
            "title": lesson.title,
            "objective": lesson.objective,
            "content_md": lesson.content_md,
            "translated": False,
        }

    translation = db.scalar(
        select(LessonTranslation).where(
            LessonTranslation.lesson_id == lesson.id,
            LessonTranslation.language == lang.lower(),
        )
    )
    if translation:
        return {
            "lesson_id": lesson.id,
            "language": translation.language,
            "title": translation.title,
            "objective": translation.objective,
            "content_md": translation.content_md,
            "translated": True,
        }

    return {
        "lesson_id": lesson.id,
        "language": "en",
        "title": lesson.title,
        "objective": lesson.objective,
        "content_md": lesson.content_md,
        "translated": False,
    }
