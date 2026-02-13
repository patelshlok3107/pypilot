import base64

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import ProjectAssessment, User
from app.db.session import get_db
from app.schemas.project import (
    PortfolioExportOut,
    ProjectAssessmentCreateRequest,
    ProjectAssessmentOut,
)
from app.services.audit import log_event
from app.services.project_assessment import project_assessment_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/assess", response_model=ProjectAssessmentOut)
def create_assessment(
    payload: ProjectAssessmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectAssessmentOut:
    record = project_assessment_service.create_assessment(
        db=db,
        user=current_user,
        title=payload.title,
        submission_md=payload.submission_md,
        rubric_json=payload.rubric_json,
        lesson_id=payload.lesson_id,
    )
    log_event(
        db,
        "project.assessed",
        user_id=current_user.id,
        entity_type="project_assessment",
        entity_id=record.id,
        payload={"score": record.score, "title": record.title},
    )
    db.commit()
    db.refresh(record)
    return ProjectAssessmentOut(
        id=record.id,
        title=record.title,
        score=record.score,
        rubric_json=record.rubric_json,
        feedback_json=record.feedback_json,
        portfolio_readme_md=record.portfolio_readme_md,
        created_at=record.created_at,
    )


@router.get("/assessments", response_model=list[ProjectAssessmentOut])
def list_assessments(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectAssessmentOut]:
    rows = db.scalars(
        select(ProjectAssessment)
        .where(ProjectAssessment.user_id == current_user.id)
        .order_by(desc(ProjectAssessment.created_at))
        .limit(max(1, min(limit, 100)))
    ).all()
    return [
        ProjectAssessmentOut(
            id=item.id,
            title=item.title,
            score=item.score,
            rubric_json=item.rubric_json,
            feedback_json=item.feedback_json,
            portfolio_readme_md=item.portfolio_readme_md,
            created_at=item.created_at,
        )
        for item in rows
    ]


@router.get("/assessments/{assessment_id}/export", response_model=PortfolioExportOut)
def export_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PortfolioExportOut:
    record = db.scalar(
        select(ProjectAssessment).where(
            ProjectAssessment.id == assessment_id,
            ProjectAssessment.user_id == current_user.id,
        )
    )
    if not record:
        raise HTTPException(status_code=404, detail="Project assessment not found")

    pdf_bytes = project_assessment_service.export_simple_pdf(record.title, record.portfolio_readme_md)
    pdf_b64 = base64.b64encode(pdf_bytes).decode("ascii")
    return PortfolioExportOut(
        assessment_id=record.id,
        readme_md=record.portfolio_readme_md,
        pdf_base64=pdf_b64,
    )
