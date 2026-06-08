# backend/app/schemas/report.py
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ReportReason = Literal[
    "spam",
    "harassment",
    "hate_speech",
    "dangerous_content",
    "misinformation",
    "privacy_violation",
    "off_topic",
    "other",
]

TargetType = Literal["discussion", "response"]


# ── Submit report ─────────────────────────────────────────────────────────────


class ReportCreate(BaseModel):
    target_type: TargetType
    target_id: uuid.UUID
    reason: ReportReason
    details: str | None = None


class ReportCreated(BaseModel):
    id: uuid.UUID
    status: str


# ── Admin queue ───────────────────────────────────────────────────────────────


class ReportReporter(BaseModel):
    id: uuid.UUID
    username: str

    model_config = {"from_attributes": True}


class ReportQueueItem(BaseModel):
    id: uuid.UUID
    reporter: ReportReporter
    target_type: str
    target_id: uuid.UUID
    reason: str
    details: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportQueueData(BaseModel):
    items: list[ReportQueueItem]
    pagination: dict


# ── Admin actions ─────────────────────────────────────────────────────────────


class DismissReportBody(BaseModel):
    notes: str | None = None


class RemoveContentBody(BaseModel):
    target_type: TargetType
    target_id: uuid.UUID
    report_id: uuid.UUID | None = None
    notes: str | None = None


class LockDiscussionBody(BaseModel):
    report_id: uuid.UUID | None = None
    notes: str | None = None


class UnlockDiscussionBody(BaseModel):
    notes: str | None = None


class SuspendUserBody(BaseModel):
    report_id: uuid.UUID | None = None
    notes: str | None = None


class RestoreUserBody(BaseModel):
    notes: str | None = None
