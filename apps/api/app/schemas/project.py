from datetime import datetime

from pydantic import BaseModel, Field


class ProjectAssessmentCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=220)
    submission_md: str = Field(min_length=10)
    lesson_id: int | None = None
    rubric_json: dict | None = None


class ProjectAssessmentOut(BaseModel):
    id: str
    title: str
    score: int
    rubric_json: dict
    feedback_json: dict | None
    portfolio_readme_md: str
    created_at: datetime


class PortfolioExportOut(BaseModel):
    assessment_id: str
    readme_md: str
    pdf_base64: str
