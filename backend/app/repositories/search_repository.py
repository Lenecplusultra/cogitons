# backend/app/repositories/search_repository.py
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.discussion import Discussion
from app.models.subject import Subject
from app.models.vote import Vote


class SearchRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def search_subjects(self, query: str, limit: int = 10) -> list[Subject]:
        pattern = f"%{query}%"
        stmt = (
            select(Subject)
            .where(
                Subject.status == "active",
                Subject.title.ilike(pattern) | Subject.description.ilike(pattern),
            )
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def search_discussions(self, query: str, limit: int = 20) -> list[Discussion]:
        pattern = f"%{query}%"
        stmt = (
            select(Discussion)
            .options(
                joinedload(Discussion.author),
                joinedload(Discussion.subject),
            )
            .where(
                Discussion.status == "published",
                Discussion.title.ilike(pattern) | Discussion.body.ilike(pattern),
            )
            .order_by(Discussion.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_subject_discussion_count(self, subject_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(
            Discussion.subject_id == subject_id,
            Discussion.status != "removed",
        )
        return self.db.scalar(stmt) or 0

    def get_discussion_useful_count(self, discussion_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(
            Vote.target_type == "discussion",
            Vote.target_id == discussion_id,
        )
        return self.db.scalar(stmt) or 0

    def get_discussion_response_count(self, discussion_id: uuid.UUID) -> int:
        from app.models.response import Response

        stmt = select(func.count()).where(
            Response.discussion_id == discussion_id,
            Response.status == "published",
        )
        return self.db.scalar(stmt) or 0
