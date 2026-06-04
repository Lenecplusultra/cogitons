import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing — bcrypt with automatic salt generation
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plain text password using bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain text password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    """
    Create a short-lived JWT access token.
    subject: the user's UUID as a string.
    """
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token() -> tuple[str, str]:
    """
    Create a refresh token.
    Returns (raw_token, hashed_token).
    raw_token goes into the HTTP-only cookie.
    hashed_token is stored in the database.
    """
    raw = secrets.token_urlsafe(64)
    hashed = _hash_token(raw)
    return raw, hashed


def create_verification_token() -> tuple[str, str]:
    """
    Create an email verification token.
    Returns (raw_token, hashed_token).
    raw_token is sent by email.
    hashed_token is stored in the database.
    """
    raw = secrets.token_urlsafe(32)
    hashed = _hash_token(raw)
    return raw, hashed


def decode_access_token(token: str) -> str | None:
    """
    Decode and validate a JWT access token.
    Returns the subject (user UUID) or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload.get("sub")
    except JWTError:
        return None


def _hash_token(raw: str) -> str:
    """SHA-256 hash a raw token for safe database storage."""
    return hashlib.sha256(raw.encode()).hexdigest()