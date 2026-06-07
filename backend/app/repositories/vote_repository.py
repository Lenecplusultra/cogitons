import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.vote import Vote


class VoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: uuid.UUID, target_type: str, target_id: uuid.UUID) -> Vote | None:
        stmt = select(Vote).where(
            Vote.user_id == user_id,
            Vote.target_type == target_type,
            Vote.target_id == target_id,
        )
        return self.db.scalar(stmt)

    def create(self, user_id: uuid.UUID, target_type: str, target_id: uuid.UUID) -> Vote:
        vote = Vote(user_id=user_id, target_type=target_type, target_id=target_id)
        self.db.add(vote)
        self.db.flush()
        return vote

    def delete(self, vote: Vote) -> None:
        self.db.delete(vote)
        self.db.flush()

    def count(self, target_type: str, target_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(
            Vote.target_type == target_type,
            Vote.target_id == target_id,
        )
        return self.db.scalar(stmt) or 0
