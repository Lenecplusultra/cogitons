# backend/app/services/feed_service.py
from sqlalchemy.orm import Session

from app.repositories.feed_repository import FeedRepository
from app.schemas.feed import (
    FeedDiscussion,
    FeedDiscussionAuthor,
    FeedDiscussionSubject,
    FeedMostUseful,
    FeedResponse,
    FeedSubject,
)


class FeedService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = FeedRepository(db)

    def get_feed(self) -> FeedResponse:
        raw_subjects = self.repo.get_featured_subjects(limit=6)
        raw_discussions = self.repo.get_recent_discussions(limit=10)
        raw_most_useful = self.repo.get_most_useful_this_week(limit=5)

        featured_subjects = [
            FeedSubject(
                id=s.id,
                title=s.title,
                slug=s.slug,
                description=s.description or "",
                discussion_count=self.repo.get_subject_discussion_count(s.id),
            )
            for s in raw_subjects
        ]

        recent_discussions = [
            FeedDiscussion(
                id=d.id,
                title=d.title,
                body=d.body[:150],
                subject=FeedDiscussionSubject(
                    title=d.subject.title,
                    slug=d.subject.slug,
                ),
                author=FeedDiscussionAuthor(username=d.author.username),
                useful_count=self.repo.get_discussion_useful_count(d.id),
                response_count=self.repo.get_discussion_response_count(d.id),
                created_at=d.created_at,
            )
            for d in raw_discussions
        ]

        most_useful = [
            FeedMostUseful(
                id=d.id,
                title=d.title,
                subject=FeedDiscussionSubject(
                    title=d.subject.title,
                    slug=d.subject.slug,
                ),
                useful_count=self.repo.get_discussion_useful_count(d.id),
            )
            for d in raw_most_useful
        ]

        return FeedResponse(
            featured_subjects=featured_subjects,
            recent_discussions=recent_discussions,
            most_useful_this_week=most_useful,
        )
