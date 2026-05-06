from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserRegister(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: str
    password: str
    display_name: str | None = None


class UserLogin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: str
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str | None
    github_linked: bool
    github_login: str | None


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    current_password: str
    new_password: str
