from __future__ import annotations

from app.db.models import MonthlyReport
from app.schemas.report import PremiumReportInsightOut


class PremiumReportingService:
    def build_premium_insights(self, report: MonthlyReport) -> PremiumReportInsightOut:
        score = report.skill_score

        if score >= 80:
            score_band_note = (
                "High-readiness band. You can shift from concept reinforcement to interview and production simulation."
            )
        elif score >= 60:
            score_band_note = (
                "Growth band. You are progressing well, but consistency and debugging depth need focused repetition."
            )
        else:
            score_band_note = (
                "Foundation band. Prioritize fundamentals and daily practice to reduce fragile understanding."
            )

        diagnostics = [
            f"Skill score trend checkpoint: {score}/100 for {report.report_month}.",
            "Execution quality depends on quiz precision + challenge pass consistency, not lesson count alone.",
            "Production readiness improves when you combine correctness, debugging speed, and communication clarity.",
        ]

        risk_flags = [
            "Inconsistent challenge pass rates increase interview and project delivery risk.",
            "Weak quiz recall on core topics creates compounding issues in advanced modules.",
            "Lack of repeated debugging drills slows growth in real coding environments.",
        ]

        career_actions = [
            "Convert one recent lesson into a mini production scenario and document tradeoffs.",
            "Run timed debugging sessions 4 days/week and track root-cause categories.",
            "Publish one portfolio artifact monthly with tests, logs, and architecture notes.",
        ]

        tools = ["Python", "FastAPI", "PostgreSQL", "Docker", "GitHub Actions", "Monitoring dashboards"]

        blueprint = [
            "Week 1: Reinforce weak concepts with 20-minute daily revision loops.",
            "Week 2: Complete 3 coding challenges with post-solution refactoring.",
            "Week 3: Build one API + data workflow and add observability basics.",
            "Week 4: Simulate interview/project review with rubric-based self-evaluation.",
        ]

        return PremiumReportInsightOut(
            report_month=report.report_month,
            generated_at=report.generated_at,
            diagnostics=diagnostics,
            risk_flags=risk_flags,
            career_actions=career_actions,
            tools_used_in_companies=tools,
            next_30_day_blueprint=blueprint,
            company_benchmark_note=score_band_note,
        )


premium_reporting_service = PremiumReportingService()
