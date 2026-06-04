from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class UpdateMeRequest(BaseModel):
    """PATCH /api/v1/users/me — update own username and/or bio."""

    username: str | None = None
    bio: str | None = None

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Username cannot be blank.")
        if v is not None and len(v) > 40:
            raise ValueError("Username must be 40 characters or fewer.")
        return v

    @field_validator("bio")
    @classmethod
    def bio_max_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 300:
            raise ValueError("Bio must be 300 characters or fewer.")
        return v


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class UserMeResponse(BaseModel):
    """Full profile returned for the authenticated user (GET /users/me)."""

    id: UUID
    username: str
    email: str
    bio: str | None
    role: str
    status: str
    email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateMeResponse(BaseModel):
    """Partial profile returned after a successful PATCH /users/me."""

    id: UUID
    username: str
    bio: str | None

    model_config = {"from_attributes": True}


class UserPublicResponse(BaseModel):
    """
    Public profile returned for GET /users/{username}.

    Email, role, and status are intentionally excluded.
    """

    id: UUID
    username: str
    bio: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
