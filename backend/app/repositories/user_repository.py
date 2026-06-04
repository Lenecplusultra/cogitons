import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken
from app.models.user import User


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
            (RefreshToken.expires_at < datetime.now(UTC))
            | (RefreshToken.revoked_at.is_not(None))
        )
        self.db.execute(stmt)