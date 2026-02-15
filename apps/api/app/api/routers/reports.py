from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import MonthlyReport, User
from app.db.session import get_db
from app.schemas.report import MonthlyReportOut, PremiumReportInsightOut, ReportGenerationResponse
from app.services.premium_reporting import premium_reporting_service
from app.services.product_growth import product_growth_service
from app.services.reporting import reporting_service

router = APIRouter(prefix="/reports", tags=["reports"])


def current_report_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


@router.get("/monthly/current", response_model=MonthlyReportOut)
def get_current_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthlyReportOut:
    month = current_report_month()
    report = db.scalar(
        select(MonthlyReport).where(
            MonthlyReport.user_id == current_user.id,
            MonthlyReport.report_month == month,
        )
    )

    if not report:
        report = reporting_service.generate_monthly_report(db, current_user, month)
        db.commit()
        db.refresh(report)

    return MonthlyReportOut(
        id=report.id,
        report_month=report.report_month,
        skill_score=report.skill_score,
        strengths=report.strengths,
        weaknesses=report.weaknesses,
        improvement_plan=report.improvement_plan,
        generated_at=report.generated_at,
    )


@router.post("/monthly/generate", response_model=ReportGenerationResponse)
def generate_monthly_report(
    month: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportGenerationResponse:
    target_month = month or current_report_month()
    if len(target_month) != 7 or target_month[4] != "-":
        raise HTTPException(status_code=422, detail="Month must be in YYYY-MM format")

    report = reporting_service.generate_monthly_report(db, current_user, target_month)
    db.commit()
    db.refresh(report)

    return ReportGenerationResponse(
        report_id=report.id,
        report_month=report.report_month,
        generated_at=report.generated_at,
    )


@router.get("/monthly/current/premium-insights", response_model=PremiumReportInsightOut)
def get_current_premium_report_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PremiumReportInsightOut:
    entitlements = product_growth_service.get_entitlements(db, current_user)
    if not entitlements["can_access_premium"]:
        raise HTTPException(status_code=403, detail="Upgrade required for premium report insights")

    month = current_report_month()
    report = db.scalar(
        select(MonthlyReport).where(
            MonthlyReport.user_id == current_user.id,
            MonthlyReport.report_month == month,
        )
    )
    if not report:
        report = reporting_service.generate_monthly_report(db, current_user, month)
        db.commit()
        db.refresh(report)

    return premium_reporting_service.build_premium_insights(report)
