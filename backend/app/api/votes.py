import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user
from app.models.user import User
from app.services.vote_service import VoteService

router = APIRouter()


@router.post("/discussions/{discussion_id}/vote", response_model=dict)
def toggle_discussion_vote(
    discussion_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = VoteService(db)
    data = service.toggle("discussion", discussion_id, current_user)
    return {"success": True, "data": data.model_dump()}


@router.post("/responses/{response_id}/vote", response_model=dict)
def toggle_response_vote(
    response_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = VoteService(db)
    data = service.toggle("response", response_id, current_user)
    return {"success": True, "data": data.model_dump()}
