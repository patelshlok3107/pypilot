from datetime import datetime

from pydantic import BaseModel


class MonthlyReportOut(BaseModel):
    id: str
    report_month: str
    skill_score: int
    strengths: list[str]
    weaknesses: list[str]
    improvement_plan: list[str]
    generated_at: datetime


class ReportGenerationResponse(BaseModel):
    report_id: str
    report_month: str
    generated_at: datetime


class PremiumReportInsightOut(BaseModel):
    report_month: str
    generated_at: datetime
    diagnostics: list[str]
    risk_flags: list[str]
    career_actions: list[str]
    tools_used_in_companies: list[str]
    next_30_day_blueprint: list[str]
    company_benchmark_note: str
