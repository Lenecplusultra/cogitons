import uuid
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.discussion import Discussion
from app.models.response import Response
from app.models.subject import Subject
from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken
from app.models.user import User
from app.models.vote import Vote


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── User queries ─────────────────────────────────────────────────────────

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email.lower())
        return self.db.scalar(stmt)

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username.lower())
        return self.db.scalar(stmt)

    def create(self, username: str, email: str, password_hash: str) -> User:
        user = User(
            username=username.lower(),
            email=email.lower(),
            password_hash=password_hash,
        )
        self.db.add(user)
        self.db.flush()  # Get the UUID without committing
        return user

    def update_last_login(self, user: User) -> None:
        user.last_login_at = datetime.now(UTC)

    def update_email_verified(self, user: User) -> None:
        user.email_verified = True

    def update_password(self, user: User, password_hash: str) -> None:
        user.password_hash = password_hash

    # ── Email verification tokens ─────────────────────────────────────────────

    def create_verification_token(
        self, user_id: uuid.UUID, token_hash: str, expires_at: datetime
    ) -> EmailVerificationToken:
        token = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token)
        self.db.flush()
        return token

    def get_verification_token(self, token_hash: str) -> EmailVerificationToken | None:
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None),
        )
        return self.db.scalar(stmt)

    def mark_verification_token_used(self, token: EmailVerificationToken) -> None:
        token.used_at = datetime.now(UTC)

    # ── Password reset tokens ─────────────────────────────────────────────────

    def create_password_reset_token(
        self, user_id: uuid.UUID, token_hash: str, expires_at: datetime
    ) -> PasswordResetToken:
        token = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token)
        self.db.flush()
        return token

    def get_password_reset_token(self, token_hash: str) -> PasswordResetToken | None:
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
        )
        return self.db.scalar(stmt)

    def mark_password_reset_token_used(self, token: PasswordResetToken) -> None:
        token.used_at = datetime.now(UTC)

    # ── Refresh tokens ────────────────────────────────────────────────────────

    def create_refresh_token(
        self, user_id: uuid.UUID, token_hash: str, expires_at: datetime
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token)
        self.db.flush()
        return token

    def get_refresh_token(self, token_hash: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
        )
        return self.db.scalar(stmt)

    def revoke_refresh_token(self, token: RefreshToken) -> None:
        token.revoked_at = datetime.now(UTC)

    def cleanup_refresh_tokens(self) -> None:
        """Addition 3: delete expired and revoked refresh tokens."""
        from sqlalchemy import delete

        stmt = delete(RefreshToken).where(
            (RefreshToken.expires_at < datetime.now(UTC)) | (RefreshToken.revoked_at.is_not(None))
        )
        self.db.execute(stmt)

    # -----------------------------------------------------------------
    # Profile aggregation (GET /users/{username})
    # -----------------------------------------------------------------

    def get_profile_stats(self, user_id: UUID) -> dict:
        """Discussion count, response count, and total Useful votes received."""
        discussions = (
            self.db.scalar(
                select(func.count(Discussion.id)).where(
                    Discussion.author_id == user_id,
                    Discussion.status != "removed",
                )
            )
            or 0
        )
        responses = (
            self.db.scalar(
                select(func.count(Response.id)).where(
                    Response.author_id == user_id,
                    Response.status != "removed",
                )
            )
            or 0
        )
        votes_on_discussions = (
            self.db.scalar(
                select(func.count(Vote.id))
                .join(
                    Discussion,
                    and_(
                        Vote.target_type == "discussion",
                        Vote.target_id == Discussion.id,
                    ),
                )
                .where(
                    Discussion.author_id == user_id,
                    Discussion.status != "removed",
                )
            )
            or 0
        )
        votes_on_responses = (
            self.db.scalar(
                select(func.count(Vote.id))
                .join(
                    Response,
                    and_(
                        Vote.target_type == "response",
                        Vote.target_id == Response.id,
                    ),
                )
                .where(
                    Response.author_id == user_id,
                    Response.status != "removed",
                )
            )
            or 0
        )
        return {
            "discussions": discussions,
            "responses": responses,
            "useful_votes_received": votes_on_discussions + votes_on_responses,
        }

    def get_active_in(self, user_id: UUID, limit: int = 5) -> list[dict]:
        """Per-subject activity, ranked by total contributions (discussions + responses)."""
        disc_counts = dict(
            self.db.execute(
                select(Discussion.subject_id, func.count(Discussion.id))
                .where(Discussion.author_id == user_id, Discussion.status != "removed")
                .group_by(Discussion.subject_id)
            ).all()
        )
        resp_counts = dict(
            self.db.execute(
                select(Discussion.subject_id, func.count(Response.id))
                .join(Discussion, Response.discussion_id == Discussion.id)
                .where(
                    Response.author_id == user_id,
                    Response.status != "removed",
                    Discussion.status != "removed",
                )
                .group_by(Discussion.subject_id)
            ).all()
        )
        subject_ids = set(disc_counts) | set(resp_counts)
        if not subject_ids:
            return []

        subjects = self.db.execute(
            select(Subject.id, Subject.title, Subject.slug).where(Subject.id.in_(subject_ids))
        ).all()

        rows = [
            {
                "subject_title": title,
                "subject_slug": slug,
                "discussion_count": disc_counts.get(sid, 0),
                "response_count": resp_counts.get(sid, 0),
                "_total": disc_counts.get(sid, 0) + resp_counts.get(sid, 0),
            }
            for sid, title, slug in subjects
        ]
        rows.sort(key=lambda r: r["_total"], reverse=True)
        for r in rows:
            r.pop("_total")
        return rows[:limit]

    def get_recent_user_discussions(self, user_id, viewer_id=None, limit: int = 20) -> list[dict]:
        useful_sq = (
            select(func.count(Vote.id))
            .where(Vote.target_type == "discussion", Vote.target_id == Discussion.id)
            .correlate(Discussion)
            .scalar_subquery()
        )
        responses_sq = (
            select(func.count(Response.id))
            .where(Response.discussion_id == Discussion.id, Response.status != "removed")
            .correlate(Discussion)
            .scalar_subquery()
        )
        voted_sq = (
            select(func.count(Vote.id))
            .where(
                Vote.target_type == "discussion",
                Vote.target_id == Discussion.id,
                Vote.user_id == viewer_id,
            )
            .correlate(Discussion)
            .scalar_subquery()
        )
        rows = self.db.execute(
            select(
                Discussion.id,
                Discussion.title,
                Discussion.body,
                Discussion.edited,
                Discussion.created_at,
                Subject.title,
                Subject.slug,
                useful_sq.label("useful"),
                responses_sq.label("responses"),
                voted_sq.label("voted"),
            )
            .join(Subject, Discussion.subject_id == Subject.id)
            .where(Discussion.author_id == user_id, Discussion.status != "removed")
            .order_by(Discussion.created_at.desc())
            .limit(limit)
        ).all()
        return [
            {
                "id": r[0],
                "title": r[1],
                "body": r[2],
                "edited": r[3],
                "created_at": r[4],
                "subject_title": r[5],
                "subject_slug": r[6],
                "useful_count": r[7] or 0,
                "response_count": r[8] or 0,
                "viewer_voted": (r[9] or 0) > 0,
            }
            for r in rows
        ]

    def get_recent_user_responses(self, user_id, viewer_id=None, limit: int = 20) -> list[dict]:
        useful_sq = (
            select(func.count(Vote.id))
            .where(Vote.target_type == "response", Vote.target_id == Response.id)
            .correlate(Response)
            .scalar_subquery()
        )
        voted_sq = (
            select(func.count(Vote.id))
            .where(
                Vote.target_type == "response",
                Vote.target_id == Response.id,
                Vote.user_id == viewer_id,
            )
            .correlate(Response)
            .scalar_subquery()
        )
        rows = self.db.execute(
            select(
                Response.id,
                Response.body,
                Response.edited,
                Response.created_at,
                Discussion.id,
                Discussion.title,
                Subject.title,
                Subject.slug,
                useful_sq.label("useful"),
                voted_sq.label("voted"),
            )
            .join(Discussion, Response.discussion_id == Discussion.id)
            .join(Subject, Discussion.subject_id == Subject.id)
            .where(Response.author_id == user_id, Response.status != "removed")
            .order_by(Response.created_at.desc())
            .limit(limit)
        ).all()
        return [
            {
                "id": r[0],
                "body": r[1],
                "edited": r[2],
                "created_at": r[3],
                "discussion_id": r[4],
                "discussion_title": r[5],
                "subject_title": r[6],
                "subject_slug": r[7],
                "useful_count": r[8] or 0,
                "viewer_voted": (r[9] or 0) > 0,
            }
            for r in rows
        ]
