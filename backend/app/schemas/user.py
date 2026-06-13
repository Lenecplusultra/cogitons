# backend/app/schemas/user.py
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
# Response schemas — account
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
    Minimal public profile. Retained for any caller that only needs the
    identity block (email, role, and status are intentionally excluded).
    """

    id: UUID
    username: str
    bio: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Response schemas — public profile page (GET /users/{username})
# ---------------------------------------------------------------------------


class ProfileStats(BaseModel):
    """The three header figures on the profile page."""

    discussions: int
    responses: int
    useful_votes_received: int


class ActiveInItem(BaseModel):
    """One row of the 'Active in' sidebar — the user's activity per subject."""

    subject_title: str
    subject_slug: str
    discussion_count: int
    response_count: int


class ProfileDiscussionItem(BaseModel):
    """A card in the profile's Discussions tab."""

    id: UUID
    subject_title: str
    subject_slug: str
    title: str
    body: str  # snippet, truncated at the service layer
    useful_count: int
    response_count: int
    viewer_voted: bool = False
    edited: bool
    created_at: datetime


class ProfileResponseItem(BaseModel):
    """A card in the profile's Responses tab (carries its parent discussion)."""

    id: UUID
    discussion_id: UUID
    discussion_title: str
    subject_title: str
    subject_slug: str
    body: str  # snippet, truncated at the service layer
    useful_count: int
    viewer_voted: bool = False
    edited: bool
    created_at: datetime


class UserProfileResponse(BaseModel):
    """
    Full payload for the public profile page. Tabs are a client-side toggle
    over recent_discussions / recent_responses, so the whole page is one fetch.

    status and role are populated only when the viewer is an admin; the service
    strips them otherwise so the public contract is unchanged.
    """

    id: UUID
    username: str
    bio: str | None
    created_at: datetime
    stats: ProfileStats
    active_in: list[ActiveInItem]
    recent_discussions: list[ProfileDiscussionItem]
    recent_responses: list[ProfileResponseItem]
    status: str | None = None
    role: str | None = None

    model_config = {"from_attributes": True}
