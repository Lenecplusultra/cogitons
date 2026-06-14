# backend/app/services/search_service.py
from sqlalchemy.orm import Session

from app.repositories.discussion_repository import DiscussionRepository
from app.repositories.search_repository import SearchRepository
from app.schemas.search import (
    SearchDiscussionAuthor,
    SearchDiscussionResult,
    SearchDiscussionSubject,
    SearchResponse,
    SearchSubjectResult,
)

SNIPPET_LENGTH = 150


def _snippet(text: str) -> str:
    text = (text or "").strip()
    if len(text) <= SNIPPET_LENGTH:
        return text
    return text[:SNIPPET_LENGTH].rstrip() + "…"


class SearchService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = SearchRepository(db)

    def search(self, query: str, current_user=None) -> SearchResponse:
        query = query.strip()

        raw_subjects = self.repo.search_subjects(query, limit=10)
        raw_discussions = self.repo.search_discussions(query, limit=20)

        viewer_voted_ids: set = set()
        if current_user and raw_discussions:
            disc_repo = DiscussionRepository(self.db)
            viewer_voted_ids = disc_repo.get_viewer_voted_ids(
                current_user.id, [d.id for d in raw_discussions]
            )

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
                body=_snippet(d.body),
                subject=SearchDiscussionSubject(
                    title=d.subject.title,
                    slug=d.subject.slug,
                ),
                author=SearchDiscussionAuthor(username=d.author.username),
                useful_count=self.repo.get_discussion_useful_count(d.id),
                viewer_voted=d.id in viewer_voted_ids,
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
