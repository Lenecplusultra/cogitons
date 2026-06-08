# backend/app/services/moderation_service.py
import math
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.moderation_repository import ModerationRepository
from app.schemas.report import (
    DismissReportBody,
    LockDiscussionBody,
    RemoveContentBody,
    ReportCreate,
    ReportCreated,
    ReportQueueData,
    ReportQueueItem,
    ReportReporter,
    RestoreUserBody,
    SuspendUserBody,
    UnlockDiscussionBody,
)


class ModerationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ModerationRepository(db)

    # ── Submit report ─────────────────────────────────────────────────────────

    def submit_report(self, reporter_id: uuid.UUID, body: ReportCreate) -> ReportCreated:
        report = self.repo.create_report(
            reporter_id=reporter_id,
            target_type=body.target_type,
            target_id=body.target_id,
            reason=body.reason,
            details=body.details,
        )
        self.db.commit()
        return ReportCreated(id=report.id, status=report.status)

    # ── Admin: list reports ───────────────────────────────────────────────────

    def list_reports(
        self, status: str = "pending", page: int = 1, page_size: int = 20
    ) -> ReportQueueData:
        items, total = self.repo.list_reports(status=status, page=page, page_size=page_size)
        total_pages = max(1, math.ceil(total / page_size))
        return ReportQueueData(
            items=[
                ReportQueueItem(
                    id=r.id,
                    reporter=ReportReporter(id=r.reporter.id, username=r.reporter.username),
                    target_type=r.target_type,
                    target_id=r.target_id,
                    reason=r.reason,
                    details=r.details,
                    status=r.status,
                    created_at=r.created_at,
                )
                for r in items
            ],
            pagination={
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
            },
        )

    # ── Admin: dismiss report ─────────────────────────────────────────────────

    def dismiss_report(
        self, admin_id: uuid.UUID, report_id: uuid.UUID, body: DismissReportBody
    ) -> None:
        report = self.repo.get_report_by_id(report_id)
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Report not found."},
            )
        self.repo.dismiss_report(report)
        self.repo.write_log(
            admin_id=admin_id,
            action="dismiss_report",
            target_type=report.target_type,
            target_id=report.target_id,
            report_id=report_id,
            notes=body.notes,
        )
        self.db.commit()

    # ── Admin: remove content ─────────────────────────────────────────────────

    def remove_content(self, admin_id: uuid.UUID, body: RemoveContentBody) -> None:
        if body.target_type == "discussion":
            target = self.repo.get_discussion(body.target_id)
            if not target:
                raise HTTPException(
                    status_code=404,
                    detail={"code": "NOT_FOUND", "message": "Discussion not found."},
                )
            self.repo.remove_discussion(target)
        else:
            target = self.repo.get_response(body.target_id)
            if not target:
                raise HTTPException(
                    status_code=404, detail={"code": "NOT_FOUND", "message": "Response not found."}
                )
            self.repo.remove_response(target)

        if body.report_id:
            report = self.repo.get_report_by_id(body.report_id)
            if report:
                self.repo.action_report(report)

        self.repo.write_log(
            admin_id=admin_id,
            action="remove_content",
            target_type=body.target_type,
            target_id=body.target_id,
            report_id=body.report_id,
            notes=body.notes,
        )
        self.db.commit()

    # ── Admin: lock discussion ────────────────────────────────────────────────

    def lock_discussion(
        self, admin_id: uuid.UUID, discussion_id: uuid.UUID, body: LockDiscussionBody
    ) -> dict:
        discussion = self.repo.get_discussion(discussion_id)
        if not discussion:
            raise HTTPException(
                status_code=404, detail={"code": "NOT_FOUND", "message": "Discussion not found."}
            )
        self.repo.lock_discussion(discussion)
        self.repo.write_log(
            admin_id=admin_id,
            action="lock_discussion",
            target_type="discussion",
            target_id=discussion_id,
            report_id=body.report_id,
            notes=body.notes,
        )
        self.db.commit()
        return {"id": str(discussion.id), "status": discussion.status}

    # ── Admin: unlock discussion ──────────────────────────────────────────────

    def unlock_discussion(
        self, admin_id: uuid.UUID, discussion_id: uuid.UUID, body: UnlockDiscussionBody
    ) -> dict:
        discussion = self.repo.get_discussion(discussion_id)
        if not discussion:
            raise HTTPException(
                status_code=404, detail={"code": "NOT_FOUND", "message": "Discussion not found."}
            )
        self.repo.unlock_discussion(discussion)
        self.repo.write_log(
            admin_id=admin_id,
            action="unlock_discussion",
            target_type="discussion",
            target_id=discussion_id,
            notes=body.notes,
        )
        self.db.commit()
        return {"id": str(discussion.id), "status": discussion.status}

    # ── Admin: suspend user ───────────────────────────────────────────────────

    def suspend_user(self, admin_id: uuid.UUID, user_id: uuid.UUID, body: SuspendUserBody) -> dict:
        user = self.repo.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=404, detail={"code": "NOT_FOUND", "message": "User not found."}
            )
        if user.id == admin_id:
            raise HTTPException(
                status_code=400, detail={"code": "FORBIDDEN", "message": "Cannot suspend yourself."}
            )
        self.repo.suspend_user(user)
        self.repo.write_log(
            admin_id=admin_id,
            action="suspend_user",
            target_type="user",
            target_id=user_id,
            report_id=body.report_id,
            notes=body.notes,
        )
        self.db.commit()
        return {"id": str(user.id), "status": user.status}

    # ── Admin: restore user ───────────────────────────────────────────────────

    def restore_user(self, admin_id: uuid.UUID, user_id: uuid.UUID, body: RestoreUserBody) -> dict:
        user = self.repo.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=404, detail={"code": "NOT_FOUND", "message": "User not found."}
            )
        self.repo.restore_user(user)
        self.repo.write_log(
            admin_id=admin_id,
            action="restore_user",
            target_type="user",
            target_id=user_id,
            notes=body.notes,
        )
        self.db.commit()
        return {"id": str(user.id), "status": user.status}

    # ── Admin: restore user ───────────────────────────────────────────────────

    def get_report_context(self, report_id: uuid.UUID) -> dict:
        context = self.repo.get_report_context(report_id)
        if not context:
            raise HTTPException(
                status_code=404, detail={"code": "NOT_FOUND", "message": "Report not found."}
            )
        return context
