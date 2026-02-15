from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import SquadMembership, SquadWeeklyProgress, StudySquad, User
from app.db.session import get_db
from app.schemas.squads import (
    CreateSquadRequest,
    JoinSquadRequest,
    LogSquadProgressRequest,
    SquadLeaderboardRow,
    SquadMemberOut,
    SquadOut,
)

router = APIRouter(prefix="/squads", tags=["squads"])


def current_week_start() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


def build_squad_view(db: Session, squad: StudySquad) -> SquadOut:
    week = current_week_start()
    members = db.scalars(select(SquadMembership).where(SquadMembership.squad_id == squad.id)).all()

    member_views: list[SquadMemberOut] = []
    for member in members:
        progress = db.scalar(
            select(SquadWeeklyProgress).where(
                SquadWeeklyProgress.squad_id == squad.id,
                SquadWeeklyProgress.user_id == member.user_id,
                SquadWeeklyProgress.week_start == week,
            )
        )
        member_views.append(
            SquadMemberOut(
                user_id=member.user_id,
                full_name=member.user.full_name,
                role=member.role,
                lessons_completed_week=progress.lessons_completed if progress else 0,
                goal_target=progress.goal_target if progress else squad.weekly_goal_lessons,
            )
        )

    return SquadOut(
        squad_id=squad.id,
        name=squad.name,
        join_code=squad.join_code,
        weekly_goal_lessons=squad.weekly_goal_lessons,
        members=member_views,
    )


@router.post("", response_model=SquadOut)
def create_squad(
    payload: CreateSquadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SquadOut:
    code = current_user.id[:4].upper() + payload.name[:4].upper().replace(" ", "")
    code = code[:8]

    existing = db.scalar(select(StudySquad).where(StudySquad.join_code == code))
    if existing:
        code = (code + current_user.id[-4:].upper())[:12]

    squad = StudySquad(
        name=payload.name,
        join_code=code,
        owner_user_id=current_user.id,
        weekly_goal_lessons=payload.weekly_goal_lessons,
    )
    db.add(squad)
    db.flush()

    db.add(SquadMembership(squad_id=squad.id, user_id=current_user.id, role="owner"))
    db.commit()

    squad = db.scalar(select(StudySquad).where(StudySquad.id == squad.id))
    return build_squad_view(db, squad)


@router.post("/join", response_model=SquadOut)
def join_squad(
    payload: JoinSquadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SquadOut:
    squad = db.scalar(select(StudySquad).where(StudySquad.join_code == payload.join_code.upper()))
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")

    existing = db.scalar(
        select(SquadMembership).where(
            SquadMembership.squad_id == squad.id,
            SquadMembership.user_id == current_user.id,
        )
    )
    if not existing:
        db.add(SquadMembership(squad_id=squad.id, user_id=current_user.id, role="member"))
        db.commit()

    return build_squad_view(db, squad)


@router.get("/me", response_model=list[SquadOut])
def my_squads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SquadOut]:
    memberships = db.scalars(
        select(SquadMembership).where(SquadMembership.user_id == current_user.id)
    ).all()
    squads = [item.squad for item in memberships]
    return [build_squad_view(db, squad) for squad in squads]


@router.post("/{squad_id}/progress", response_model=SquadOut)
def log_squad_progress(
    squad_id: str,
    payload: LogSquadProgressRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SquadOut:
    squad = db.scalar(select(StudySquad).where(StudySquad.id == squad_id))
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")

    membership = db.scalar(
        select(SquadMembership).where(
            SquadMembership.squad_id == squad_id,
            SquadMembership.user_id == current_user.id,
        )
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Join this squad to log progress")

    week = current_week_start()
    progress = db.scalar(
        select(SquadWeeklyProgress).where(
            SquadWeeklyProgress.squad_id == squad_id,
            SquadWeeklyProgress.user_id == current_user.id,
            SquadWeeklyProgress.week_start == week,
        )
    )
    if not progress:
        progress = SquadWeeklyProgress(
            squad_id=squad_id,
            user_id=current_user.id,
            week_start=week,
            lessons_completed=0,
            goal_target=squad.weekly_goal_lessons,
        )
        db.add(progress)

    progress.lessons_completed += payload.lessons_completed
    progress.goal_target = squad.weekly_goal_lessons
    db.commit()

    return build_squad_view(db, squad)


@router.get("/leaderboard", response_model=list[SquadLeaderboardRow])
def squad_leaderboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[SquadLeaderboardRow]:
    week = current_week_start()

    rows = db.execute(
        select(
            StudySquad.id,
            StudySquad.name,
            func.coalesce(func.sum(SquadWeeklyProgress.lessons_completed), 0).label("total_lessons"),
            func.count(func.distinct(SquadMembership.user_id)).label("members_count"),
        )
        .join(SquadMembership, SquadMembership.squad_id == StudySquad.id)
        .outerjoin(
            SquadWeeklyProgress,
            (
                (SquadWeeklyProgress.squad_id == StudySquad.id)
                & (SquadWeeklyProgress.week_start == week)
            ),
        )
        .group_by(StudySquad.id, StudySquad.name)
        .order_by(desc("total_lessons"))
        .limit(20)
    ).all()

    return [
        SquadLeaderboardRow(
            squad_id=item.id,
            squad_name=item.name,
            total_lessons_week=int(item.total_lessons or 0),
            members_count=int(item.members_count or 0),
        )
        for item in rows
    ]
