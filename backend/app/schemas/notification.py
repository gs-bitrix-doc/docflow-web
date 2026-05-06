from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

NotificationMethod = Literal["incoming_webhook", "rest_api"]
NotificationDestinationType = Literal["user", "chat", "channel"]
NotificationEvent = Literal["failure", "conflict", "done", "published"]


class NotificationChannelCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    method: NotificationMethod
    webhook_url: str | None = None
    bitrix_token: str | None = None
    destination_type: NotificationDestinationType | None = None
    destination_id: str | None = None
    events: list[NotificationEvent]


class NotificationChannelRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    method: NotificationMethod
    destination_label: str
    events: list[NotificationEvent]
    is_active: bool
    created_at: datetime


class NotificationChannelUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    events: list[NotificationEvent] | None = None
    is_active: bool | None = None
