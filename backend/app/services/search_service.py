# backend/app/services/search_service.py
from sqlalchemy.orm import Session

from app.repositories.search_repository import SearchRepository
from app.schemas.search import (
    SearchDiscussionAuthor,
    SearchDiscussionResult,
    SearchDiscussionSubject,
    SearchResponse,
    SearchSubjectResult,
)


class SearchService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = SearchRepository(db)

    def search(self, query: str) -> SearchResponse:
        query = query.strip()

        raw_subjects = self.repo.search_subjects(query, limit=10)
        raw_discussions = self.repo.search_discussions(query, limit=20)

        subjects = [
            SearchSubjectResult(
                id=s.id,
                title=s.title,
                slug=s.slug,
                description=s.description or "",
                discussion_count=self.repo.get_subject_discussion_count(s.id),
            )
            for s in raw_subjects
        ]

        discussions = [
            SearchDiscussionResult(
                id=d.id,
                title=d.title,
                subject=SearchDiscussionSubject(
                    title=d.subject.title,
                    slug=d.subject.slug,
                ),
                author=SearchDiscussionAuthor(username=d.author.username),
                useful_count=self.repo.get_discussion_useful_count(d.id),
                response_count=self.repo.get_discussion_response_count(d.id),
                created_at=d.created_at,
            )
            for d in raw_discussions
        ]

        return SearchResponse(
            query=query,
            subjects=subjects,
            discussions=discussions,
            total_subjects=len(subjects),
            total_discussions=len(discussions),
        )
