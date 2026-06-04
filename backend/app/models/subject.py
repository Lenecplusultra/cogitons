import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base

SubjectStatusEnum = Enum("active", "archived", "removed", name="subject_status", create_type=False)


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(170), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SubjectStatusEnum, nullable=False, default="active", index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])  # noqa: F821
    discussions: Mapped[list["Discussion"]] = relationship(back_populates="subject")  # noqa: F821
    slug_history: Mapped[list["SubjectSlugHistory"]] = relationship(back_populates="subject")

    def __repr__(self) -> str:
        return f"<Subject id={self.id} slug={self.slug!r}>"


class SubjectSlugHistory(Base):
    """Addition 4: slug changes must be a single transaction at the service layer."""

    __tablename__ = "subject_slug_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_slug: Mapped[str] = mapped_column(String(170), nullable=False, index=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    subject: Mapped["Subject"] = relationship(back_populates="slug_history")
