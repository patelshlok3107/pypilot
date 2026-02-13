from datetime import datetime

from pydantic import BaseModel, Field


class LessonAttemptStartRequest(BaseModel):
    dwell_seconds: int = Field(default=0, ge=0, le=36000)
    metadata_json: dict | None = None


class LessonAttemptHeartbeatRequest(BaseModel):
    attempt_id: int
    dwell_seconds: int = Field(default=0, ge=0, le=36000)
    metadata_json: dict | None = None


class LessonAttemptOut(BaseModel):
    attempt_id: int
    lesson_id: int
    status: str
    dwell_seconds: int
    challenge_passed: bool
    anti_fake_passed: bool
    created_at: datetime
    updated_at: datetime


class ModuleGateOut(BaseModel):
    module_id: int
    unlocked: bool
    mastered: bool
    average_quiz_score: int
    lessons_completed: int
    total_lessons: int
    challenges_passed: int


class LearningRecommendationOut(BaseModel):
    lesson_id: int | None
    lesson_title: str | None
    lesson_objective: str | None
    module_id: int | None
    module_title: str | None
    reason: str
    unlock_reason: str | None = None
