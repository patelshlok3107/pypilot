from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import LessonProgress, MonthlyReport, Submission, User


class ReportingService:
    def generate_monthly_report(self, db: Session, user: User, report_month: str) -> MonthlyReport:
        year, month = report_month.split("-")
        month_start = datetime(int(year), int(month), 1)
        if int(month) == 12:
            month_end = datetime(int(year) + 1, 1, 1)
        else:
            month_end = datetime(int(year), int(month) + 1, 1)

        completed_lessons = db.scalar(
            select(func.count(LessonProgress.id)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.status == "completed",
                LessonProgress.completed_at >= month_start,
                LessonProgress.completed_at < month_end,
            )
        ) or 0

        average_quiz_score = db.scalar(
            select(func.avg(LessonProgress.quiz_score)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.quiz_score.is_not(None),
                LessonProgress.completed_at >= month_start,
                LessonProgress.completed_at < month_end,
            )
        )
        average_quiz_score = float(average_quiz_score) if average_quiz_score is not None else 0.0

        submission_total = db.scalar(
            select(func.count(Submission.id)).where(
                Submission.user_id == user.id,
                Submission.created_at >= month_start,
                Submission.created_at < month_end,
            )
        ) or 0

        passed_total = db.scalar(
            select(func.count(Submission.id)).where(
                Submission.user_id == user.id,
                Submission.passed.is_(True),
                Submission.created_at >= month_start,
                Submission.created_at < month_end,
            )
        ) or 0

        pass_rate = (passed_total / submission_total * 100) if submission_total else 0.0

        activity_score = min(100, completed_lessons * 8)
        skill_score = int((average_quiz_score * 0.45) + (pass_rate * 0.35) + (activity_score * 0.2))

        strengths: list[str] = []
        weaknesses: list[str] = []
        plan: list[str] = []

        if average_quiz_score >= 75:
            strengths.append("Strong concept understanding in quizzes")
        else:
            weaknesses.append("Quiz fundamentals need reinforcement")
            plan.append("Complete 3 revision quizzes weekly with AI hints enabled")

        if pass_rate >= 65:
            strengths.append("Solid coding challenge pass rate")
        else:
            weaknesses.append("Debugging consistency in coding tasks")
            plan.append("Run 15-minute daily debugging drills in Playground")

        if completed_lessons >= 8:
            strengths.append("High learning consistency")
        else:
            weaknesses.append("Learning frequency is below target")
            plan.append("Set a daily mission to complete one lesson every day")

        if not strengths:
            strengths.append("Consistent platform usage")
        if not weaknesses:
            weaknesses.append("Advanced topics practice is still limited")
            plan.append("Move into one advanced module and submit a mini-project")

        existing = db.scalar(
            select(MonthlyReport).where(
                MonthlyReport.user_id == user.id,
                MonthlyReport.report_month == report_month,
            )
        )

        if existing:
            existing.skill_score = skill_score
            existing.strengths = strengths
            existing.weaknesses = weaknesses
            existing.improvement_plan = plan
            existing.generated_at = datetime.utcnow()
            return existing

        report = MonthlyReport(
            user_id=user.id,
            report_month=report_month,
            skill_score=skill_score,
            strengths=strengths,
            weaknesses=weaknesses,
            improvement_plan=plan,
            generated_at=datetime.utcnow(),
        )
        db.add(report)
        return report


reporting_service = ReportingService()
