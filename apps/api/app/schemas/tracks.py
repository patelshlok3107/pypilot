from pydantic import BaseModel, Field


class TrackOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    outcome: str
    target_audience: str
    premium_only: bool
    enrolled: bool
    readiness_score: int


class TrackEnrollRequest(BaseModel):
    track_slug: str = Field(min_length=3, max_length=120)


class TrackMilestoneOut(BaseModel):
    id: int
    title: str
    description: str
    required_lessons: int
    required_avg_quiz_score: int
    required_challenges_passed: int
    reward_xp: int
    order_index: int
    completed: bool


class MilestoneCompleteResponse(BaseModel):
    milestone_id: int
    completed: bool
    completion_score: int
    xp_awarded: int


class CertificateOut(BaseModel):
    id: str
    title: str
    verification_code: str
    issued_at: str


class TranscriptOut(BaseModel):
    total_lessons_completed: int
    average_quiz_score: float
    challenges_passed: int
    current_level: int
    total_xp: int
    enrolled_tracks: list[str]
