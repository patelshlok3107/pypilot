from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import (
    LearningTrack,
    LessonProgress,
    Submission,
    TrackMilestone,
    User,
    UserCertificate,
    UserMilestoneCompletion,
    UserTrackEnrollment,
)
from app.db.session import get_db
from app.schemas.tracks import (
    CertificateOut,
    MilestoneCompleteResponse,
    TrackEnrollRequest,
    TrackMilestoneOut,
    TrackOut,
    TranscriptOut,
)
from app.services.gamification import gamification_service
from app.services.product_growth import product_growth_service

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.get("", response_model=list[TrackOut])
def list_tracks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TrackOut]:
    entitlements = product_growth_service.get_entitlements(db, current_user)
    can_access_premium = entitlements["can_access_premium"]

    tracks = db.scalars(select(LearningTrack).order_by(LearningTrack.order_index)).all()
    enrollments = {
        row.track_id: row
        for row in db.scalars(
            select(UserTrackEnrollment).where(UserTrackEnrollment.user_id == current_user.id)
        ).all()
    }

    result: list[TrackOut] = []
    for track in tracks:
        enrollment = enrollments.get(track.id)
        is_locked = track.premium_only and not can_access_premium
        result.append(
            TrackOut(
                id=track.id,
                slug=track.slug,
                name=track.name,
                description=(
                    track.description
                    if not is_locked
                    else "Premium career track with production workflows, architecture depth, and hiring-focused coaching."
                ),
                outcome=(
                    track.outcome
                    if not is_locked
                    else "Upgrade to unlock full outcomes, milestone guidance, and portfolio-grade execution standards."
                ),
                target_audience=track.target_audience,
                premium_only=track.premium_only,
                enrolled=bool(enrollment),
                readiness_score=(enrollment.readiness_score if enrollment and not is_locked else 0),
            )
        )

    # Keep call to avoid stale credits not being reset during track listing.
    if entitlements["subscription_status"] == "free":
        db.commit()

    return result


@router.post("/enroll", response_model=TrackOut)
def enroll_track(
    payload: TrackEnrollRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TrackOut:
    track = db.scalar(select(LearningTrack).where(LearningTrack.slug == payload.track_slug))
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    entitlements = product_growth_service.get_entitlements(db, current_user)
    if track.premium_only and not entitlements["can_access_premium"]:
        raise HTTPException(status_code=402, detail="Upgrade required for this premium track")

    enrollment = db.scalar(
        select(UserTrackEnrollment).where(
            UserTrackEnrollment.user_id == current_user.id,
            UserTrackEnrollment.track_id == track.id,
        )
    )
    if not enrollment:
        enrollment = UserTrackEnrollment(
            user_id=current_user.id,
            track_id=track.id,
            status="active",
            readiness_score=0,
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)

    return TrackOut(
        id=track.id,
        slug=track.slug,
        name=track.name,
        description=track.description,
        outcome=track.outcome,
        target_audience=track.target_audience,
        premium_only=track.premium_only,
        enrolled=True,
        readiness_score=enrollment.readiness_score,
    )


@router.get("/{track_slug}/milestones", response_model=list[TrackMilestoneOut])
def list_track_milestones(
    track_slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TrackMilestoneOut]:
    track = db.scalar(select(LearningTrack).where(LearningTrack.slug == track_slug))
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    entitlements = product_growth_service.get_entitlements(db, current_user)
    if track.premium_only and not entitlements["can_access_premium"]:
        raise HTTPException(status_code=402, detail="Upgrade required to view milestones for this premium track")

    milestones = db.scalars(
        select(TrackMilestone)
        .where(TrackMilestone.track_id == track.id)
        .order_by(TrackMilestone.order_index)
    ).all()

    completed_ids = {
        row.milestone_id
        for row in db.scalars(
            select(UserMilestoneCompletion).where(UserMilestoneCompletion.user_id == current_user.id)
        ).all()
    }

    return [
        TrackMilestoneOut(
            id=item.id,
            title=item.title,
            description=item.description,
            required_lessons=item.required_lessons,
            required_avg_quiz_score=item.required_avg_quiz_score,
            required_challenges_passed=item.required_challenges_passed,
            reward_xp=item.reward_xp,
            order_index=item.order_index,
            completed=item.id in completed_ids,
        )
        for item in milestones
    ]


@router.post("/milestones/{milestone_id}/complete", response_model=MilestoneCompleteResponse)
def complete_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MilestoneCompleteResponse:
    milestone = db.scalar(select(TrackMilestone).where(TrackMilestone.id == milestone_id))
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    completed_lessons = db.scalar(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.status == "completed",
        )
    ) or 0

    avg_quiz = db.scalar(
        select(func.avg(LessonProgress.quiz_score)).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.quiz_score.is_not(None),
        )
    )
    avg_quiz_score = int(float(avg_quiz)) if avg_quiz is not None else 0

    challenges_passed = db.scalar(
        select(func.count(Submission.id)).where(
            Submission.user_id == current_user.id,
            Submission.passed.is_(True),
        )
    ) or 0

    completion_score = min(
        100,
        int(
            (completed_lessons / max(1, milestone.required_lessons)) * 35
            + (avg_quiz_score / max(1, milestone.required_avg_quiz_score)) * 35
            + (challenges_passed / max(1, milestone.required_challenges_passed)) * 30
        ),
    )

    is_eligible = (
        completed_lessons >= milestone.required_lessons
        and avg_quiz_score >= milestone.required_avg_quiz_score
        and challenges_passed >= milestone.required_challenges_passed
    )
    if not is_eligible:
        raise HTTPException(
            status_code=422,
            detail="Milestone requirements not met yet. Continue lessons and challenge practice.",
        )

    existing = db.scalar(
        select(UserMilestoneCompletion).where(
            UserMilestoneCompletion.user_id == current_user.id,
            UserMilestoneCompletion.milestone_id == milestone.id,
        )
    )

    xp_awarded = 0
    if not existing:
        db.add(
            UserMilestoneCompletion(
                user_id=current_user.id,
                milestone_id=milestone.id,
                completion_score=completion_score,
            )
        )
        gamification_service.award_xp(db, current_user, milestone.reward_xp)
        xp_awarded = milestone.reward_xp

        enrollment = db.scalar(
            select(UserTrackEnrollment).where(
                UserTrackEnrollment.user_id == current_user.id,
                UserTrackEnrollment.track_id == milestone.track_id,
            )
        )
        if enrollment:
            enrollment.completed_milestones += 1
            enrollment.readiness_score = min(100, enrollment.readiness_score + 20)
            enrollment.updated_at = datetime.utcnow()

    db.commit()

    return MilestoneCompleteResponse(
        milestone_id=milestone.id,
        completed=True,
        completion_score=completion_score,
        xp_awarded=xp_awarded,
    )


@router.get("/transcript/me", response_model=TranscriptOut)
def transcript(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TranscriptOut:
    total_lessons_completed = db.scalar(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.status == "completed",
        )
    ) or 0

    avg_quiz = db.scalar(
        select(func.avg(LessonProgress.quiz_score)).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.quiz_score.is_not(None),
        )
    )
    average_quiz_score = float(avg_quiz) if avg_quiz is not None else 0.0

    challenges_passed = db.scalar(
        select(func.count(Submission.id)).where(
            Submission.user_id == current_user.id,
            Submission.passed.is_(True),
        )
    ) or 0

    enrolled = db.scalars(
        select(LearningTrack.name)
        .join(UserTrackEnrollment, LearningTrack.id == UserTrackEnrollment.track_id)
        .where(UserTrackEnrollment.user_id == current_user.id)
        .order_by(LearningTrack.order_index)
    ).all()

    enrolled_tracks = list(enrolled)

    return TranscriptOut(
        total_lessons_completed=total_lessons_completed,
        average_quiz_score=round(average_quiz_score, 2),
        challenges_passed=challenges_passed,
        current_level=current_user.level,
        total_xp=current_user.xp,
        enrolled_tracks=enrolled_tracks,
    )


@router.post("/certificates/generate", response_model=CertificateOut)
def generate_certificate(
    track_slug: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CertificateOut:
    title = "Python Mastery Certificate"
    track_id = None

    if track_slug:
        track = db.scalar(select(LearningTrack).where(LearningTrack.slug == track_slug))
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        entitlements = product_growth_service.get_entitlements(db, current_user)
        if track.premium_only and not entitlements["can_access_premium"]:
            raise HTTPException(status_code=402, detail="Upgrade required for premium track certificates")
        title = f"{track.name} Completion Certificate"
        track_id = track.id

    verification_code = str(uuid4()).replace("-", "")[:16].upper()
    certificate = UserCertificate(
        user_id=current_user.id,
        track_id=track_id,
        title=title,
        verification_code=verification_code,
    )
    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    return CertificateOut(
        id=certificate.id,
        title=certificate.title,
        verification_code=certificate.verification_code,
        issued_at=certificate.issued_at.isoformat(),
    )
