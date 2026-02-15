from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import CampaignMessage, LifecycleEvent, User
from app.db.session import get_db
from app.schemas.lifecycle import (
    CampaignMessageOut,
    CampaignTriggerResponse,
    LifecycleEventRequest,
)

router = APIRouter(prefix="/lifecycle", tags=["lifecycle"])


@router.post("/events")
def log_event(
    payload: LifecycleEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    event = LifecycleEvent(
        user_id=current_user.id,
        event_type=payload.event_type,
        metadata_json=payload.metadata_json,
    )
    db.add(event)
    db.commit()
    return {"success": True, "event_id": event.id}


@router.post("/campaigns/plan", response_model=CampaignTriggerResponse)
def plan_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignTriggerResponse:
    now = datetime.utcnow()
    templates = [
        ("day_1_win", 0, "Celebrate your first day and suggest next lesson"),
        ("day_3_recovery", 2, "Streak recovery nudge with quick mission"),
        ("day_7_upgrade", 6, "Personalized upgrade pitch with progress snapshot"),
    ]

    created = 0
    for campaign_type, offset_days, message in templates:
        exists = db.scalar(
            select(CampaignMessage).where(
                CampaignMessage.user_id == current_user.id,
                CampaignMessage.campaign_type == campaign_type,
            )
        )
        if exists:
            continue

        db.add(
            CampaignMessage(
                user_id=current_user.id,
                campaign_type=campaign_type,
                status="scheduled",
                channel="email",
                payload_json={"message": message},
                scheduled_for=now + timedelta(days=offset_days),
            )
        )
        created += 1

    db.commit()
    return CampaignTriggerResponse(created_campaigns=created)


@router.get("/campaigns/me", response_model=list[CampaignMessageOut])
def my_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CampaignMessageOut]:
    rows = db.scalars(
        select(CampaignMessage)
        .where(CampaignMessage.user_id == current_user.id)
        .order_by(CampaignMessage.scheduled_for.asc())
        .limit(20)
    ).all()

    return [
        CampaignMessageOut(
            id=item.id,
            campaign_type=item.campaign_type,
            status=item.status,
            channel=item.channel,
            scheduled_for=item.scheduled_for.isoformat(),
        )
        for item in rows
    ]
