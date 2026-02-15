from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import LearningTrack, LifecycleEvent, User, UserLearningProfile
from app.db.session import get_db
from app.schemas.onboarding import (
    DiagnosticQuestion,
    OnboardingCompleteRequest,
    OnboardingQuestionsResponse,
    OnboardingStatusResponse,
)
from app.services.product_growth import product_growth_service

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

DIAGNOSTIC_QUESTIONS = [
    {
        "prompt": "What is the output type of `7 / 2` in Python 3?",
        "options": ["int", "float", "str", "bool"],
        "correct": 1,
    },
    {
        "prompt": "Which structure gives average O(1) key lookup?",
        "options": ["list", "set", "dict", "tuple"],
        "correct": 2,
    },
    {
        "prompt": "Best way to avoid crash while parsing invalid int string?",
        "options": ["for loop", "try/except", "lambda", "assert only"],
        "correct": 1,
    },
    {
        "prompt": "Which library is most commonly used for tabular data?",
        "options": ["matplotlib", "numpy", "pandas", "requests"],
        "correct": 2,
    },
]

GOALS = [
    "School/College Python",
    "Data/AI Career",
    "Interview Prep",
]


@router.get("/questions", response_model=OnboardingQuestionsResponse)
def onboarding_questions(_: User = Depends(get_current_user)) -> OnboardingQuestionsResponse:
    questions = [
        DiagnosticQuestion(id=index + 1, prompt=item["prompt"], options=item["options"])
        for index, item in enumerate(DIAGNOSTIC_QUESTIONS)
    ]
    return OnboardingQuestionsResponse(goals=GOALS, questions=questions)


@router.get("/status", response_model=OnboardingStatusResponse)
def onboarding_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingStatusResponse:
    profile = product_growth_service.get_or_create_profile(db, current_user)
    db.commit()

    return OnboardingStatusResponse(
        onboarding_complete=profile.onboarding_complete,
        learning_goal=profile.learning_goal,
        diagnostic_score=profile.diagnostic_score,
        recommended_track_slug=profile.recommended_track_slug,
        ai_credits_remaining=profile.ai_credits_remaining,
    )


@router.post("/complete", response_model=OnboardingStatusResponse)
def complete_onboarding(
    payload: OnboardingCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OnboardingStatusResponse:
    profile = product_growth_service.get_or_create_profile(db, current_user)

    score = 0
    for index, answer in enumerate(payload.answers):
        if index >= len(DIAGNOSTIC_QUESTIONS):
            break
        if answer == DIAGNOSTIC_QUESTIONS[index]["correct"]:
            score += 25

    goal_to_track = {
        "school/college python": "school-college-python",
        "data/ai career": "data-ai-career-track",
        "interview prep": "python-interview-prep",
    }

    selected = payload.selected_track_slug
    if selected:
        track = db.scalar(select(LearningTrack).where(LearningTrack.slug == selected))
        if not track:
            raise HTTPException(status_code=404, detail="Selected track not found")
        recommended_track_slug = selected
    else:
        recommended_track_slug = goal_to_track.get(payload.learning_goal.strip().lower(), "school-college-python")

    profile.onboarding_complete = True
    profile.learning_goal = payload.learning_goal
    profile.diagnostic_score = score
    profile.recommended_track_slug = recommended_track_slug
    profile.parent_email = payload.parent_email

    db.add(
        LifecycleEvent(
            user_id=current_user.id,
            event_type="onboarding_completed",
            metadata_json={
                "goal": payload.learning_goal,
                "diagnostic_score": score,
                "track": recommended_track_slug,
            },
        )
    )

    db.commit()
    db.refresh(profile)

    return OnboardingStatusResponse(
        onboarding_complete=profile.onboarding_complete,
        learning_goal=profile.learning_goal,
        diagnostic_score=profile.diagnostic_score,
        recommended_track_slug=profile.recommended_track_slug,
        ai_credits_remaining=profile.ai_credits_remaining,
    )
