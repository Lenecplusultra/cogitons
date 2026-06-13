from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.discussion import Discussion
from app.models.response import Response
from app.models.subject import Subject, SubjectSlugHistory


class SubjectRepository:
    def get_all_active(
        self, db: Session, page: int = 1, page_size: int = 20
    ) -> tuple[list[Subject], int]:
        """Return paginated active subjects and total count."""
        base_q = select(Subject).where(Subject.status == "active")
        total = db.scalar(select(func.count()).select_from(base_q.subquery())) or 0
        subjects = (
            db.execute(
                base_q.order_by(Subject.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
            .scalars()
            .all()
        )
        return list(subjects), total

    def get_by_slug(self, db: Session, slug: str) -> Subject | None:
        return db.scalar(select(Subject).where(Subject.slug == slug))

    def get_by_id(self, db: Session, subject_id: UUID) -> Subject | None:
        return db.scalar(select(Subject).where(Subject.id == subject_id))

    def get_slug_history(self, db: Session, slug: str) -> SubjectSlugHistory | None:
        """Return history entry if this is an old slug."""
        return db.scalar(select(SubjectSlugHistory).where(SubjectSlugHistory.old_slug == slug))

    def title_exists(self, db: Session, title: str, exclude_id: UUID | None = None) -> bool:
        q = select(Subject).where(Subject.title == title)
        if exclude_id:
            q = q.where(Subject.id != exclude_id)
        return db.scalar(q) is not None

    def slug_exists(self, db: Session, slug: str, exclude_id: UUID | None = None) -> bool:
        q = select(Subject).where(Subject.slug == slug)
        if exclude_id:
            q = q.where(Subject.id != exclude_id)
        return db.scalar(q) is not None

    def get_discussion_count(self, db: Session, subject_id: UUID) -> int:
        return (
            db.scalar(
                select(func.count(Discussion.id)).where(
                    Discussion.subject_id == subject_id,
                    Discussion.status == "published",
                )
            )
            or 0
        )

    def get_response_count(self, db: Session, subject_id: UUID) -> int:
        return (
            db.scalar(
                select(func.count(Response.id))
                .join(Discussion, Response.discussion_id == Discussion.id)
                .where(
                    Discussion.subject_id == subject_id,
                    Discussion.status == "published",
                    Response.status == "published",
                )
            )
            or 0
        )


subject_repository = SubjectRepository()
