# backend/app/api/search.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_optional_current_user
from app.models.user import User
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=dict)
def search(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> dict:
    service = SearchService(db)
    result = service.search(q, current_user)  # ← pass through
    return {"success": True, "data": result.model_dump()}
