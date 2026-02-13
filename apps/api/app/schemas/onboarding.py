from pydantic import BaseModel, EmailStr, Field


class DiagnosticQuestion(BaseModel):
    id: int
    prompt: str
    options: list[str]


class OnboardingQuestionsResponse(BaseModel):
    goals: list[str]
    questions: list[DiagnosticQuestion]


class OnboardingCompleteRequest(BaseModel):
    learning_goal: str = Field(min_length=3, max_length=80)
    selected_track_slug: str | None = None
    parent_email: EmailStr | None = None
    answers: list[int] = Field(default_factory=list)


class OnboardingStatusResponse(BaseModel):
    onboarding_complete: bool
    learning_goal: str | None
    diagnostic_score: int | None
    recommended_track_slug: str | None
    ai_credits_remaining: int
