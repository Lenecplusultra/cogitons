import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user, get_optional_current_user
from app.models.user import User
from app.schemas.response import ResponseCreateSchema, ResponseUpdateSchema
from app.services.response_service import ResponseService

router = APIRouter()


@router.get("/discussions/{discussion_id}/responses", response_model=dict)
def list_responses(
    discussion_id: uuid.UUID,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> dict:
    service = ResponseService(db)
    data = service.list_by_discussion(discussion_id, page, page_size, current_user)
    return {"success": True, "data": data.model_dump()}


@router.post("/discussions/{discussion_id}/responses", response_model=dict, status_code=201)
def create_response(
    discussion_id: uuid.UUID,
    payload: ResponseCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = ResponseService(db)
    data = service.create(discussion_id, payload.body, current_user)
    return {"success": True, "data": data.model_dump()}


@router.patch("/responses/{response_id}", response_model=dict)
def update_response(
    response_id: uuid.UUID,
    payload: ResponseUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = ResponseService(db)
    data = service.update(response_id, payload.body, current_user)
    return {"success": True, "data": data.model_dump()}


@router.delete("/responses/{response_id}", response_model=dict)
def delete_response(
    response_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = ResponseService(db)
    service.delete(response_id, current_user)
    return {"success": True, "message": "Response deleted successfully."}
