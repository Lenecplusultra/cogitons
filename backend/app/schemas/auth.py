import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

# ── Request schemas (what the client sends) ──────────────────────────────────


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens and underscores")
        return v.lower()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestSchema(BaseModel):
    email: EmailStr


class PasswordResetConfirmSchema(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=100)


# ── Response schemas (what the server returns) ────────────────────────────────


class UserPublicSchema(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: str
    email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserPublicSchema
    access_token: str


class MessageResponse(BaseModel):
    message: str
