"""
Email utility — Resend integration.
Sends transactional emails: verification and password reset.
Raw tokens are passed in here and embedded in links.
Never log or store raw tokens.
"""

import resend

from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY


def _send(to: str, subject: str, html: str) -> None:
    """Base send function. All emails go through here."""
    resend.Emails.send({
        "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
        "to": [to],
        "subject": subject,
        "html": html,
    })


def send_verification_email(to: str, username: str, raw_token: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A3C5E;">Welcome to Cogitons, {username}!</h2>
      <p>Thank you for creating an account. Please verify your email address to get started.</p>
      <p style="margin: 32px 0;">
        <a href="{verify_url}"
           style="background-color: #2E6DA4; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Verify my email
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link expires in 24 hours. If you didn't create an account, you can ignore this email.
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy this link: {verify_url}
      </p>
    </div>
    """
    _send(to, "Verify your Cogitons email", html)


def send_password_reset_email(to: str, username: str, raw_token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A3C5E;">Reset your password, {username}</h2>
      <p>We received a request to reset your Cogitons password.</p>
      <p style="margin: 32px 0;">
        <a href="{reset_url}"
           style="background-color: #2E6DA4; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset my password
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link expires in 1 hour. If you didn't request this, you can ignore this email.
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy this link: {reset_url}
      </p>
    </div>
    """
    _send(to, "Reset your Cogitons password", html)