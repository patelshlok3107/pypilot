from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.playground import CodeRunRequest, CodeRunResponse
from app.services.ai_tutor import ai_tutor_service
from app.services.code_runner import code_runner_service
from app.services.product_growth import product_growth_service

router = APIRouter(prefix="/playground", tags=["playground"])


@router.post("/run", response_model=CodeRunResponse)
async def run_code(
    payload: CodeRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CodeRunResponse:
    result = await code_runner_service.run_python(payload.code, payload.stdin or "")

    ai_error_explanation = None
    stderr = result.get("stderr", "")
    if stderr:
        if product_growth_service.consume_ai_credit(db, current_user, amount=1):
            ai_error_explanation = await ai_tutor_service.debug_code(
                code=payload.code,
                error_message=stderr,
            )
        else:
            ai_error_explanation = (
                "Daily AI debug credits exhausted. Continue practicing or upgrade to Pro for unlimited AI debugging."
            )

    db.commit()

    return CodeRunResponse(
        stdout=result.get("stdout", ""),
        stderr=stderr,
        exit_code=result.get("exit_code", 1),
        execution_time_ms=result.get("execution_time_ms", 0),
        ai_error_explanation=ai_error_explanation,
    )
