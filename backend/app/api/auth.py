"""
Auth router — HTTP layer only.
Validates input, calls AuthService, sets/clears cookies.
No business logic here.
"""

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_verified_user, get_refresh_token_from_cookie
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmSchema,
    PasswordResetRequestSchema,
    ResendVerificationRequest,
    SignupRequest,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthError, AuthService

router = APIRouter(prefix="/auth")

COOKIE_NAME = "refresh_token"
COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # seconds


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_token,
        httponly=True,           # Not accessible via JavaScript
        secure=settings.APP_ENV == "production",  # HTTPS only in production
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/api/v1/auth",     # Cookie only sent to auth endpoints
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/api/v1/auth")


def _handle_auth_error(e: AuthError) -> None:
    raise HTTPException(
        status_code=e.status_code,
        detail={"code": "UNAUTHORIZED" if e.status_code == 401 else "FORBIDDEN" if e.status_code == 403 else "CONFLICT" if e.status_code == 409 else "VALIDATION_ERROR", "message": e.message},
    )


@router.post("/signup", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    try:
        return AuthService(db).signup(data)
    except AuthError as e:
        _handle_auth_error(e)


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    try:
        return AuthService(db).verify_email(data)
    except AuthError as e:
        _handle_auth_error(e)


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    return AuthService(db).resend_verification(data)


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        auth_response, raw_refresh = AuthService(db).login(data)
        _set_refresh_cookie(response, raw_refresh)
        return auth_response
    except AuthError as e:
        _handle_auth_error(e)


@router.post("/refresh", response_model=AuthResponse)
def refresh(
    response: Response,
    db: Session = Depends(get_db),
    raw_refresh_token: str | None = Depends(get_refresh_token_from_cookie),
):
    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "No session found. Please log in."},
        )
    try:
        auth_response = AuthService(db).refresh(raw_refresh_token)
        # Issue a new cookie with the same token (sliding expiry not implemented in V1)
        _set_refresh_cookie(response, raw_refresh_token)
        return auth_response
    except AuthError as e:
        _handle_auth_error(e)


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    raw_refresh_token: str | None = Depends(get_refresh_token_from_cookie),
):
    result = AuthService(db).logout(raw_refresh_token)
    _clear_refresh_cookie(response)
    return result


@router.post("/password-reset/request", response_model=MessageResponse)
def password_reset_request(data: PasswordResetRequestSchema, db: Session = Depends(get_db)):
    return AuthService(db).password_reset_request(data)


@router.post("/password-reset/confirm", response_model=MessageResponse)
def password_reset_confirm(data: PasswordResetConfirmSchema, db: Session = Depends(get_db)):
    try:
        return AuthService(db).password_reset_confirm(data)
    except AuthError as e:
        _handle_auth_error(e)