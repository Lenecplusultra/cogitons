"""
Import all models here so that Alembic's env.py can discover them
via `from app.models import *` or `import app.models`.
"""

from app.models.discussion import Discussion  # noqa: F401
from app.models.moderation_log import ModerationLog  # noqa: F401
from app.models.report import Report  # noqa: F401
from app.models.response import Response  # noqa: F401
from app.models.subject import Subject, SubjectSlugHistory  # noqa: F401
from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.vote import Vote  # noqa: F401

__all__ = [
    "User",
    "EmailVerificationToken",
    "PasswordResetToken",
    "RefreshToken",
    "Subject",
    "SubjectSlugHistory",
    "Discussion",
    "Response",
    "Vote",
    "Report",
    "ModerationLog",
]