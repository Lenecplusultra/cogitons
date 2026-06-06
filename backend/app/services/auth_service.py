"""
Auth service — all business logic for authentication.
The router calls this. This calls the repository.
No direct database access here — only through UserRepository.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    _hash_token,
    create_access_token,
    create_refresh_token,
    create_verification_token,
    hash_password,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmSchema,
    PasswordResetRequestSchema,
    ResendVerificationRequest,
    SignupRequest,
    UserPublicSchema,
    VerifyEmailRequest,
)
from app.utils.email import send_password_reset_email, send_verification_email


class AuthError(Exception):
    """Raised when an auth operation fails. Carries an HTTP status code."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    # ── Signup ────────────────────────────────────────────────────────────────

    def signup(self, data: SignupRequest) -> MessageResponse:
        if self.repo.get_by_email(data.email):
            raise AuthError("An account with this email already exists.", 409)
        if self.repo.get_by_username(data.username):
            raise AuthError("This username is already taken.", 409)

        password_hash = hash_password(data.password)
        user = self.repo.create(data.username, data.email, password_hash)

        raw_token, token_hash = create_verification_token()
        expires_at = datetime.now(UTC) + timedelta(hours=24)
        self.repo.create_verification_token(user.id, token_hash, expires_at)

        self.db.commit()

        send_verification_email(data.email, data.username, raw_token)

        return MessageResponse(
            message="Account created. Please check your email to verify your account."
        )

    # ── Verify email ──────────────────────────────────────────────────────────

    def verify_email(self, data: VerifyEmailRequest) -> MessageResponse:
        token_hash = _hash_token(data.token)
        token = self.repo.get_verification_token(token_hash)

        if not token:
            raise AuthError("Invalid or expired verification token.", 400)
        if token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise AuthError("This verification link has expired. Please request a new one.", 400)

        self.repo.mark_verification_token_used(token)
        self.repo.update_email_verified(token.user)
        self.db.commit()

        return MessageResponse(message="Email verified. You can now log in.")

    # ── Resend verification ───────────────────────────────────────────────────

    def resend_verification(self, data: ResendVerificationRequest) -> MessageResponse:
        user = self.repo.get_by_email(data.email)

        # Always return success — never reveal if email exists
        if not user or user.email_verified:
            return MessageResponse(
                message="If that email is registered and unverified, a new link has been sent."
            )

        raw_token, token_hash = create_verification_token()
        expires_at = datetime.now(UTC) + timedelta(hours=24)
        self.repo.create_verification_token(user.id, token_hash, expires_at)
        self.db.commit()

        send_verification_email(data.email, user.username, raw_token)

        return MessageResponse(
            message="If that email is registered and unverified, a new link has been sent."
        )

    # ── Login ─────────────────────────────────────────────────────────────────

    def login(self, data: LoginRequest) -> tuple[AuthResponse, str]:
        """
        Returns (AuthResponse, raw_refresh_token).
        The router puts the raw refresh token in an HTTP-only cookie.
        """
        user = self.repo.get_by_email(data.email)

        if not user or not verify_password(data.password, user.password_hash):
            raise AuthError("Invalid email or password.", 401)
        if not user.email_verified:
            raise AuthError("Please verify your email before logging in.", 403)
        if user.status == "suspended":
            raise AuthError("Your account has been suspended.", 403)

        access_token = create_access_token(str(user.id))
        raw_refresh, refresh_hash = create_refresh_token()
        expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.repo.create_refresh_token(user.id, refresh_hash, expires_at)
        self.repo.update_last_login(user)
        self.db.commit()

        return (
            AuthResponse(
                user=UserPublicSchema.model_validate(user),
                access_token=access_token,
            ),
            raw_refresh,
        )

    # ── Refresh ───────────────────────────────────────────────────────────────

    def refresh(self, raw_refresh_token: str) -> tuple[AuthResponse, str]:
        token_hash = _hash_token(raw_refresh_token)
        token = self.repo.get_refresh_token(token_hash)

        if not token:
            raise AuthError("Invalid or expired session. Please log in again.", 401)
        if token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise AuthError("Session expired. Please log in again.", 401)

        # Rotate: revoke old, issue new
        self.repo.revoke_refresh_token(token)
        new_access = create_access_token(str(token.user_id))

        raw_refresh, refresh_hash = create_refresh_token()
        expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.repo.create_refresh_token(token.user_id, refresh_hash, expires_at)

        self.db.commit()

        user = self.repo.get_by_id(token.user_id)
        return AuthResponse(
            user=UserPublicSchema.model_validate(user),
            access_token=new_access,
        ), raw_refresh

    # ── Logout ────────────────────────────────────────────────────────────────

    def logout(self, raw_refresh_token: str | None) -> MessageResponse:
        if raw_refresh_token:
            token_hash = _hash_token(raw_refresh_token)
            token = self.repo.get_refresh_token(token_hash)
            if token:
                self.repo.revoke_refresh_token(token)
                self.db.commit()
        return MessageResponse(message="Logged out successfully.")

    # ── Password reset request ────────────────────────────────────────────────

    def password_reset_request(self, data: PasswordResetRequestSchema) -> MessageResponse:
        user = self.repo.get_by_email(data.email)

        # Always return success — never reveal if email exists
        if not user or not user.email_verified:
            return MessageResponse(
                message="If that email is registered, a password reset link has been sent."
            )

        raw_token, token_hash = create_verification_token()
        expires_at = datetime.now(UTC) + timedelta(hours=1)
        self.repo.create_password_reset_token(user.id, token_hash, expires_at)
        self.db.commit()

        send_password_reset_email(data.email, user.username, raw_token)

        return MessageResponse(
            message="If that email is registered, a password reset link has been sent."
        )

    # ── Password reset confirm ────────────────────────────────────────────────

    def password_reset_confirm(self, data: PasswordResetConfirmSchema) -> MessageResponse:
        token_hash = _hash_token(data.token)
        token = self.repo.get_password_reset_token(token_hash)

        if not token:
            raise AuthError("Invalid or expired reset token.", 400)
        if token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise AuthError("This reset link has expired. Please request a new one.", 400)

        new_hash = hash_password(data.new_password)
        self.repo.update_password(token.user, new_hash)
        self.repo.mark_password_reset_token_used(token)
        self.db.commit()

        return MessageResponse(message="Password updated. You can now log in.")
