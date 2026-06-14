import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.discussion_repository import DiscussionRepository
from app.repositories.subject_repository import subject_repository
from app.schemas.discussion import (
    DiscussionCardSchema,
    DiscussionCreateResponseSchema,
    DiscussionDetailSchema,
    DiscussionListSchema,
    DiscussionUpdateResponseSchema,
    PaginationSchema,
)

SNIPPET_LENGTH = 150


def _snippet(text: str) -> str:
    text = (text or "").strip()
    if len(text) <= SNIPPET_LENGTH:
        return text
    return text[:SNIPPET_LENGTH].rstrip() + "…"


class DiscussionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = DiscussionRepository(db)

    def list_by_subject(
        self,
        subject_slug: str,
        sort: str,
        page: int,
        page_size: int,
        current_user: User | None,
    ) -> DiscussionListSchema:
        subject = subject_repository.get_by_slug(self.db, subject_slug)
        if not subject or subject.status == "removed":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Subject not found."},
            )

        discussions, total = self.repo.list_by_subject(subject.id, sort, page, page_size)
        total_pages = max(1, -(-total // page_size))

        # One bulk query for viewer votes instead of N individual queries
        viewer_voted_ids: set[uuid.UUID] = set()
        if current_user and discussions:
            viewer_voted_ids = self.repo.get_viewer_voted_ids(
                current_user.id, [d.id for d in discussions]
            )

        items = []
        for d in discussions:
            items.append(
                DiscussionCardSchema(
                    id=d.id,
                    author={"id": d.author.id, "username": d.author.username},
                    title=d.title,
                    body=_snippet(d.body),  # ← add
                    useful_count=self.repo.get_useful_count(d.id),
                    viewer_voted=d.id in viewer_voted_ids,  # ← add
                    response_count=self.repo.get_response_count(d.id),
                    edited=d.edited,
                    status=d.status,
                    created_at=d.created_at,
                )
            )

        return DiscussionListSchema(
            items=items,
            pagination=PaginationSchema(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            ),
        )

    def get_detail(
        self, discussion_id: uuid.UUID, current_user: User | None
    ) -> DiscussionDetailSchema:
        d = self.repo.get_active_by_id(discussion_id)
        if not d:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Discussion not found."},
            )

        current_user_voted = (
            self.repo.user_has_voted(current_user.id, d.id) if current_user else False
        )

        return DiscussionDetailSchema(
            id=d.id,
            subject={
                "id": d.subject.id,
                "title": d.subject.title,
                "slug": d.subject.slug,
                "description": d.subject.description,
            },
            author={"id": d.author.id, "username": d.author.username},
            title=d.title,
            body=d.body,
            useful_count=self.repo.get_useful_count(d.id),
            current_user_voted=current_user_voted,
            response_count=self.repo.get_response_count(d.id),
            edited=d.edited,
            status=d.status,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )

    def create(
        self,
        subject_id: uuid.UUID,
        title: str,
        body: str,
        current_user: User,
    ) -> DiscussionCreateResponseSchema:
        subject = subject_repository.get_by_id(self.db, subject_id)
        if not subject or subject.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "Subject is not active."},
            )

        d = self.repo.create(
            subject_id=subject.id,
            author_id=current_user.id,
            title=title,
            body=body,
        )
        self.db.commit()
        self.db.refresh(d)

        return DiscussionCreateResponseSchema(id=d.id, title=d.title, status=d.status)

    def update(
        self,
        discussion_id: uuid.UUID,
        title: str | None,
        body: str | None,
        current_user: User,
    ) -> DiscussionUpdateResponseSchema:
        d = self.repo.get_active_by_id(discussion_id)
        if not d:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Discussion not found."},
            )
        if d.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "You can only edit your own discussions."},
            )

        d = self.repo.update(d, title, body)
        self.db.commit()
        self.db.refresh(d)

        return DiscussionUpdateResponseSchema(id=d.id, title=d.title, body=d.body, edited=d.edited)

    def delete(self, discussion_id: uuid.UUID, current_user: User) -> None:
        d = self.repo.get_active_by_id(discussion_id)
        if not d:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Discussion not found."},
            )
        if d.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "You can only delete your own discussions.",
                },
            )

        self.repo.soft_delete(d)
        self.db.commit()

    def get_related(self, discussion_id: uuid.UUID, limit: int = 3) -> list[dict]:
        d = self.repo.get_active_by_id(discussion_id)
        if not d:
            return []
        items = self.repo.get_related(d.subject_id, discussion_id, limit)
        return [
            {
                "id": str(item.id),
                "title": item.title,
                "useful_count": self.repo.get_useful_count(item.id),
                "response_count": self.repo.get_response_count(item.id),
            }
            for item in items
        ]
