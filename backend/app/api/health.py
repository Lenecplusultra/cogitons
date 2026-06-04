from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict:
    """
    Health check endpoint.
    Verifies the app is running and the database is reachable.
    Used by deployment platforms (Railway/Render) and CI checks.
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "success": True,
        "data": {
            "status": "ok" if db_ok else "degraded",
            "timestamp": datetime.now(UTC).isoformat(),
            "database": "connected" if db_ok else "unreachable",
            "version": "1.0.0",
        },
    }
