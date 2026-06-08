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
        base = (
            select(Report)
            .options(joinedload(Report.reporter))
            .where(Report.status == status)
            .order_by(Report.created_at.desc())
        )
        from sqlalchemy import func
        from sqlalchemy import select as sel

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
        return self.db.get(Discussion, discussion_id)

    def get_response(self, response_id: uuid.UUID) -> Response | None:
        return self.db.get(Response, response_id)

    def remove_discussion(self, discussion: Discussion) -> None:
        discussion.status = "removed"
        # cascade soft delete to responses
        from app.models.response import Response as Resp

        stmt = select(Resp).where(
            Resp.discussion_id == discussion.id,
            Resp.status != "removed",
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
        user.status = "suspended"
        # revoke all refresh tokens
        from app.models.token import RefreshToken

        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked_at.is_(None),
        )
        from datetime import datetime

        now = datetime.now(UTC)
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
