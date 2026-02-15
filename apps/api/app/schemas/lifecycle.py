from pydantic import BaseModel, Field


class LifecycleEventRequest(BaseModel):
    event_type: str = Field(min_length=2, max_length=80)
    metadata_json: dict | None = None


class CampaignMessageOut(BaseModel):
    id: int
    campaign_type: str
    status: str
    channel: str
    scheduled_for: str


class CampaignTriggerResponse(BaseModel):
    created_campaigns: int
