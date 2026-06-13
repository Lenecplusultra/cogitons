from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

# ── Response schemas ───────────────────────────────────────────────────────────


class SubjectResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    description: str
    status: str
    discussion_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class SubjectListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    description: str
    discussion_count: int = 0
    response_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class SubjectListResponse(BaseModel):
    items: list[SubjectListItem]
    pagination: PaginationMeta


# ── Request schemas ────────────────────────────────────────────────────────────


class CreateSubjectRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)


class UpdateSubjectRequest(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, min_length=10)


class UpdateSubjectStatusRequest(BaseModel):
    status: Literal["active", "archived", "removed"]
