"""
FastAPI dependencies — injected into route handlers via Depends().
These handle authentication and authorization for every protected endpoint.
"""

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Extracts and validates the JWT access token from the Authorization header.
    Returns the authenticated User or raises 401.
    Used on all endpoints that require a logged-in user.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required."},
        )

    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid or expired token."},
        )

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)  # type: ignore[arg-type]
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "User not found."},
        )

    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Your account has been suspended."},
        )

    return user


def get_current_verified_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Same as get_current_user but also requires email_verified = True.
    Used on endpoints that require a fully active account.
    """
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Email verification required."},
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_verified_user),
) -> User:
    """
    Requires the current user to be an admin.
    Used on all /admin/* endpoints.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Admin access required."},
        )
    return current_user


def get_refresh_token_from_cookie(
    refresh_token: str | None = Cookie(default=None),
) -> str | None:
    """Extracts the refresh token from the HTTP-only cookie."""
    return refresh_token