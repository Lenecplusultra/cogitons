import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ResponseAuthorSchema(BaseModel):
    id: uuid.UUID
    username: str

    model_config = {"from_attributes": True}


# ── Request schemas ───────────────────────────────────────────────────────────


class ResponseCreateSchema(BaseModel):
    body: str = Field(..., min_length=1)


class ResponseUpdateSchema(BaseModel):
    body: str = Field(..., min_length=1)


# ── Response schemas ──────────────────────────────────────────────────────────


class ResponseItemSchema(BaseModel):
    id: uuid.UUID
    author: ResponseAuthorSchema
    body: str
    useful_count: int
    current_user_voted: bool
    edited: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ResponseCreateResponseSchema(BaseModel):
    id: uuid.UUID
    body: str
    status: str

    model_config = {"from_attributes": True}


class ResponseUpdateResponseSchema(BaseModel):
    id: uuid.UUID
    body: str
    edited: bool

    model_config = {"from_attributes": True}


class ResponsePaginationSchema(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class ResponseListSchema(BaseModel):
    items: list[ResponseItemSchema]
    pagination: ResponsePaginationSchema
