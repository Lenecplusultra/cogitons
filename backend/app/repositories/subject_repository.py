from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.discussion import Discussion
from app.models.response import Response
from app.models.subject import Subject, SubjectSlugHistory


class SubjectRepository:
    def get_only_active(
        self, db: Session, page: int = 1, page_size: int = 20
    ) -> tuple[list[Subject], int]:
        """Public list — active subjects only."""
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

    def get_all_non_removed(
        self, db: Session, page: int = 1, page_size: int = 20
    ) -> tuple[list[Subject], int]:
        """Admin list — active + archived, excludes removed."""
        base_q = select(Subject).where(Subject.status != "removed")
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

    def get_contributor_count(self, db: Session, subject_id: UUID) -> int:
        """Distinct authors across non-removed discussions and responses for this subject."""
        from sqlalchemy import union

        disc_authors = select(Discussion.author_id).where(
            Discussion.author_id.isnot(None),
            Discussion.subject_id == subject_id,
            Discussion.status != "removed",
        )
        resp_authors = (
            select(Response.author_id)
            .join(Discussion, Response.discussion_id == Discussion.id)
            .where(Discussion.subject_id == subject_id, Response.status != "removed")
        )
        combined = union(disc_authors, resp_authors).subquery()
        return db.scalar(select(func.count()).select_from(combined)) or 0  # ← db not self.db


subject_repository = SubjectRepository()
