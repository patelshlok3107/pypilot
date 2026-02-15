from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import CodingChallenge, Lesson, LessonProgress, Submission, User
from app.db.session import get_db
from app.schemas.course import (
    ChallengeSubmissionRequest,
    ChallengeSubmissionResponse,
    LessonCompletionRequest,
    LessonCompletionResponse,
)
from app.services.ai_tutor import ai_tutor_service
from app.services.code_runner import code_runner_service
from app.services.gamification import gamification_service

router = APIRouter(prefix="/progress", tags=["progress"])


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

    progress = db.scalar(
        select(LessonProgress).where(
            and_(LessonProgress.user_id == current_user.id, LessonProgress.lesson_id == lesson_id)
        )
    )

    if not progress:
        progress = LessonProgress(user_id=current_user.id, lesson_id=lesson_id)
        db.add(progress)

    progress.quiz_score = payload.quiz_score
    progress.challenge_passed = payload.challenge_passed

    if (payload.quiz_score is None or payload.quiz_score >= 70) and payload.challenge_passed:
        progress.status = "completed"
        progress.completed_at = datetime.utcnow()
        xp_awarded = 60
    else:
        progress.status = "in_progress"
        xp_awarded = 20

    gamification_service.award_xp(db, current_user, xp_awarded)
    gamification_service.update_streak(current_user)
    gamification_service.evaluate_achievements(db, current_user)

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
    else:
        gamification_service.award_xp(db, current_user, challenge.xp_reward)

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
    db.commit()
    db.refresh(submission)

    return ChallengeSubmissionResponse(
        submission_id=submission.id,
        passed=submission.passed,
        output=submission.output,
        ai_feedback=submission.ai_feedback,
        created_at=submission.created_at,
    )
