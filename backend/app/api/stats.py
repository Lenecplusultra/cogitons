# backend/app/api/stats.py
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.discussion import Discussion
from app.models.subject import Subject
from app.models.user import User

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=dict)
def get_stats(db: Session = Depends(get_db)) -> dict:
    subject_count = db.scalar(select(func.count()).where(Subject.status == "active")) or 0

    discussion_count = db.scalar(select(func.count()).where(Discussion.status != "removed")) or 0

    member_count = (
        db.scalar(
            select(func.count()).where(
                User.status == "active",
                User.email_verified == True,  # noqa: E712
            )
        )
        or 0
    )

    return {
        "success": True,
        "data": {
            "subjects": subject_count,
            "discussions": discussion_count,
            "members": member_count,
        },
    }
