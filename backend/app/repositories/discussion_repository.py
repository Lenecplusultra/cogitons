import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.discussion import Discussion
from app.models.response import Response
from app.models.vote import Vote


class DiscussionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, discussion_id: uuid.UUID) -> Discussion | None:
        return self.db.get(Discussion, discussion_id)

    def get_active_by_id(self, discussion_id: uuid.UUID) -> Discussion | None:
        stmt = select(Discussion).where(
            Discussion.id == discussion_id,
            Discussion.status != "removed",
        )
        return self.db.scalar(stmt)

    def list_by_subject(
        self,
        subject_id: uuid.UUID,
        sort: str,
        page: int,
        page_size: int,
    ) -> tuple[list[Discussion], int]:
        """
        Returns (items, total) for numbered pagination.
        sort: "recent" | "most_useful"
        """
        base = select(Discussion).where(
            Discussion.subject_id == subject_id,
            Discussion.status != "removed",
        )

        if sort == "most_useful":
            useful_subq = (
                select(Vote.target_id, func.count().label("useful_count"))
                .where(Vote.target_type == "discussion")
                .group_by(Vote.target_id)
                .subquery()
            )
            base = base.outerjoin(useful_subq, Discussion.id == useful_subq.c.target_id).order_by(
                func.coalesce(useful_subq.c.useful_count, 0).desc(), Discussion.created_at.desc()
            )
        else:
            base = base.order_by(Discussion.created_at.desc())

        total_stmt = select(func.count()).select_from(base.subquery())
        total: int = self.db.scalar(total_stmt) or 0

        offset = (page - 1) * page_size
        items_stmt = base.offset(offset).limit(page_size)
        items = list(self.db.scalars(items_stmt).all())

        return items, total

    def create(
        self,
        subject_id: uuid.UUID,
        author_id: uuid.UUID,
        title: str,
        body: str,
    ) -> Discussion:
        discussion = Discussion(
            subject_id=subject_id,
            author_id=author_id,
            title=title,
            body=body,
        )
        self.db.add(discussion)
        self.db.flush()
        return discussion

    def update(self, discussion: Discussion, title: str | None, body: str | None) -> Discussion:
        if title is not None:
            discussion.title = title
        if body is not None:
            discussion.body = body
        discussion.edited = True
        self.db.flush()
        return discussion

    def soft_delete(self, discussion: Discussion) -> None:
        """Soft-deletes the discussion and cascades to all its responses."""
        now = datetime.now(UTC)
        discussion.status = "removed"
        discussion.removed_at = now

        stmt = select(Response).where(
            Response.discussion_id == discussion.id,
            Response.status != "removed",
        )
        responses = list(self.db.scalars(stmt).all())
        for r in responses:
            r.status = "removed"
            r.removed_at = now

        self.db.flush()

    def get_useful_count(self, discussion_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(
            Vote.target_type == "discussion",
            Vote.target_id == discussion_id,
        )
        return self.db.scalar(stmt) or 0

    def get_response_count(self, discussion_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(
            Response.discussion_id == discussion_id,
            Response.status != "removed",
        )
        return self.db.scalar(stmt) or 0

    def user_has_voted(self, user_id: uuid.UUID, discussion_id: uuid.UUID) -> bool:
        stmt = select(Vote).where(
            Vote.target_type == "discussion",
            Vote.target_id == discussion_id,
            Vote.user_id == user_id,
        )
        return self.db.scalar(stmt) is not None

    def get_viewer_voted_ids(
        self, viewer_id: uuid.UUID, discussion_ids: list[uuid.UUID]
    ) -> set[uuid.UUID]:
        """Returns the set of discussion IDs the viewer has voted on."""
        if not discussion_ids:
            return set()
        stmt = select(Vote.target_id).where(
            Vote.target_type == "discussion",
            Vote.target_id.in_(discussion_ids),
            Vote.user_id == viewer_id,
        )
        return set(self.db.scalars(stmt).all())

    def get_related(
        self,
        subject_id: uuid.UUID,
        exclude_id: uuid.UUID,
        limit: int = 3,
    ) -> list[Discussion]:
        useful_subq = (
            select(Vote.target_id, func.count().label("useful_count"))
            .where(Vote.target_type == "discussion")
            .group_by(Vote.target_id)
            .subquery()
        )
        stmt = (
            select(Discussion)
            .outerjoin(useful_subq, Discussion.id == useful_subq.c.target_id)
            .where(
                Discussion.subject_id == subject_id,
                Discussion.id != exclude_id,
                Discussion.status != "removed",
            )
            .order_by(func.coalesce(useful_subq.c.useful_count, 0).desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())
