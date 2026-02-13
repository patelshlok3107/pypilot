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


class ModuleAdminUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order_index: int | None = None
    xp_reward: int | None = None


class LessonAdminUpdate(BaseModel):
    title: str | None = None
    objective: str | None = None
    content_md: str | None = None
    order_index: int | None = None
    estimated_minutes: int | None = None


class TrackAdminUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    outcome: str | None = None
    target_audience: str | None = None
    premium_only: bool | None = None
    order_index: int | None = None


class AdminHealthResponse(BaseModel):
    total_requests: int
    total_errors: int
    avg_latency_ms: float
    p95_latency_ms: float
    slow_requests: int
    routes: dict[str, int]
    slow_queries: list[dict] = []
