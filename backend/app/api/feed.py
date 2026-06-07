from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.feed_service import FeedService

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=dict)
def get_feed(db: Session = Depends(get_db)) -> dict:
    service = FeedService(db)
    result = service.get_feed()
    return {"success": True, "data": result.model_dump()}
