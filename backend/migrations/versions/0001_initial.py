"""Initial migration: all V1 tables

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-03 00:00:00.000000 UTC
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Enum types (raw SQL — most reliable cross-driver approach) ─────────
    op.execute("CREATE TYPE user_role AS ENUM ('user', 'admin')")
    op.execute("CREATE TYPE user_status AS ENUM ('active', 'suspended', 'removed')")
    op.execute("CREATE TYPE subject_status AS ENUM ('active', 'archived', 'removed')")
    op.execute("CREATE TYPE discussion_status AS ENUM ('published', 'locked', 'removed')")
    op.execute("CREATE TYPE response_status AS ENUM ('published', 'removed')")
    op.execute("CREATE TYPE vote_target_type AS ENUM ('discussion', 'response')")
    op.execute("CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'dangerous_content', 'misinformation', 'privacy_violation', 'off_topic', 'other')")
    op.execute("CREATE TYPE report_target_type AS ENUM ('discussion', 'response')")
    op.execute("CREATE TYPE report_status AS ENUM ('pending', 'dismissed', 'actioned')")
    op.execute("CREATE TYPE moderation_action AS ENUM ('dismiss_report', 'remove_content', 'lock_discussion', 'unlock_discussion', 'suspend_user', 'restore_user')")
    op.execute("CREATE TYPE moderation_target_type AS ENUM ('discussion', 'response', 'user')")

    # Helper: reference an already-created PG enum without re-creating it
    def pg_enum(name):
        return postgresql.ENUM(name=name, create_type=False)

    # ── 2. users ─────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(40), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("bio", sa.String(300), nullable=True),
        sa.Column("role", pg_enum("user_role"), nullable=False, server_default="user"),
        sa.Column("status", pg_enum("user_status"), nullable=False, server_default="active"),
        sa.Column("email_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("last_login_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_status", "users", ["status"])

    # ── 3. email_verification_tokens ─────────────────────────────────────────
    op.create_table(
        "email_verification_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.Text, nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("used_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_evt_token_hash", "email_verification_tokens", ["token_hash"], unique=True)
    op.create_index("ix_evt_user_id", "email_verification_tokens", ["user_id"])
    op.create_index("ix_evt_expires_at", "email_verification_tokens", ["expires_at"])

    # ── 4. password_reset_tokens ─────────────────────────────────────────────
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.Text, nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("used_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_prt_token_hash", "password_reset_tokens", ["token_hash"], unique=True)
    op.create_index("ix_prt_user_id", "password_reset_tokens", ["user_id"])
    op.create_index("ix_prt_expires_at", "password_reset_tokens", ["expires_at"])

    # ── 5. refresh_tokens ────────────────────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.Text, nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_rt_token_hash", "refresh_tokens", ["token_hash"], unique=True)
    op.create_index("ix_rt_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_rt_expires_at", "refresh_tokens", ["expires_at"])

    # ── 6. subjects ──────────────────────────────────────────────────────────
    op.create_table(
        "subjects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("slug", sa.String(170), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("status", pg_enum("subject_status"), nullable=False, server_default="active"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_subjects_slug", "subjects", ["slug"], unique=True)
    op.create_index("ix_subjects_title", "subjects", ["title"], unique=True)
    op.create_index("ix_subjects_status", "subjects", ["status"])

    # ── 7. subject_slug_history ──────────────────────────────────────────────
    op.create_table(
        "subject_slug_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("old_slug", sa.String(170), nullable=False),
        sa.Column("changed_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_ssh_subject_id", "subject_slug_history", ["subject_id"])
    op.create_index("ix_ssh_old_slug", "subject_slug_history", ["old_slug"])

    # ── 8. discussions ───────────────────────────────────────────────────────
    op.create_table(
        "discussions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("status", pg_enum("discussion_status"), nullable=False, server_default="published"),
        sa.Column("edited", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("removed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("locked_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_discussions_subject_id", "discussions", ["subject_id"])
    op.create_index("ix_discussions_author_id", "discussions", ["author_id"])
    op.create_index("ix_discussions_status", "discussions", ["status"])
    op.create_index("ix_discussions_created_at", "discussions", ["created_at"])
    op.create_index("ix_discussions_subject_status_created", "discussions", ["subject_id", "status", "created_at"])

    # ── 9. responses ─────────────────────────────────────────────────────────
    op.create_table(
        "responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("discussion_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("discussions.id"), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("status", pg_enum("response_status"), nullable=False, server_default="published"),
        sa.Column("edited", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("removed_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_responses_discussion_id", "responses", ["discussion_id"])
    op.create_index("ix_responses_author_id", "responses", ["author_id"])
    op.create_index("ix_responses_status", "responses", ["status"])
    op.create_index("ix_responses_created_at", "responses", ["created_at"])
    op.create_index("ix_responses_discussion_status_created", "responses", ["discussion_id", "status", "created_at"])

    # ── 10. votes ────────────────────────────────────────────────────────────
    op.create_table(
        "votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_type", pg_enum("vote_target_type"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value", sa.SmallInteger, nullable=False, server_default="1"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.UniqueConstraint("user_id", "target_type", "target_id", name="uq_vote_per_target"),
        sa.CheckConstraint("value = 1", name="ck_vote_value_is_one"),
    )
    op.create_index("ix_votes_user_id", "votes", ["user_id"])
    op.create_index("ix_votes_target", "votes", ["target_type", "target_id"])

    # ── 11. reports ──────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_type", pg_enum("report_target_type"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reason", pg_enum("report_reason"), nullable=False),
        sa.Column("details", sa.Text, nullable=True),
        sa.Column("status", pg_enum("report_status"), nullable=False, server_default="pending"),
        sa.Column("resolved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("resolved_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_reports_reporter_id", "reports", ["reporter_id"])
    op.create_index("ix_reports_target_id", "reports", ["target_id"])
    op.create_index("ix_reports_status", "reports", ["status"])

    # ── 12. moderation_logs ──────────────────────────────────────────────────
    op.create_table(
        "moderation_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", pg_enum("moderation_action"), nullable=False),
        sa.Column("target_type", pg_enum("moderation_target_type"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reports.id"), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_moderation_logs_admin_id", "moderation_logs", ["admin_id"])
    op.create_index("ix_moderation_logs_action", "moderation_logs", ["action"])
    op.create_index("ix_moderation_logs_target_id", "moderation_logs", ["target_id"])


def downgrade() -> None:
    op.drop_table("moderation_logs")
    op.drop_table("reports")
    op.drop_table("votes")
    op.drop_table("responses")
    op.drop_table("discussions")
    op.drop_table("subject_slug_history")
    op.drop_table("subjects")
    op.drop_table("refresh_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_table("email_verification_tokens")
    op.drop_table("users")
    for enum_name in [
        "moderation_target_type", "moderation_action", "report_status",
        "report_target_type", "report_reason", "vote_target_type",
        "response_status", "discussion_status", "subject_status",
        "user_status", "user_role",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")