from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import (
    LearningTrack,
    LessonProgress,
    MonthlyReport,
    ParentReportDelivery,
    Submission,
    User,
    UserCertificate,
    UserLearningProfile,
    UserTrackEnrollment,
)
from app.db.session import get_db
from app.schemas.tracks import TranscriptOut
from app.schemas.trust import (
    CertificateVerificationResponse,
    GenerateCertificateRequest,
    ParentReportRequest,
    ParentReportResponse,
)
from app.services.product_growth import product_growth_service
from app.services.reporting import reporting_service

router = APIRouter(prefix="/trust", tags=["trust"])


def current_report_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


@router.post("/certificates/generate")
def generate_certificate(
    payload: GenerateCertificateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    title = "Python Mastery Certificate"
    track_id = None

    if payload.track_slug:
        track = db.scalar(select(LearningTrack).where(LearningTrack.slug == payload.track_slug))
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

    return {
        "certificate_id": certificate.id,
        "title": certificate.title,
        "verification_code": certificate.verification_code,
        "issued_at": certificate.issued_at.isoformat(),
    }


@router.get("/certificates/verify/{verification_code}", response_model=CertificateVerificationResponse)
def verify_certificate(verification_code: str, db: Session = Depends(get_db)) -> CertificateVerificationResponse:
    certificate = db.scalar(
        select(UserCertificate).where(UserCertificate.verification_code == verification_code.upper())
    )
    if not certificate:
        return CertificateVerificationResponse(valid=False)

    return CertificateVerificationResponse(
        valid=True,
        certificate_title=certificate.title,
        learner_name=certificate.user.full_name,
        issued_at=certificate.issued_at.isoformat(),
    )


@router.post("/parent-reports/send", response_model=ParentReportResponse)
def send_parent_report(
    payload: ParentReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ParentReportResponse:
    target_month = payload.report_month or current_report_month()
    if len(target_month) != 7 or target_month[4] != "-":
        raise HTTPException(status_code=422, detail="Month must be in YYYY-MM format")

    report = db.scalar(
        select(MonthlyReport).where(
            MonthlyReport.user_id == current_user.id,
            MonthlyReport.report_month == target_month,
        )
    )
    if not report:
        report = reporting_service.generate_monthly_report(db, current_user, target_month)
        db.flush()

    profile = db.scalar(select(UserLearningProfile).where(UserLearningProfile.user_id == current_user.id))
    if not profile:
        profile = UserLearningProfile(user_id=current_user.id, ai_credits_remaining=25)
        db.add(profile)

    profile.parent_email = str(payload.parent_email)

    delivery = ParentReportDelivery(
        user_id=current_user.id,
        parent_email=str(payload.parent_email),
        report_month=target_month,
        status="queued",
        payload_json={
            "skill_score": report.skill_score,
            "strengths": report.strengths,
            "weaknesses": report.weaknesses,
            "improvement_plan": report.improvement_plan,
        },
    )
    db.add(delivery)
    db.commit()

    return ParentReportResponse(
        status="queued",
        parent_email=payload.parent_email,
        report_month=target_month,
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

    enrolled_tracks = db.scalars(
        select(LearningTrack.name)
        .join(UserTrackEnrollment, UserTrackEnrollment.track_id == LearningTrack.id)
        .where(UserTrackEnrollment.user_id == current_user.id)
        .order_by(LearningTrack.name)
    ).all()

    return TranscriptOut(
        total_lessons_completed=total_lessons_completed,
        average_quiz_score=round(average_quiz_score, 2),
        challenges_passed=challenges_passed,
        current_level=current_user.level,
        total_xp=current_user.xp,
        enrolled_tracks=list(dict.fromkeys(enrolled_tracks)),
    )
