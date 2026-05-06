from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.publication import PublicationRead

TaskStatus = Literal["queued", "running", "done", "failed", "published"]
SkippedReason = Literal["already_queued", "pipeline_running", "excluded_by_pattern"]


class TaskSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID | None
    file_path: str
    status: TaskStatus
    created_at: datetime
    updated_at: datetime


class TaskDetail(TaskSummary):
    model_config = ConfigDict(from_attributes=True)

    github_ref: str
    github_sha: str | None
    source_file_sha: str | None
    target_file_sha: str | None
    original_content: str
    translated_content: str | None
    error: str | None
    publications: list[PublicationRead] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    translated_content: str


class TaskListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[TaskSummary]
    total: int
    limit: int
    offset: int


class SkippedFile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    file_path: str
    reason: SkippedReason
    existing_task_id: UUID | None = None


class TaskCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    created: int
    task_ids: list[UUID]
    skipped: list[SkippedFile] = Field(default_factory=list)


class RetryRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    force: bool = False


class ManualTaskFromRepo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: UUID
    file_paths: list[str]


class ConflictDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    base: str
    ours: str
    theirs: str
