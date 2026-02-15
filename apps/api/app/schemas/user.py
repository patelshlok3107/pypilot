from datetime import datetime

from pydantic import BaseModel, EmailStr


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
    weekly_goal_progress: float
    active_track: str | None = None
    completed_milestones: int = 0
    squad_name: str | None = None
    subscription_status: str | None = None


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
    ai_credits_remaining: int
    priority_debug_queue: bool
