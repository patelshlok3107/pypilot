from pydantic import BaseModel


class AdminAnalyticsResponse(BaseModel):
    total_users: int
    paid_users: int
    active_users_last_7_days: int
    total_submissions: int
    average_completion_rate: float


class SubscriptionOverview(BaseModel):
    user_id: str
    email: str
    plan: str
    status: str
    current_period_end: str | None


class CourseAdminUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    difficulty: str | None = None
    is_published: bool | None = None
