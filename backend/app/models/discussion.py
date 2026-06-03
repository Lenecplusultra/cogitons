import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base

DiscussionStatusEnum = Enum("published", "locked", "removed", name="discussion_status", create_type=True)


class Discussion(Base):
    __tablename__ = "discussions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False, index=True)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(DiscussionStatusEnum, nullable=False, default="published", index=True)
    edited: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    subject: Mapped["Subject"] = relationship(back_populates="discussions")  # noqa: F821
    author: Mapped["User"] = relationship(back_populates="discussions")  # noqa: F821
    responses: Mapped[list["Response"]] = relationship(back_populates="discussion")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Discussion id={self.id} title={self.title[:40]!r} status={self.status}>"