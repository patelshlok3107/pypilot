from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import (
    CodingChallenge,
    Course,
    LearningTrack,
    Lesson,
    LessonProgress,
    Module,
    SquadMembership,
    StudySquad,
    Submission,
    TrackMilestone,
    User,
    UserMilestoneCompletion,
    UserTrackEnrollment,
)
from app.db.session import get_db
from app.schemas.user import (
    DashboardStats,
    UserEntitlements,
    UserPublic,
)
from app.services.product_growth import product_growth_service

router = APIRouter(prefix="/users", tags=["users"])

ADVANCED_UNLOCK_XP_REQUIRED = 1800
ADVANCED_UNLOCK_LESSONS_REQUIRED = 12
DEFAULT_WEEKLY_LESSON_GOAL = 5
LESSON_COMPLETION_XP = 60


def _start_of_day_utc() -> datetime:
    now = datetime.utcnow()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_week_utc() -> datetime:
    day_start = _start_of_day_utc()
    return day_start - timedelta(days=day_start.weekday())

@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
    )

@router.get("/me/entitlements", response_model=UserEntitlements)
def my_entitlements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserEntitlements:
    entitlements = product_growth_service.get_entitlements(db, current_user)
    return UserEntitlements(**entitlements)

@router.get("/me/dashboard", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardStats:
    total_lessons = db.scalar(
        select(func.count(Lesson.id))
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Course.is_published.is_(True))
    ) or 0

    completed_rows = db.scalars(
        select(LessonProgress.lesson_id).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.status == "completed",
        )
    ).all()
    completed_lesson_ids = sorted({int(lesson_id) for lesson_id in completed_rows})
    completed_lessons = len(completed_lesson_ids)

    completion_rate = round((completed_lessons / total_lessons) * 100, 1) if total_lessons else 0.0

    day_start = _start_of_day_utc()
    week_start = _start_of_week_utc()

    lessons_completed_today = db.scalar(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.status == "completed",
            LessonProgress.completed_at.is_not(None),
            LessonProgress.completed_at >= day_start,
        )
    ) or 0

    lessons_completed_week = db.scalar(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.user_id == current_user.id,
            LessonProgress.status == "completed",
            LessonProgress.completed_at.is_not(None),
            LessonProgress.completed_at >= week_start,
        )
    ) or 0

    challenge_xp_today = db.scalar(
        select(func.coalesce(func.sum(CodingChallenge.xp_reward), 0))
        .select_from(Submission)
        .join(CodingChallenge, Submission.challenge_id == CodingChallenge.id)
        .where(
            Submission.user_id == current_user.id,
            Submission.passed.is_(True),
            Submission.created_at >= day_start,
        )
    ) or 0

    challenge_xp_week = db.scalar(
        select(func.coalesce(func.sum(CodingChallenge.xp_reward), 0))
        .select_from(Submission)
        .join(CodingChallenge, Submission.challenge_id == CodingChallenge.id)
        .where(
            Submission.user_id == current_user.id,
            Submission.passed.is_(True),
            Submission.created_at >= week_start,
        )
    ) or 0

    milestone_xp_today = db.scalar(
        select(func.coalesce(func.sum(TrackMilestone.reward_xp), 0))
        .select_from(UserMilestoneCompletion)
        .join(TrackMilestone, UserMilestoneCompletion.milestone_id == TrackMilestone.id)
        .where(
            UserMilestoneCompletion.user_id == current_user.id,
            UserMilestoneCompletion.completed_at >= day_start,
        )
    ) or 0

    milestone_xp_week = db.scalar(
        select(func.coalesce(func.sum(TrackMilestone.reward_xp), 0))
        .select_from(UserMilestoneCompletion)
        .join(TrackMilestone, UserMilestoneCompletion.milestone_id == TrackMilestone.id)
        .where(
            UserMilestoneCompletion.user_id == current_user.id,
            UserMilestoneCompletion.completed_at >= week_start,
        )
    ) or 0

    daily_xp = int((lessons_completed_today * LESSON_COMPLETION_XP) + challenge_xp_today + milestone_xp_today)
    weekly_xp = int((lessons_completed_week * LESSON_COMPLETION_XP) + challenge_xp_week + milestone_xp_week)

    active_track = db.scalar(
        select(LearningTrack.name)
        .join(UserTrackEnrollment, UserTrackEnrollment.track_id == LearningTrack.id)
        .where(
            UserTrackEnrollment.user_id == current_user.id,
            UserTrackEnrollment.status == "active",
        )
        .order_by(UserTrackEnrollment.updated_at.desc())
        .limit(1)
    )
    if active_track is None:
        active_track = db.scalar(
            select(LearningTrack.name)
            .join(UserTrackEnrollment, UserTrackEnrollment.track_id == LearningTrack.id)
            .where(UserTrackEnrollment.user_id == current_user.id)
            .order_by(UserTrackEnrollment.updated_at.desc())
            .limit(1)
        )

    completed_milestones = db.scalar(
        select(func.count(UserMilestoneCompletion.id)).where(
            UserMilestoneCompletion.user_id == current_user.id
        )
    ) or 0

    squad = db.execute(
        select(StudySquad.name, StudySquad.weekly_goal_lessons)
        .join(SquadMembership, SquadMembership.squad_id == StudySquad.id)
        .where(SquadMembership.user_id == current_user.id)
        .order_by(SquadMembership.joined_at.desc())
        .limit(1)
    ).first()

    squad_name = None
    weekly_goal_target = DEFAULT_WEEKLY_LESSON_GOAL
    if squad:
        squad_name = squad[0]
        weekly_goal_target = max(1, int(squad[1]))

    weekly_goal_progress = min(
        round((lessons_completed_week / max(1, weekly_goal_target)) * 100, 1),
        100.0,
    )

    entitlements = product_growth_service.get_entitlements(db, current_user)
    if entitlements["subscription_status"] == "free":
        # Persists credit reset performed inside product growth service.
        db.commit()

    earned_advanced_access = (
        current_user.xp >= ADVANCED_UNLOCK_XP_REQUIRED
        or completed_lessons >= ADVANCED_UNLOCK_LESSONS_REQUIRED
    )
    can_access_advanced_topics = entitlements["can_access_premium"] or earned_advanced_access

    return DashboardStats(
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        completion_rate=completion_rate,
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        daily_xp=daily_xp,
        weekly_xp=weekly_xp,
        weekly_goal_progress=weekly_goal_progress,
        completed_lesson_ids=completed_lesson_ids,
        active_track=active_track,
        completed_milestones=completed_milestones,
        squad_name=squad_name,
        subscription_status=entitlements["subscription_status"],
        earned_advanced_access=earned_advanced_access,
        can_access_advanced_topics=can_access_advanced_topics,
        advanced_unlock_xp_required=ADVANCED_UNLOCK_XP_REQUIRED,
        advanced_unlock_lessons_required=ADVANCED_UNLOCK_LESSONS_REQUIRED,
    )
