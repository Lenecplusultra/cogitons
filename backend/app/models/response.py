"""
Responses are flat in V1 — no parent_id. Nesting deferred to post-MVP.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base

ResponseStatusEnum = Enum("published", "removed", name="response_status", create_type=True)


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    discussion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("discussions.id"), nullable=False, index=True)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(ResponseStatusEnum, nullable=False, default="published", index=True)
    edited: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    discussion: Mapped["Discussion"] = relationship(back_populates="responses")  # noqa: F821
    author: Mapped["User"] = relationship(back_populates="responses")  # noqa: F821