import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.response import Response
from app.models.vote import Vote


class ResponseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, response_id: uuid.UUID) -> Response | None:
        return self.db.get(Response, response_id)

    def get_active_by_id(self, response_id: uuid.UUID) -> Response | None:
        stmt = select(Response).where(
            Response.id == response_id,
            Response.status != "removed",
        )
        return self.db.scalar(stmt)

    def list_by_discussion(
        self,
        discussion_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[Response], int]:
        """Chronological order — oldest first, per spec."""
        base = (
            select(Response)
            .where(
                Response.discussion_id == discussion_id,
                Response.status != "removed",
            )
            .order_by(Response.created_at.asc())
        )

        total_stmt = select(func.count()).select_from(base.subquery())
        total: int = self.db.scalar(total_stmt) or 0

        offset = (page - 1) * page_size
        items = list(self.db.scalars(base.offset(offset).limit(page_size)).all())

        return items, total

    def create(
        self,
        discussion_id: uuid.UUID,
        author_id: uuid.UUID,
        body: str,
    ) -> Response:
        response = Response(
            discussion_id=discussion_id,
            author_id=author_id,
            body=body,
        )
        self.db.add(response)
        self.db.flush()
        return response

    def update(self, response: Response, body: str) -> Response:
        response.body = body
        response.edited = True
        self.db.flush()
        return response

    def soft_delete(self, response: Response) -> None:
        response.status = "removed"
        response.removed_at = datetime.now(UTC)
        self.db.flush()

    def get_useful_count(self, response_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(
            Vote.target_type == "response",
            Vote.target_id == response_id,
        )
        return self.db.scalar(stmt) or 0

    def user_has_voted(self, user_id: uuid.UUID, response_id: uuid.UUID) -> bool:
        stmt = select(Vote).where(
            Vote.target_type == "response",
            Vote.target_id == response_id,
            Vote.user_id == user_id,
        )
        return self.db.scalar(stmt) is not None
