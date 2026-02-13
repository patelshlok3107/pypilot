from __future__ import annotations

from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import (
    CodingChallenge,
    Course,
    Lesson,
    LessonAttempt,
    Module,
    Submission,
    User,
)


def _seed_curriculum(db: Session) -> dict[str, int]:
    course = Course(
        slug="python-core",
        title="Python Core",
        description="Core Python for assessments",
        difficulty="beginner",
        order_index=1,
        is_published=True,
    )
    module_one = Module(
        title="Foundations",
        description="Core basics",
        order_index=1,
        xp_reward=80,
    )
    module_two = Module(
        title="Applied Skills",
        description="Applied practice",
        order_index=2,
        xp_reward=120,
    )
    lesson_one = Lesson(
        title="Variables",
        objective="Understand variables",
        content_md="Learn variables quickly.",
        order_index=1,
        estimated_minutes=1,
    )
    lesson_two = Lesson(
        title="Control Flow",
        objective="Understand if/for",
        content_md="Learn loops and conditions.",
        order_index=1,
        estimated_minutes=1,
    )
    challenge_one = CodingChallenge(
        title="Variables Challenge",
        prompt="Write a variable",
        starter_code="x = 1\nprint(x)",
        tests_json=[{"name": "basic", "input": "", "expected": "1"}],
        difficulty="easy",
        xp_reward=50,
    )

    course.modules.extend([module_one, module_two])
    module_one.lessons.append(lesson_one)
    module_two.lessons.append(lesson_two)
    lesson_one.coding_challenges.append(challenge_one)

    db.add(course)
    db.commit()
    db.refresh(module_one)
    db.refresh(module_two)
    db.refresh(lesson_one)
    db.refresh(lesson_two)
    db.refresh(challenge_one)

    return {
        "module_one_id": module_one.id,
        "module_two_id": module_two.id,
        "lesson_one_id": lesson_one.id,
        "challenge_one_id": challenge_one.id,
    }


def _signup(client: TestClient, *, email: str = "learner@example.com", password: str = "StrongPass123") -> dict:
    response = client.post(
        "/auth/signup",
        json={
            "full_name": "Learner One",
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_auth_cookie_session_and_login_flow(client: TestClient):
    signup_payload = _signup(client)
    user_id = signup_payload["user"]["id"]

    session_resp = client.get("/auth/session")
    assert session_resp.status_code == 200
    assert session_resp.json()["id"] == user_id

    logout_resp = client.post("/auth/logout")
    assert logout_resp.status_code == 200

    session_after_logout = client.get("/auth/session")
    assert session_after_logout.status_code == 401

    login_resp = client.post(
        "/auth/login",
        json={"email": "learner@example.com", "password": "StrongPass123"},
    )
    assert login_resp.status_code == 200

    me_resp = client.get("/users/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["id"] == user_id


def test_learning_recommendation_and_mastery_gate(
    client: TestClient,
    db_session_factory: sessionmaker[Session],
):
    with db_session_factory() as db:
        ids = _seed_curriculum(db)

    _signup(client, email="path@example.com")

    gates_resp = client.get("/learning/gates")
    assert gates_resp.status_code == 200
    gates = gates_resp.json()
    assert len(gates) == 2
    assert gates[0]["module_id"] == ids["module_one_id"]
    assert gates[0]["unlocked"] is True
    assert gates[1]["module_id"] == ids["module_two_id"]
    assert gates[1]["unlocked"] is False

    rec_resp = client.get("/learning/recommendation")
    assert rec_resp.status_code == 200
    rec = rec_resp.json()
    assert rec["lesson_id"] == ids["lesson_one_id"]
    assert rec["module_id"] == ids["module_one_id"]


def test_progress_rejects_fake_completion_and_accepts_real_attempt(
    client: TestClient,
    db_session_factory: sessionmaker[Session],
):
    with db_session_factory() as db:
        ids = _seed_curriculum(db)

    signup_payload = _signup(client, email="progress@example.com")
    user_id = signup_payload["user"]["id"]
    lesson_id = ids["lesson_one_id"]
    challenge_id = ids["challenge_one_id"]

    start_resp = client.post(
        f"/learning/lessons/{lesson_id}/attempts/start",
        json={"dwell_seconds": 0},
    )
    assert start_resp.status_code == 200
    attempt_id = start_resp.json()["attempt_id"]

    fake_complete_resp = client.post(
        f"/progress/lessons/{lesson_id}/complete",
        json={
            "quiz_score": 100,
            "challenge_passed": True,
            "attempt_id": attempt_id,
            "dwell_seconds": 999,
        },
    )
    assert fake_complete_resp.status_code == 422
    assert "Completion rejected" in fake_complete_resp.json()["detail"]

    with db_session_factory() as db:
        attempt = db.scalar(select(LessonAttempt).where(LessonAttempt.id == attempt_id))
        assert attempt is not None
        attempt.created_at = datetime.utcnow() - timedelta(seconds=90)
        attempt.metadata_json = {
            "heartbeat_count": 3,
            "engaged_heartbeat_count": 2,
            "last_heartbeat_at": datetime.utcnow().isoformat(),
        }

        submission = Submission(
            user_id=user_id,
            challenge_id=challenge_id,
            code="x = 1\nprint(x)",
            output="1",
            passed=True,
            ai_feedback=None,
            created_at=datetime.utcnow() - timedelta(seconds=30),
        )
        db.add(submission)
        db.commit()

    real_complete_resp = client.post(
        f"/progress/lessons/{lesson_id}/complete",
        json={
            "quiz_score": 100,
            "challenge_passed": True,
            "attempt_id": attempt_id,
            "dwell_seconds": 90,
        },
    )
    assert real_complete_resp.status_code == 200, real_complete_resp.text
    payload = real_complete_resp.json()
    assert payload["lesson_id"] == lesson_id
    assert payload["status"] == "completed"
    assert payload["xp_awarded"] >= 60

    with db_session_factory() as db:
        user = db.scalar(select(User).where(User.id == user_id))
        assert user is not None
        assert user.xp > 0

