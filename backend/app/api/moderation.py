# backend/app/api/moderation.py
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_verified_user
from app.models.user import User
from app.schemas.report import (
    DismissReportBody,
    LockDiscussionBody,
    RemoveContentBody,
    ReportCreate,
    RestoreUserBody,
    SuspendUserBody,
    UnlockDiscussionBody,
)
from app.services.moderation_service import ModerationService

router = APIRouter(tags=["moderation"])


# ── User: submit report ───────────────────────────────────────────────────────


@router.post("/reports", response_model=dict)
def submit_report(
    body: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
) -> dict:
    service = ModerationService(db)
    result = service.submit_report(reporter_id=current_user.id, body=body)
    return {
        "success": True,
        "data": {"id": str(result.id), "status": result.status},
        "message": "Report received. Thank you.",
    }


# ── Admin: report queue ───────────────────────────────────────────────────────


@router.get("/admin/reports", response_model=dict)
def list_reports(
    status: str = Query(default="pending", pattern="^(pending|dismissed|actioned)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    result = service.list_reports(status=status, page=page, page_size=page_size)
    return {"success": True, "data": result.model_dump()}


# ── Admin: dismiss report ─────────────────────────────────────────────────────


@router.post("/admin/reports/{report_id}/dismiss", response_model=dict)
def dismiss_report(
    report_id: uuid.UUID,
    body: DismissReportBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    service.dismiss_report(admin_id=current_user.id, report_id=report_id, body=body)
    return {"success": True, "message": "Report dismissed."}


# ── Admin: remove content ─────────────────────────────────────────────────────


@router.post("/admin/content/remove", response_model=dict)
def remove_content(
    body: RemoveContentBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    service.remove_content(admin_id=current_user.id, body=body)
    return {"success": True, "message": "Content removed."}


# ── Admin: lock discussion ────────────────────────────────────────────────────


@router.post("/admin/discussions/{discussion_id}/lock", response_model=dict)
def lock_discussion(
    discussion_id: uuid.UUID,
    body: LockDiscussionBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    result = service.lock_discussion(
        admin_id=current_user.id, discussion_id=discussion_id, body=body
    )
    return {"success": True, "data": result}


# ── Admin: unlock discussion ──────────────────────────────────────────────────


@router.post("/admin/discussions/{discussion_id}/unlock", response_model=dict)
def unlock_discussion(
    discussion_id: uuid.UUID,
    body: UnlockDiscussionBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    result = service.unlock_discussion(
        admin_id=current_user.id, discussion_id=discussion_id, body=body
    )
    return {"success": True, "data": result}


# ── Admin: suspend user ───────────────────────────────────────────────────────


@router.post("/admin/users/{user_id}/suspend", response_model=dict)
def suspend_user(
    user_id: uuid.UUID,
    body: SuspendUserBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    result = service.suspend_user(admin_id=current_user.id, user_id=user_id, body=body)
    return {"success": True, "data": result}


# ── Admin: restore user ───────────────────────────────────────────────────────


@router.post("/admin/users/{user_id}/restore", response_model=dict)
def restore_user(
    user_id: uuid.UUID,
    body: RestoreUserBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    result = service.restore_user(admin_id=current_user.id, user_id=user_id, body=body)
    return {"success": True, "data": result}


# ── Admin: restore user ───────────────────────────────────────────────────────


@router.get("/admin/reports/{report_id}/context", response_model=dict)
def get_report_context(
    report_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    service = ModerationService(db)
    result = service.get_report_context(report_id)
    return {"success": True, "data": result}
