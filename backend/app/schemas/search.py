# backend/app/schemas/search.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class SearchSubjectResult(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: str
    discussion_count: int

    model_config = {"from_attributes": True}


class SearchDiscussionAuthor(BaseModel):
    username: str

    model_config = {"from_attributes": True}


class SearchDiscussionSubject(BaseModel):
    title: str
    slug: str

    model_config = {"from_attributes": True}


class SearchDiscussionResult(BaseModel):
    id: uuid.UUID
    title: str
    subject: SearchDiscussionSubject
    author: SearchDiscussionAuthor
    useful_count: int
    response_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    query: str
    subjects: list[SearchSubjectResult]
    discussions: list[SearchDiscussionResult]
    total_subjects: int
    total_discussions: int
