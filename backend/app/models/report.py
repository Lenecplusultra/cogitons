import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base

ReportReasonEnum = Enum(
    "spam", "harassment", "hate_speech", "dangerous_content",
    "misinformation", "privacy_violation", "off_topic", "other",
    name="report_reason", create_type=False,
)
ReportTargetTypeEnum = Enum("discussion", "response", name="report_target_type", create_type=False)
ReportStatusEnum = Enum("pending", "dismissed", "actioned", name="report_status", create_type=False)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(ReportTargetTypeEnum, nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(ReportReasonEnum, nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(ReportStatusEnum, nullable=False, default="pending", index=True)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_id], back_populates="reports")  # noqa: F821
    resolver: Mapped["User | None"] = relationship("User", foreign_keys=[resolved_by])  # noqa: F821