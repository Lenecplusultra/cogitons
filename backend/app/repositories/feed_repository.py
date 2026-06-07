# backend/app/repositories/feed_repository.py
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.discussion import Discussion
from app.models.subject import Subject
from app.models.vote import Vote


class FeedRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_featured_subjects(self, limit: int = 6) -> list[Subject]:
        """Active subjects ordered by discussion count descending."""
        discussion_count_subq = (
            select(
                Discussion.subject_id,
                func.count(Discussion.id).label("discussion_count"),
            )
            .where(Discussion.status != "removed")
            .group_by(Discussion.subject_id)
            .subquery()
        )

        stmt = (
            select(Subject)
            .outerjoin(
                discussion_count_subq,
                Subject.id == discussion_count_subq.c.subject_id,
            )
            .where(Subject.status == "active")
            .order_by(func.coalesce(discussion_count_subq.c.discussion_count, 0).desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def get_recent_discussions(self, limit: int = 10) -> list[Discussion]:
        """Most recent published discussions across all active subjects."""
        stmt = (
            select(Discussion)
            .options(
                joinedload(Discussion.author),
                joinedload(Discussion.subject),
            )
            .join(Subject, Discussion.subject_id == Subject.id)
            .where(
                Discussion.status == "published",
                Subject.status == "active",
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
