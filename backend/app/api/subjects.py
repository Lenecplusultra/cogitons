from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.subject import (
    CreateSubjectRequest,
    UpdateSubjectRequest,
    UpdateSubjectStatusRequest,
)
from app.services.subject_service import _OldSlugFoundError, subject_service

router = APIRouter(prefix="/subjects", tags=["subjects"])


# Issue #42 — GET /subjects — public, paginated
@router.get("")
def list_subjects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    result = subject_service.list_subjects(db, page, page_size)
    return {"success": True, "data": result.model_dump()}


# Issue #43 — GET /subjects/{slug} — public, 302 on old slug
@router.get("/{slug}")
def get_subject(slug: str, db: Session = Depends(get_db)):
    try:
        result = subject_service.get_subject(db, slug)
        return {"success": True, "data": result.model_dump()}
    except _OldSlugFoundError as e:
        # Return the subject at its current slug directly — browser clients
        # can't reliably follow cross-origin redirects with fetch()
        result = subject_service.get_subject(db, e.current_slug)
        return {"success": True, "data": result.model_dump()}


# Issue #44 — POST /subjects — admin only
@router.post("", status_code=201)
def create_subject(
    data: CreateSubjectRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = subject_service.create_subject(db, data, admin)
    return {"success": True, "data": result.model_dump()}


# Issue #45 — PATCH /subjects/{id} — admin only, slug history transaction
@router.patch("/{subject_id}")
def update_subject(
    subject_id: UUID,
    data: UpdateSubjectRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = subject_service.update_subject(db, subject_id, data)
    return {"success": True, "data": result.model_dump()}


# Issue #46 — PATCH /subjects/{id}/status — admin only
@router.patch("/{subject_id}/status")
def update_subject_status(
    subject_id: UUID,
    data: UpdateSubjectStatusRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = subject_service.update_subject_status(db, subject_id, data)
    return {"success": True, "data": result}
