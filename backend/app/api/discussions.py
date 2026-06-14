import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user, get_optional_current_user
from app.models.user import User
from app.schemas.discussion import (
    DiscussionCreateSchema,
    DiscussionUpdateSchema,
)
from app.services.discussion_service import DiscussionService

router = APIRouter()


@router.get("/subjects/{slug}/discussions", response_model=dict)
def list_discussions(
    slug: str,
    sort: Annotated[str, Query(pattern="^(recent|most_useful)$")] = "recent",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> dict:
    service = DiscussionService(db)
    data = service.list_by_subject(slug, sort, page, page_size, current_user)
    return {"success": True, "data": data.model_dump()}


@router.post("/discussions", response_model=dict, status_code=201)
def create_discussion(
    payload: DiscussionCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = DiscussionService(db)
    data = service.create(payload.subject_id, payload.title, payload.body, current_user)
    return {"success": True, "data": data.model_dump()}


@router.get("/discussions/{discussion_id}", response_model=dict)
def get_discussion(
    discussion_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> dict:
    service = DiscussionService(db)
    data = service.get_detail(discussion_id, current_user)
    return {"success": True, "data": data.model_dump()}


@router.patch("/discussions/{discussion_id}", response_model=dict)
def update_discussion(
    discussion_id: uuid.UUID,
    payload: DiscussionUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = DiscussionService(db)
    data = service.update(discussion_id, payload.title, payload.body, current_user)
    return {"success": True, "data": data.model_dump()}


@router.delete("/discussions/{discussion_id}", response_model=dict)
def delete_discussion(
    discussion_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = DiscussionService(db)
    service.delete(discussion_id, current_user)
    return {"success": True, "message": "Discussion deleted successfully."}


@router.get("/discussions/{discussion_id}/related", response_model=dict)
def get_related_discussions(
    discussion_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> dict:
    service = DiscussionService(db)
    data = service.get_related(discussion_id)
    return {"success": True, "data": data}
