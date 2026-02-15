from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.user import (
    DashboardStats,
    UserEntitlements,
    UserPublic,
)

router = APIRouter(prefix="/users", tags=["users"])

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
    from app.services.product_growth import product_growth_service
    entitlements = product_growth_service.get_entitlements(db, current_user)
    return UserEntitlements(**entitlements)

@router.get("/me/dashboard", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardStats:
    # Simplified version for offline mode - return mock data
    return DashboardStats(
        total_lessons=12,
        completed_lessons=5,
        completion_rate=41.7,
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        weekly_goal_progress=71.4,
        active_track="Python Fundamentals",
        completed_milestones=3,
        squad_name=None,
        subscription_status="active",
    )