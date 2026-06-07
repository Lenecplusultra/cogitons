# backend/app/schemas/feed.py
import uuid
from datetime import datetime

from pydantic import BaseModel


class FeedSubject(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: str
    discussion_count: int

    model_config = {"from_attributes": True}


class FeedDiscussionAuthor(BaseModel):
    username: str

    model_config = {"from_attributes": True}


class FeedDiscussionSubject(BaseModel):
    title: str
    slug: str

    model_config = {"from_attributes": True}


class FeedDiscussion(BaseModel):
    id: uuid.UUID
    title: str
    subject: FeedDiscussionSubject
    author: FeedDiscussionAuthor
    useful_count: int
    response_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedResponse(BaseModel):
    featured_subjects: list[FeedSubject]
    recent_discussions: list[FeedDiscussion]
