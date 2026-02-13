from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    avatar_url: str | None
    xp: int
    level: int
    streak_days: int


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None


class DashboardStats(BaseModel):
    total_lessons: int
    completed_lessons: int
    completion_rate: float
    xp: int
    level: int
    streak_days: int
    daily_xp: int = 0
    weekly_xp: int = 0
    weekly_goal_progress: float
    completed_lesson_ids: list[int] = Field(default_factory=list)
    active_track: str | None = None
    completed_milestones: int = 0
    squad_name: str | None = None
    subscription_status: str | None = None
    earned_advanced_access: bool = False
    can_access_advanced_topics: bool = False
    advanced_unlock_xp_required: int = 1800
    advanced_unlock_lessons_required: int = 12


class SubmissionOut(BaseModel):
    id: str
    challenge_id: int | None
    passed: bool
    output: str | None
    ai_feedback: str | None
    created_at: datetime


class UserEntitlements(BaseModel):
    plan_tier: str
    subscription_status: str
    can_access_premium: bool
    has_earned_premium_access: bool = False
    ai_credits_remaining: int
    priority_debug_queue: bool
