from __future__ import annotations

import re

from app.db.models import Lesson
from app.schemas.course import LessonPremiumCompanyUseOut, LessonPremiumInsightOut

PREMIUM_TOPIC_PATTERN = re.compile(
    r"ml|machine learning|prompt|llm|api|automation|numpy|pandas|matplotlib|capstone|ai",
    re.IGNORECASE,
)


def _is_premium_topic(title: str) -> bool:
    return bool(PREMIUM_TOPIC_PATTERN.search(title))


class PremiumLearningService:
    def build_lesson_premium_insight(self, lesson: Lesson) -> LessonPremiumInsightOut:
        topic = lesson.title.strip() or "Python Systems"
        objective = lesson.objective.strip() or "Master this concept with production-ready reasoning."
        premium_topic = _is_premium_topic(topic)

        return LessonPremiumInsightOut(
            lesson_id=lesson.id,
            topic=topic,
            analogy=f"Think of {topic} as a control room: clear inputs, clear decisions, clear outputs.",
            mental_model=(
                "Use a 3-layer map: input signals -> decision logic -> output behavior. "
                "If one layer is weak, production quality drops."
            ),
            step_reasoning=[
                "Define data shape and constraints before coding.",
                "Implement the simplest correct flow first.",
                "Validate edge cases and failure paths explicitly.",
                "Refactor for maintainability and team readability.",
            ],
            level_breakdown=[
                f"Beginner: understand syntax and one practical use case for {topic}.",
                "Intermediate: combine this concept with data structures and modular design.",
                "Advanced: optimize for reliability, scale, and observability in production.",
            ],
            professional_care=(
                "Engineering teams prioritize this because it drives incident rates, "
                "delivery speed, and long-term maintainability."
            ),
            expert_insights=[
                "Senior engineers optimize for clarity first, then speed.",
                "Strong naming and structure reduce onboarding friction.",
                "Most incidents come from hidden assumptions, not syntax mistakes.",
            ],
            case_study=(
                "A student platform moved from ad-hoc scripts to layered modules and reduced "
                "debugging time by making reasoning and failure handling explicit."
            ),
            pro_tips=[
                "Define invariants around critical code paths.",
                "Fail early with precise error messages.",
                "Prefer deterministic outputs for faster testing.",
            ],
            performance_tricks=[
                (
                    "Batch expensive operations and cache reusable artifacts."
                    if premium_topic
                    else "Avoid repeated work inside loops."
                ),
                (
                    "Prefer vectorized/table operations before custom loops."
                    if premium_topic
                    else "Use lookup-friendly structures on hot paths."
                ),
                "Profile first, optimize proven bottlenecks only.",
            ],
            production_scenarios=[
                (
                    "Large-scale model-driven recommendation workflows."
                    if premium_topic
                    else "Validation and transformation pipelines in APIs."
                ),
                (
                    "Automation pipelines with retries, monitoring, and fallbacks."
                    if premium_topic
                    else "Feature rollout and reliability guardrails."
                ),
                "Operational observability with logs, metrics, and alerting.",
            ],
            company_use=LessonPremiumCompanyUseOut(
                concept=f"{topic} is treated as a reliability layer, not just an academic concept.",
                project_example=(
                    "Build an intelligent workflow: ingest data, train baseline, expose API, monitor drift."
                    if premium_topic
                    else "Build a utility service with robust validation, logging, and clear contracts."
                ),
                architecture=[
                    "Client request -> API service -> business logic -> storage/model layer -> response.",
                    "Guardrails: validation, retries, rate limits, structured logs.",
                    "Feedback loop: metrics, incident review, continuous improvements.",
                ],
                career_relevance=(
                    "Relevant to backend engineering, automation engineering, data analysis, and ML product roles."
                ),
                salary_relevance=(
                    "Professionals who convert concepts into production systems are paid more because they "
                    "reduce execution risk."
                ),
                tools=(
                    ["Python", "FastAPI", "Pandas", "NumPy", "scikit-learn", "Docker", "PostgreSQL"]
                    if premium_topic
                    else ["Python", "FastAPI", "PostgreSQL", "Docker", "GitHub Actions", "Monitoring stack"]
                ),
            ),
            summary=(
                f"{objective} "
                "Use this topic to improve reliability, delivery speed, and production quality."
            ),
        )


premium_learning_service = PremiumLearningService()
