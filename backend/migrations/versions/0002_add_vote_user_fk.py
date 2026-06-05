"""add foreign key constraint on votes.user_id

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-05
"""
from alembic import op

revision = "0002"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_foreign_key(
        "fk_votes_user_id",
        "votes",
        "users",
        ["user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_votes_user_id", "votes", type_="foreignkey")
