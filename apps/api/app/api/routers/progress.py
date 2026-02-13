from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import CodingChallenge, Lesson, LessonAttempt, LessonProgress, Submission, User
from app.db.session import get_db
from app.schemas.course import (
    ChallengeSubmissionRequest,
    ChallengeSubmissionResponse,
    LessonCompletionRequest,
    LessonCompletionResponse,
)
from app.services.ai_tutor import ai_tutor_service
from app.services.audit import log_event
from app.services.code_runner import code_runner_service
from app.services.economy import economy_service
from app.services.gamification import gamification_service
from app.services.mastery import mastery_service
from app.services.tutor_memory import tutor_memory_service

router = APIRouter(prefix="/progress", tags=["progress"])

MIN_DWELL_SECONDS = 45
MIN_ENGAGED_HEARTBEATS = 2


@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompletionResponse)
def complete_lesson(
    lesson_id: int,
    payload: LessonCompletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LessonCompletionResponse:
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    unlocked, unlock_reason = mastery_service.lesson_is_unlocked(db, current_user, lesson_id)
    if not unlocked:
        log_event(
            db,
            "lesson_completion.blocked_by_mastery_gate",
            user_id=current_user.id,
            entity_type="lesson",
            entity_id=str(lesson_id),
            severity="warning",
            payload={"reason": unlock_reason},
        )
        db.commit()
        raise HTTPException(status_code=423, detail=unlock_reason or "Lesson is locked by mastery gate")

    if payload.attempt_id is not None:
        attempt = db.scalar(
            select(LessonAttempt).where(
                LessonAttempt.id == payload.attempt_id,
                LessonAttempt.user_id == current_user.id,
                LessonAttempt.lesson_id == lesson_id,
            )
        )
        if not attempt:
            raise HTTPException(status_code=404, detail="Lesson attempt not found")
    else:
        attempt = db.scalar(
            select(LessonAttempt)
            .where(
                LessonAttempt.user_id == current_user.id,
                LessonAttempt.lesson_id == lesson_id,
                LessonAttempt.status.in_(["started", "in_progress"]),
            )
            .order_by(LessonAttempt.updated_at.desc())
            .limit(1)
        )
        if not attempt:
            attempt = LessonAttempt(
                user_id=current_user.id,
                lesson_id=lesson_id,
                status="in_progress",
                dwell_seconds=0,
                metadata_json={},
            )
            db.add(attempt)
            db.flush()

    attempt_meta = dict(attempt.metadata_json or {})
    engaged_heartbeats = int(attempt_meta.get("engaged_heartbeat_count", 0) or 0)
    server_observed_dwell = max(0, int((datetime.utcnow() - attempt.created_at).total_seconds()))
    required_dwell = max(MIN_DWELL_SECONDS, lesson.estimated_minutes * 20)
    # Prefer server-observed elapsed time to prevent client-forged dwell payloads.
    dwell_seconds = max(server_observed_dwell, attempt.dwell_seconds)

    lesson_challenge_ids = db.scalars(
        select(CodingChallenge.id).where(CodingChallenge.lesson_id == lesson_id)
    ).all()
    has_lesson_challenge = len(lesson_challenge_ids) > 0
    challenge_verified = True
    if has_lesson_challenge:
        passed_submissions = db.scalar(
            select(func.count(Submission.id)).where(
                Submission.user_id == current_user.id,
                Submission.challenge_id.in_(lesson_challenge_ids),
                Submission.passed.is_(True),
                Submission.created_at >= attempt.created_at,
            )
        ) or 0
        challenge_verified = int(passed_submissions) > 0

    anti_fake_passed = (
        dwell_seconds >= required_dwell
        and challenge_verified
        and engaged_heartbeats >= MIN_ENGAGED_HEARTBEATS
    )

    progress = db.scalar(
        select(LessonProgress).where(
            and_(LessonProgress.user_id == current_user.id, LessonProgress.lesson_id == lesson_id)
        )
    )

    if not progress:
        progress = LessonProgress(user_id=current_user.id, lesson_id=lesson_id)
        db.add(progress)

    progress.quiz_score = payload.quiz_score
    progress.challenge_passed = challenge_verified

    attempt.dwell_seconds = dwell_seconds
    attempt.quiz_score = payload.quiz_score
    attempt.challenge_passed = challenge_verified
    attempt.anti_fake_passed = anti_fake_passed

    if not anti_fake_passed:
        attempt.status = "rejected"
        progress.status = "in_progress"
        log_event(
            db,
            "lesson_completion.rejected_anti_fake",
            user_id=current_user.id,
            entity_type="lesson",
            entity_id=str(lesson_id),
            severity="warning",
            payload={
                "required_dwell_seconds": required_dwell,
                "provided_dwell_seconds": dwell_seconds,
                "challenge_verified": challenge_verified,
                "required_engaged_heartbeats": MIN_ENGAGED_HEARTBEATS,
                "engaged_heartbeats": engaged_heartbeats,
            },
        )
        db.commit()
        raise HTTPException(
            status_code=422,
            detail=(
                f"Completion rejected: spend at least {required_dwell} seconds in lesson "
                "with active reading time and pass the challenge before completing."
            ),
        )

    if (payload.quiz_score is None or payload.quiz_score >= 70) and challenge_verified:
        progress.status = "completed"
        progress.completed_at = datetime.utcnow()
        attempt.status = "completed"
        xp_awarded = 60
    else:
        progress.status = "in_progress"
        attempt.status = "in_progress"
        xp_awarded = 20

    if xp_awarded > 0:
        gamification_service.award_xp(db, current_user, xp_awarded)

    gamification_service.update_streak(current_user)
    gamification_service.evaluate_achievements(db, current_user)
    mastery_service.evaluate_module_mastery(db, current_user, lesson.module_id)
    economy_service.award_lesson_completion_credits(db, current_user, lesson_id)
    economy_service.update_weekly_progress(
        db,
        current_user,
        lesson_completed=progress.status == "completed",
        quiz_score=payload.quiz_score,
    )
    log_event(
        db,
        "lesson.completed" if progress.status == "completed" else "lesson.progressed",
        user_id=current_user.id,
        entity_type="lesson",
        entity_id=str(lesson_id),
        payload={
            "quiz_score": payload.quiz_score,
            "challenge_passed": challenge_verified,
            "xp_awarded": xp_awarded,
            "attempt_id": attempt.id,
            "dwell_seconds": dwell_seconds,
            "anti_fake_passed": anti_fake_passed,
            "engaged_heartbeats": engaged_heartbeats,
        },
    )

    db.commit()
    db.refresh(current_user)

    return LessonCompletionResponse(
        lesson_id=lesson_id,
        status=progress.status,
        xp_awarded=xp_awarded,
        level=current_user.level,
        total_xp=current_user.xp,
    )


@router.post("/challenges/submit", response_model=ChallengeSubmissionResponse)
async def submit_challenge(
    payload: ChallengeSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChallengeSubmissionResponse:
    challenge = db.scalar(select(CodingChallenge).where(CodingChallenge.id == payload.challenge_id))
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    run_result = await code_runner_service.run_python(payload.code)
    passed = run_result["exit_code"] == 0

    ai_feedback = None
    if not passed:
        ai_feedback = await ai_tutor_service.debug_code(
            code=payload.code,
            error_message=run_result.get("stderr") or "Execution failed",
        )
        tutor_memory_service.remember(
            db,
            current_user,
            category="debug",
            topic=challenge.title,
            memory_text=f"Had challenge failure on '{challenge.title}'. Needs more debugging repetition.",
            confidence_score=70,
            metadata={"challenge_id": challenge.id, "difficulty": challenge.difficulty},
        )
    else:
        gamification_service.award_xp(db, current_user, challenge.xp_reward)
        tutor_memory_service.remember(
            db,
            current_user,
            category="strength",
            topic=challenge.title,
            memory_text=f"Successfully solved challenge '{challenge.title}'.",
            confidence_score=82,
            metadata={"challenge_id": challenge.id, "difficulty": challenge.difficulty},
        )

    gamification_service.update_streak(current_user)
    gamification_service.evaluate_achievements(db, current_user)

    submission = Submission(
        user_id=current_user.id,
        challenge_id=challenge.id,
        code=payload.code,
        output=run_result.get("stdout") or run_result.get("stderr"),
        passed=passed,
        ai_feedback=ai_feedback,
    )
    db.add(submission)
    log_event(
        db,
        "challenge.submitted",
        user_id=current_user.id,
        entity_type="challenge",
        entity_id=str(challenge.id),
        payload={"passed": passed},
    )
    db.commit()
    db.refresh(submission)

    return ChallengeSubmissionResponse(
        submission_id=submission.id,
        passed=submission.passed,
        output=submission.output,
        ai_feedback=submission.ai_feedback,
        created_at=submission.created_at,
    )
