from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import EventLog


def log_event(
    db: Session,
    event_type: str,
    *,
    user_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    severity: str = "info",
    payload: dict | None = None,
) -> EventLog:
    event = EventLog(
        user_id=user_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        severity=severity,
        payload_json=payload,
    )
    db.add(event)
    return event
