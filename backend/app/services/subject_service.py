import math
import re
import unicodedata
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.subject import Subject, SubjectSlugHistory
from app.models.user import User
from app.repositories.subject_repository import subject_repository
from app.schemas.subject import (
    CreateSubjectRequest,
    PaginationMeta,
    SubjectListItem,
    SubjectListResponse,
    SubjectResponse,
    UpdateSubjectRequest,
    UpdateSubjectStatusRequest,
)

# ── Slug utility ───────────────────────────────────────────────────────────────


def _generate_slug(title: str) -> str:
    """
    Convert a title to a URL-safe slug.
    Handles French/accented characters by normalising to ASCII first.
    e.g. "Études Supérieures" → "etudes-superieures"
    """
    normalized = unicodedata.normalize("NFKD", title)
    ascii_str = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_str.lower()).strip("-")
    return slug[:170]  # match model String(170)


# ── Internal signal for old-slug redirects ────────────────────────────────────


class _OldSlugFoundError(Exception):
    def __init__(self, current_slug: str):
        self.current_slug = current_slug


# ── Service ───────────────────────────────────────────────────────────────────


class SubjectService:
    def list_subjects(
        self, db: Session, page: int, page_size: int, admin_view: bool = False
    ) -> SubjectListResponse:
        if admin_view:
            subjects, total = subject_repository.get_all_non_removed(db, page, page_size)
        else:
            subjects, total = subject_repository.get_only_active(db, page, page_size)
        total_pages = math.ceil(total / page_size) if page_size > 0 else 0

        items = [
            SubjectListItem(
                id=s.id,
                title=s.title,
                slug=s.slug,
                description=s.description,
                status=s.status,
                discussion_count=subject_repository.get_discussion_count(db, s.id),
                response_count=subject_repository.get_response_count(db, s.id),
                created_at=s.created_at,
            )
            for s in subjects
        ]

        return SubjectListResponse(
            items=items,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            ),
        )

    def get_subject(self, db: Session, slug: str) -> SubjectResponse:
        subject = subject_repository.get_by_slug(db, slug)

        if subject is None:
            # Check slug history — raise internal signal so router can 302
            history = subject_repository.get_slug_history(db, slug)
            if history:
                raise _OldSlugFoundError(history.subject.slug)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Subject not found."},
                },
            )

        # Archived/removed subjects are invisible to non-admins (same 404)
        if subject.status != "active":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Subject not found."},
                },
            )

        return SubjectResponse(
            id=subject.id,
            title=subject.title,
            slug=subject.slug,
            description=subject.description,
            status=subject.status,
            discussion_count=subject_repository.get_discussion_count(db, subject.id),
            response_count=subject_repository.get_response_count(db, subject.id),  # ← add
            contributor_count=subject_repository.get_contributor_count(db, subject.id),  # ← add
            created_at=subject.created_at,
        )

    def create_subject(
        self, db: Session, data: CreateSubjectRequest, admin: User
    ) -> SubjectResponse:
        if subject_repository.title_exists(db, data.title):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": {
                        "code": "CONFLICT",
                        "message": "A subject with this title already exists.",
                    },
                },
            )

        slug = _generate_slug(data.title)

        if subject_repository.slug_exists(db, slug):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": {
                        "code": "CONFLICT",
                        "message": "A subject with this slug already exists. Try a slightly different title.",
                    },
                },
            )

        subject = Subject(
            title=data.title,
            slug=slug,
            description=data.description,
            created_by=admin.id,
            status="active",
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)

        return SubjectResponse(
            id=subject.id,
            title=subject.title,
            slug=subject.slug,
            description=subject.description,
            status=subject.status,
            discussion_count=0,
            created_at=subject.created_at,
        )

    def update_subject(
        self, db: Session, subject_id: UUID, data: UpdateSubjectRequest
    ) -> SubjectResponse:
        subject = subject_repository.get_by_id(db, subject_id)
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Subject not found."},
                },
            )

        if data.title is not None and data.title != subject.title:
            if subject_repository.title_exists(db, data.title, exclude_id=subject_id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "success": False,
                        "error": {
                            "code": "CONFLICT",
                            "message": "A subject with this title already exists.",
                        },
                    },
                )

            new_slug = _generate_slug(data.title)

            # ── Atomic slug change (DB design Addition 4) ──────────────────
            # The subjects UPDATE and subject_slug_history INSERT are a single
            # commit — if either fails, both roll back.
            if new_slug != subject.slug:
                db.add(SubjectSlugHistory(subject_id=subject.id, old_slug=subject.slug))
                subject.slug = new_slug

            subject.title = data.title

        if data.description is not None:
            subject.description = data.description

        db.commit()
        db.refresh(subject)

        return SubjectResponse(
            id=subject.id,
            title=subject.title,
            slug=subject.slug,
            description=subject.description,
            status=subject.status,
            discussion_count=subject_repository.get_discussion_count(db, subject.id),
            created_at=subject.created_at,
        )

    def update_subject_status(
        self, db: Session, subject_id: UUID, data: UpdateSubjectStatusRequest
    ) -> dict:
        subject = subject_repository.get_by_id(db, subject_id)
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "Subject not found."},
                },
            )

        subject.status = data.status
        db.commit()
        return {"id": str(subject.id), "status": subject.status}


subject_service = SubjectService()
