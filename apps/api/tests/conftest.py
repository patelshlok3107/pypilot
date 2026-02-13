from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.routers import auth, courses, learning, progress, users
from app.db.models import Base
from app.db.session import get_db


@pytest.fixture()
def db_session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture()
def client(db_session_factory: sessionmaker[Session]) -> TestClient:
    app = FastAPI()
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(courses.router)
    app.include_router(learning.router)
    app.include_router(progress.router)

    def override_get_db():
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

