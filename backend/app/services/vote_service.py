import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.discussion_repository import DiscussionRepository
from app.repositories.response_repository import ResponseRepository
from app.repositories.vote_repository import VoteRepository
from app.schemas.vote import VoteToggleResponseSchema


class VoteService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = VoteRepository(db)
        self.discussion_repo = DiscussionRepository(db)
        self.response_repo = ResponseRepository(db)

    def toggle(
        self,
        target_type: str,
        target_id: uuid.UUID,
        current_user: User,
    ) -> VoteToggleResponseSchema:
        # Validate target exists and is not removed
        if target_type == "discussion":
            target = self.discussion_repo.get_active_by_id(target_id)
        else:
            target = self.response_repo.get_active_by_id(target_id)

        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Target not found."},
            )

        existing = self.repo.get(current_user.id, target_type, target_id)

        if existing:
            self.repo.delete(existing)
            self.db.commit()
            voted = False
        else:
            self.repo.create(current_user.id, target_type, target_id)
            self.db.commit()
            voted = True

        useful_count = self.repo.count(target_type, target_id)

        return VoteToggleResponseSchema(voted=voted, useful_count=useful_count)
