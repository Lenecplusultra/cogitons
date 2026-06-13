# backend/app/repositories/moderation_repository.py
import uuid
from datetime import UTC

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.discussion import Discussion
from app.models.moderation_log import ModerationLog
from app.models.report import Report
from app.models.response import Response
from app.models.user import User


class ModerationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Reports ───────────────────────────────────────────────────────────────

    def create_report(
        self,
        reporter_id: uuid.UUID,
        target_type: str,
        target_id: uuid.UUID,
        reason: str,
        details: str | None,
    ) -> Report:
        report = Report(
            reporter_id=reporter_id,
            target_type=target_type,
            target_id=target_id,
            reason=reason,
            details=details,
            status="pending",
        )
        self.db.add(report)
        self.db.flush()
        return report

    def get_report_by_id(self, report_id: uuid.UUID) -> Report | None:
        return self.db.get(Report, report_id)

    def list_reports(
        self, status: str = "pending", page: int = 1, page_size: int = 20
    ) -> tuple[list[Report], int]:
        from sqlalchemy import func
        from sqlalchemy import select as sel

        base = (
            select(Report)
            .options(joinedload(Report.reporter))
            .where(Report.status == status)
            .order_by(Report.created_at.desc())
        )
        total_stmt = sel(func.count()).select_from(
            sel(Report).where(Report.status == status).subquery()
        )
        total = self.db.scalar(total_stmt) or 0
        items = list(
            self.db.scalars(base.offset((page - 1) * page_size).limit(page_size)).unique().all()
        )
        return items, total

    def dismiss_report(self, report: Report) -> Report:
        report.status = "dismissed"
        self.db.flush()
        return report

    def action_report(self, report: Report) -> Report:
        report.status = "actioned"
        self.db.flush()
        return report

    # ── Content ───────────────────────────────────────────────────────────────

    def get_discussion(self, discussion_id: uuid.UUID) -> Discussion | None:
        stmt = (
            select(Discussion)
            .options(joinedload(Discussion.author))
            .where(Discussion.id == discussion_id)
        )
        return self.db.scalars(stmt).first()

    def get_response(self, response_id: uuid.UUID) -> Response | None:
        stmt = (
            select(Response).options(joinedload(Response.author)).where(Response.id == response_id)
        )
        return self.db.scalars(stmt).first()

    def remove_discussion(self, discussion: Discussion) -> None:
        discussion.status = "removed"
        stmt = select(Response).where(
            Response.discussion_id == discussion.id,
            Response.status != "removed",
        )
        for r in self.db.scalars(stmt).all():
            r.status = "removed"
        self.db.flush()

    def remove_response(self, response: Response) -> None:
        response.status = "removed"
        self.db.flush()

    def lock_discussion(self, discussion: Discussion) -> Discussion:
        discussion.status = "locked"
        self.db.flush()
        return discussion

    def unlock_discussion(self, discussion: Discussion) -> Discussion:
        discussion.status = "published"
        self.db.flush()
        return discussion

    # ── Users ─────────────────────────────────────────────────────────────────

    def get_user(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def suspend_user(self, user: User) -> User:
        from datetime import datetime

        from app.models.token import RefreshToken

        user.status = "suspended"
        now = datetime.now(UTC)
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked_at.is_(None),
        )
        for token in self.db.scalars(stmt).all():
            token.revoked_at = now
        self.db.flush()
        return user

    def restore_user(self, user: User) -> User:
        user.status = "active"
        self.db.flush()
        return user

    # ── Moderation log ────────────────────────────────────────────────────────

    def write_log(
        self,
        admin_id: uuid.UUID,
        action: str,
        target_type: str,
        target_id: uuid.UUID,
        report_id: uuid.UUID | None = None,
        notes: str | None = None,
    ) -> ModerationLog:
        log = ModerationLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            report_id=report_id,
            notes=notes,
        )
        self.db.add(log)
        self.db.flush()
        return log

    def get_latest_log_for_target(self, target_id: uuid.UUID) -> ModerationLog | None:
        stmt = (
            select(ModerationLog)
            .options(joinedload(ModerationLog.admin))
            .where(ModerationLog.target_id == target_id)
            .order_by(ModerationLog.created_at.desc())
            .limit(1)
        )
        return self.db.scalars(stmt).first()

    def get_log_for_report(self, report_id: uuid.UUID) -> ModerationLog | None:
        stmt = (
            select(ModerationLog)
            .options(joinedload(ModerationLog.admin))
            .where(ModerationLog.report_id == report_id)
            .order_by(ModerationLog.created_at.desc())
            .limit(1)
        )
        return self.db.scalars(stmt).first()

    # ── Report context ────────────────────────────────────────────────────────

    def get_report_context(self, report_id: uuid.UUID) -> dict | None:
        report = self.get_report_by_id(report_id)
        if not report:
            return None

        if report.target_type == "discussion":
            discussion = self.get_discussion(report.target_id)
            if not discussion:
                result: dict = {
                    "target_type": "discussion",
                    "found": False,
                    "status": None,
                    "body": None,
                    "author": None,
                    "discussion_id": None,
                    "anchor": None,
                }
            else:
                result = {
                    "target_type": "discussion",
                    "found": True,
                    "status": discussion.status,
                    "body": discussion.body,
                    "author": discussion.author.username,
                    "discussion_id": str(discussion.id),
                    "anchor": None,
                }
        else:
            response = self.get_response(report.target_id)
            if not response:
                result = {
                    "target_type": "response",
                    "found": False,
                    "status": None,
                    "body": None,
                    "author": None,
                    "discussion_id": None,
                    "anchor": None,
                }
            else:
                result = {
                    "target_type": "response",
                    "found": True,
                    "status": response.status,
                    "body": response.body,
                    "author": response.author.username,
                    "discussion_id": str(response.discussion_id),
                    "anchor": f"response-{response.id}",
                }

        log = self.get_log_for_report(report.id)
        result["action_taken"] = (
            {
                "action": log.action,
                "admin": log.admin.username,
                "notes": log.notes,
                "at": log.created_at.isoformat(),
            }
            if log
            else None
        )

        return result
