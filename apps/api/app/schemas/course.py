from datetime import datetime

from pydantic import BaseModel, Field


class QuizQuestionOut(BaseModel):
    id: int
    prompt: str
    options: list[str]
    correct_option: int
    explanation: str


class CodingChallengeOut(BaseModel):
    id: int
    title: str
    prompt: str
    starter_code: str
    difficulty: str
    xp_reward: int


class LessonOut(BaseModel):
    id: int
    title: str
    objective: str
    content_md: str
    order_index: int
    estimated_minutes: int
    quiz_questions: list[QuizQuestionOut]
    coding_challenges: list[CodingChallengeOut]


class ModuleOut(BaseModel):
    id: int
    title: str
    description: str
    order_index: int
    xp_reward: int
    lessons: list[LessonOut]


class CourseOut(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    difficulty: str
    order_index: int
    modules: list[ModuleOut]


class LessonPremiumCompanyUseOut(BaseModel):
    concept: str
    project_example: str
    architecture: list[str]
    career_relevance: str
    salary_relevance: str
    tools: list[str]


class LessonPremiumInsightOut(BaseModel):
    lesson_id: int
    topic: str
    analogy: str
    mental_model: str
    step_reasoning: list[str]
    level_breakdown: list[str]
    professional_care: str
    expert_insights: list[str]
    case_study: str
    pro_tips: list[str]
    performance_tricks: list[str]
    production_scenarios: list[str]
    company_use: LessonPremiumCompanyUseOut
    summary: str


class LessonCompletionRequest(BaseModel):
    quiz_score: int | None = Field(default=None, ge=0, le=100)
    challenge_passed: bool = False
    attempt_id: int | None = None
    dwell_seconds: int = Field(default=0, ge=0, le=36000)


class LessonCompletionResponse(BaseModel):
    lesson_id: int
    status: str
    xp_awarded: int
    level: int
    total_xp: int


class ChallengeSubmissionRequest(BaseModel):
    challenge_id: int
    code: str


class ChallengeSubmissionResponse(BaseModel):
    submission_id: str
    passed: bool
    output: str | None
    ai_feedback: str | None
    created_at: datetime
