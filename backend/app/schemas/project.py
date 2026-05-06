from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    source_repo: str
    source_branch: str = "main"
    target_repo: str
    target_branch: str = "main"
    exclude_patterns: list[str] = Field(default_factory=list)


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    source_repo: str
    source_branch: str
    target_repo: str
    target_branch: str
    webhook_url: str
    created_at: datetime


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    source_repo: str | None = None
    source_branch: str | None = None
    target_repo: str | None = None
    target_branch: str | None = None
    exclude_patterns: list[str] | None = None
