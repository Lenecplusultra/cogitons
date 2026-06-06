import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.discussion_repository import DiscussionRepository
from app.repositories.response_repository import ResponseRepository
from app.schemas.response import (
    ResponseCreateResponseSchema,
    ResponseItemSchema,
    ResponseListSchema,
    ResponsePaginationSchema,
    ResponseUpdateResponseSchema,
)


class ResponseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ResponseRepository(db)
        self.discussion_repo = DiscussionRepository(db)

    def list_by_discussion(
        self,
        discussion_id: uuid.UUID,
        page: int,
        page_size: int,
        current_user: User | None,
    ) -> ResponseListSchema:
        discussion = self.discussion_repo.get_active_by_id(discussion_id)
        if not discussion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Discussion not found."},
            )

        responses, total = self.repo.list_by_discussion(discussion_id, page, page_size)
        total_pages = max(1, -(-total // page_size))

        items = []
        for r in responses:
            items.append(
                ResponseItemSchema(
                    id=r.id,
                    author={"id": r.author.id, "username": r.author.username},
                    body=r.body,
                    useful_count=self.repo.get_useful_count(r.id),
                    current_user_voted=(
                        self.repo.user_has_voted(current_user.id, r.id) if current_user else False
                    ),
                    edited=r.edited,
                    status=r.status,
                    created_at=r.created_at,
                )
            )

        return ResponseListSchema(
            items=items,
            pagination=ResponsePaginationSchema(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            ),
        )

    def create(
        self,
        discussion_id: uuid.UUID,
        body: str,
        current_user: User,
    ) -> ResponseCreateResponseSchema:
        discussion = self.discussion_repo.get_active_by_id(discussion_id)
        if not discussion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Discussion not found."},
            )
        if discussion.status == "locked":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "This discussion is locked."},
            )

        r = self.repo.create(
            discussion_id=discussion_id,
            author_id=current_user.id,
            body=body,
        )
        self.db.commit()
        self.db.refresh(r)

        return ResponseCreateResponseSchema(id=r.id, body=r.body, status=r.status)

    def update(
        self,
        response_id: uuid.UUID,
        body: str,
        current_user: User,
    ) -> ResponseUpdateResponseSchema:
        r = self.repo.get_active_by_id(response_id)
        if not r:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Response not found."},
            )
        if r.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "You can only edit your own responses."},
            )

        r = self.repo.update(r, body)
        self.db.commit()
        self.db.refresh(r)

        return ResponseUpdateResponseSchema(id=r.id, body=r.body, edited=r.edited)

    def delete(self, response_id: uuid.UUID, current_user: User) -> None:
        r = self.repo.get_active_by_id(response_id)
        if not r:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Response not found."},
            )
        if r.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "You can only delete your own responses."},
            )

        self.repo.soft_delete(r)
        self.db.commit()
