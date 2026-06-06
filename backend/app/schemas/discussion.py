import uuid
from datetime import datetime

from pydantic import BaseModel, Field

# ── Nested author shape used inside discussion responses ──────────────────────


class AuthorSchema(BaseModel):
    id: uuid.UUID
    username: str

    model_config = {"from_attributes": True}


class SubjectSummarySchema(BaseModel):
    id: uuid.UUID
    title: str
    slug: str

    model_config = {"from_attributes": True}


# ── Request schemas ───────────────────────────────────────────────────────────


class DiscussionCreateSchema(BaseModel):
    subject_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=300)
    body: str = Field(..., min_length=1)


class DiscussionUpdateSchema(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    body: str | None = Field(None, min_length=1)


# ── Response schemas ──────────────────────────────────────────────────────────


class DiscussionCardSchema(BaseModel):
    """Used in the subject page list — card view, no full body."""

    id: uuid.UUID
    author: AuthorSchema
    title: str
    useful_count: int
    response_count: int
    edited: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DiscussionDetailSchema(BaseModel):
    """Used in GET /discussions/{id} — full thread view."""

    id: uuid.UUID
    subject: SubjectSummarySchema
    author: AuthorSchema
    title: str
    body: str
    useful_count: int
    current_user_voted: bool
    response_count: int
    edited: bool
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DiscussionCreateResponseSchema(BaseModel):
    id: uuid.UUID
    title: str
    status: str

    model_config = {"from_attributes": True}


class DiscussionUpdateResponseSchema(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    edited: bool

    model_config = {"from_attributes": True}


class PaginationSchema(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class DiscussionListSchema(BaseModel):
    items: list[DiscussionCardSchema]
    pagination: PaginationSchema
