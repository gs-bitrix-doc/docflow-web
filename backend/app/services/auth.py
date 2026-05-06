from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.db.session import get_db_session
from app.models.user import User

ALGORITHM = "HS256"
SESSION_COOKIE_NAME = "session"
SESSION_LIFETIME_DAYS = 30

DbSession = Annotated[AsyncSession, Depends(get_db_session)]
SessionToken = Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)]
DUMMY_PASSWORD_HASH = bcrypt.hashpw(
    b"docflow-dummy-password",
    bcrypt.gensalt(),
).decode("utf-8")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


async def hash_password_async(password: str) -> str:
    return await run_in_threadpool(hash_password, password)


async def verify_password_async(password: str, password_hash: str) -> bool:
    return await run_in_threadpool(verify_password, password, password_hash)


def create_jwt(user_id: uuid.UUID | str) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_LIFETIME_DAYS)
    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.session_secret, algorithm=ALGORITHM)


def decode_jwt(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.session_secret, algorithms=[ALGORITHM])


async def get_current_user(
    session: DbSession,
    session_token: SessionToken = None,
) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = decode_jwt(session_token)
        user_id = uuid.UUID(payload["sub"])
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        ) from exc

    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return user
