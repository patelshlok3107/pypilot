import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    admin,
    ai_tutor,
    ai_tutor_chat,
    auth,
    courses,
    economy,
    gamification,
    learning,
    lifecycle,
    onboarding,
    payments,
    playground,
    progress,
    projects,
    reports,
    squads,
    tracks,
    trust,
    users,
)
from app.core.config import settings
from app.db.models import Base
from app.db.schema_compat import ensure_schema_compatibility
from app.db.seed import seed_database
from app.db.session import SessionLocal, engine
from app.services.observability import observability_service

app = FastAPI(
    title="PyPilot Learning SaaS API",
    description="AI-powered Python learning platform backend",
    version="1.0.0",
)


@app.get("/")
async def root():
    return {
        "message": "PyPilot API is running",
        "status": "ok",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_observability(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - started) * 1000
    route = request.url.path
    observability_service.record(route, duration_ms, response.status_code)
    return response


@app.on_event("startup")
def on_startup() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        ensure_schema_compatibility(engine)
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Continuing without database - some features may be limited")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/test-poe")
async def test_poe() -> dict[str, str]:
    from app.services.ai_tutor import ai_tutor_service
    try:
        response = await ai_tutor_service.generate_practice("functions", "easy")
        return {"status": "success", "response": response}
    except Exception as e:
        return {"status": "error", "message": str(e)}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(learning.router)
app.include_router(progress.router)
app.include_router(economy.router)
app.include_router(playground.router)
app.include_router(ai_tutor.router)
app.include_router(ai_tutor_chat.router)
app.include_router(gamification.router)
app.include_router(reports.router)
app.include_router(projects.router)
app.include_router(payments.router)
app.include_router(onboarding.router)
app.include_router(tracks.router)
app.include_router(squads.router)
app.include_router(lifecycle.router)
app.include_router(trust.router)
app.include_router(admin.router)
