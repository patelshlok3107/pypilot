from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Achievement, DailyMission, User, UserAchievement, UserMission
from app.db.session import get_db
from app.schemas.gamification import AchievementOut, DailyMissionOut, GamificationSummary
from app.services.gamification import gamification_service

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/summary", response_model=GamificationSummary)
def summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GamificationSummary:
    # Rank is computed by counting users with higher XP.
    higher_xp_users = db.scalar(
        select(func.count(User.id)).where(User.xp > current_user.xp)
    ) or 0
    return GamificationSummary(
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        next_level_xp=gamification_service.next_level_xp(current_user.level),
        leaderboard_rank=higher_xp_users + 1,
    )


@router.get("/leaderboard")
def leaderboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[dict]:
    users = db.scalars(select(User).order_by(desc(User.xp)).limit(20)).all()
    return [
        {
            "rank": idx,
            "user_id": user.id,
            "name": user.full_name,
            "xp": user.xp,
            "level": user.level,
        }
        for idx, user in enumerate(users, start=1)
    ]


@router.get("/achievements", response_model=list[AchievementOut])
def achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AchievementOut]:
    unlocked_ids = {
        achievement_id
        for achievement_id in db.scalars(
            select(UserAchievement.achievement_id).where(UserAchievement.user_id == current_user.id)
        )
    }

    all_achievements = db.scalars(select(Achievement).order_by(Achievement.id)).all()
    return [
        AchievementOut(
            id=achievement.id,
            code=achievement.code,
            name=achievement.name,
            description=achievement.description,
            xp_bonus=achievement.xp_bonus,
            icon=achievement.icon,
            unlocked=achievement.id in unlocked_ids,
        )
        for achievement in all_achievements
    ]


@router.get("/daily-missions", response_model=list[DailyMissionOut])
def daily_missions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DailyMissionOut]:
    today_missions = db.scalars(
        select(DailyMission).where(DailyMission.mission_date == datetime.utcnow().date())
    ).all()

    completed_ids = {
        row.mission_id
        for row in db.scalars(
            select(UserMission).where(UserMission.user_id == current_user.id, UserMission.completed.is_(True))
        )
    }

    return [
        DailyMissionOut(
            mission_id=mission.id,
            title=mission.title,
            description=mission.description,
            xp_reward=mission.xp_reward,
            completed=mission.id in completed_ids,
        )
        for mission in today_missions
    ]


@router.post("/daily-missions/{mission_id}/complete", response_model=GamificationSummary)
def complete_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GamificationSummary:
    mission = db.scalar(
        select(DailyMission).where(
            DailyMission.id == mission_id,
            DailyMission.mission_date == datetime.utcnow().date(),
        )
    )
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    user_mission = db.scalar(
        select(UserMission).where(UserMission.user_id == current_user.id, UserMission.mission_id == mission.id)
    )

    if not user_mission:
        user_mission = UserMission(user_id=current_user.id, mission_id=mission.id)
        db.add(user_mission)

    if not user_mission.completed:
        user_mission.completed = True
        user_mission.completed_at = datetime.utcnow()
        gamification_service.award_xp(db, current_user, mission.xp_reward)
        gamification_service.update_streak(current_user)
        gamification_service.evaluate_achievements(db, current_user)

    db.commit()
    db.refresh(current_user)

    higher_xp_users = db.scalar(select(func.count(User.id)).where(User.xp > current_user.xp)) or 0
    return GamificationSummary(
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        next_level_xp=gamification_service.next_level_xp(current_user.level),
        leaderboard_rank=higher_xp_users + 1,
    )
