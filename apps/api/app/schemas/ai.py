from pydantic import BaseModel, Field


class ExplainConceptRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=120)
    student_level: str = Field(default="beginner", max_length=40)
    context: str | None = Field(default=None, max_length=4000)


class DebugCodeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=20000)
    error_message: str = Field(min_length=1, max_length=4000)


class PracticeProblemRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=120)
    difficulty: str = Field(default="easy", max_length=20)


class AITutorResponse(BaseModel):
    response: str
    ai_credits_remaining: int | None = None


class PracticeProblemResponse(BaseModel):
    title: str
    prompt: str
    starter_code: str
    hint: str
    ai_credits_remaining: int | None = None
