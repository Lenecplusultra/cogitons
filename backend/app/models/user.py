import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from app.core.database import Base

UserRoleEnum = Enum("user", "admin", name="user_role", create_type=False)
UserStatusEnum = Enum("active", "suspended", "removed", name="user_status", create_type=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    bio: Mapped[str | None] = mapped_column(String(300), nullable=True)
    role: Mapped[str] = mapped_column(UserRoleEnum, nullable=False, default="user", index=True)
    status: Mapped[str] = mapped_column(
        UserStatusEnum, nullable=False, default="active", index=True
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    # Addition 2: last_login_at — set on every successful login
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    discussions: Mapped[list["Discussion"]] = relationship(back_populates="author")  # noqa: F821
    responses: Mapped[list["Response"]] = relationship(back_populates="author")  # noqa: F821
    votes: Mapped[list["Vote"]] = relationship(back_populates="user")  # noqa: F821
    reports: Mapped[list["Report"]] = relationship(back_populates="reporter")  # noqa: F821
    moderation_logs: Mapped[list["ModerationLog"]] = relationship(back_populates="admin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} role={self.role}>"
