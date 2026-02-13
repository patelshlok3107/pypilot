import time

from sqlalchemy import event
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.services.observability import observability_service

engine_options: dict = {"pool_pre_ping": True}
if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.perf_counter()


@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start = getattr(context, "_query_start_time", None)
    if start is None:
        return
    duration_ms = (time.perf_counter() - start) * 1000
    if duration_ms >= 250:
        observability_service.record_slow_query(statement, duration_ms)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
