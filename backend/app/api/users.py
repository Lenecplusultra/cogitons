from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UpdateMeRequest, UpdateMeResponse, UserMeResponse, UserPublicResponse

router = APIRouter(prefix="/users", tags=["users"])


# ---------------------------------------------------------------------------
# GET /api/v1/users/me
# ---------------------------------------------------------------------------


@router.get(
    "/me",
    response_model=dict,
    summary="Get own profile",
)
def get_me(current_user: User = Depends(get_current_verified_user)) -> dict:
    """
    Returns the authenticated user's full profile.

    Requires: valid JWT access token (verified email).
    """
    data = UserMeResponse.model_validate(current_user)
    return {"success": True, "data": data.model_dump()}


# ---------------------------------------------------------------------------
# PATCH /api/v1/users/me
# ---------------------------------------------------------------------------


@router.patch(
    "/me",
    response_model=dict,
    summary="Update own profile",
)
def update_me(
    payload: UpdateMeRequest,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Updates the authenticated user's username and/or bio.

    Rules:
    - At least one field must be provided.
    - Username must remain unique across all accounts.
    - Email cannot be changed in V1.
    - Bio max length: 300 characters (enforced in schema).
    """
    if payload.username is None and payload.bio is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Provide at least one field to update.",
                },
            },
        )

    repo = UserRepository(db)

    # Username uniqueness check
    if payload.username is not None and payload.username != current_user.username:
        existing = repo.get_by_username(payload.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": {
                        "code": "CONFLICT",
                        "message": "That username is already taken.",
                    },
                },
            )
        current_user.username = payload.username

    if payload.bio is not None:
        current_user.bio = payload.bio

    db.commit()
    db.refresh(current_user)

    data = UpdateMeResponse.model_validate(current_user)
    return {"success": True, "data": data.model_dump()}


# ---------------------------------------------------------------------------
# GET /api/v1/users/{username}
# ---------------------------------------------------------------------------


@router.get(
    "/{username}",
    response_model=dict,
    summary="Get public profile by username",
)
def get_user_by_username(username: str, db: Session = Depends(get_db)) -> dict:
    """
    Returns a public user profile by username.

    Public endpoint — no authentication required.
    Email, role, and status are never exposed here.
    Removed accounts return 404.
    """
    repo = UserRepository(db)
    user = repo.get_by_username(username)

    if not user or user.status == "removed":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "User not found.",
                },
            },
        )

    data = UserPublicResponse.model_validate(user)
    return {"success": True, "data": data.model_dump()}
