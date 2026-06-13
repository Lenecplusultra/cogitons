"""
User service — business logic for public profiles.
The router calls this. This calls the repository.
No direct database access here — only through UserRepository.
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    ActiveInItem,
    ProfileDiscussionItem,
    ProfileResponseItem,
    ProfileStats,
    UserProfileResponse,
)

SNIPPET_LENGTH = 150


def _snippet(text: str, length: int = SNIPPET_LENGTH) -> str:
    text = (text or "").strip()
    if len(text) <= length:
        return text
    return text[:length].rstrip() + "…"


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def get_public_profile(self, username: str, viewer: User | None) -> dict | None:
        user = self.repo.get_by_username(username)
        if not user or user.status == "removed":
            return None

        stats = self.repo.get_profile_stats(user.id)
        active_in = self.repo.get_active_in(user.id)
        viewer_id = viewer.id if viewer else None
        discussions = self.repo.get_recent_user_discussions(user.id, viewer_id)
        responses = self.repo.get_recent_user_responses(user.id, viewer_id)

        profile = UserProfileResponse(
            id=user.id,
            username=user.username,
            bio=user.bio,
            created_at=user.created_at,
            stats=ProfileStats(**stats),
            active_in=[ActiveInItem(**row) for row in active_in],
            recent_discussions=[
                ProfileDiscussionItem(**{**d, "body": _snippet(d["body"])}) for d in discussions
            ],
            recent_responses=[
                ProfileResponseItem(**{**r, "body": _snippet(r["body"])}) for r in responses
            ],
        )

        data = profile.model_dump()

        if viewer and viewer.role == "admin":
            data["status"] = user.status
            data["role"] = user.role
        else:
            data.pop("status", None)
            data.pop("role", None)

        return data
