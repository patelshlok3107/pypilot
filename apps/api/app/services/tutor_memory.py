from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.models import AITutorMemory, User


class TutorMemoryService:
    def remember(
        self,
        db: Session,
        user: User,
        *,
        category: str,
        topic: str,
        memory_text: str,
        confidence_score: int = 60,
        metadata: dict | None = None,
    ) -> AITutorMemory:
        existing = db.scalar(
            select(AITutorMemory)
            .where(
                AITutorMemory.user_id == user.id,
                AITutorMemory.category == category,
                AITutorMemory.topic == topic,
            )
            .order_by(desc(AITutorMemory.updated_at))
            .limit(1)
        )
        if existing:
            existing.memory_text = memory_text
            existing.confidence_score = max(1, min(100, confidence_score))
            existing.metadata_json = metadata or {}
            return existing

        record = AITutorMemory(
            user_id=user.id,
            category=category,
            topic=topic,
            memory_text=memory_text,
            confidence_score=max(1, min(100, confidence_score)),
            metadata_json=metadata or {},
        )
        db.add(record)
        return record

    def latest_memories(self, db: Session, user_id: str, limit: int = 8) -> list[AITutorMemory]:
        return db.scalars(
            select(AITutorMemory)
            .where(AITutorMemory.user_id == user_id)
            .order_by(desc(AITutorMemory.updated_at))
            .limit(limit)
        ).all()


tutor_memory_service = TutorMemoryService()
