"""
RULE: Every admin action MUST write a ModerationLog entry.
Enforced at the service layer — not optional.
"""
import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base

ModerationActionEnum = Enum(
    "dismiss_report", "remove_content", "lock_discussion",
    "unlock_discussion", "suspend_user", "restore_user",
    name="moderation_action", create_type=False,
)
ModerationTargetTypeEnum = Enum(
    "discussion", "response", "user", name="moderation_target_type", create_type=False
)


class ModerationLog(Base):
    __tablename__ = "moderation_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(ModerationActionEnum, nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(ModerationTargetTypeEnum, nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    report_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    admin: Mapped["User"] = relationship("User", foreign_keys=[admin_id], back_populates="moderation_logs")  # noqa: F821