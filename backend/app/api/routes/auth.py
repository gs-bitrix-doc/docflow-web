from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, UserLogin, UserRead, UserRegister
from app.services.auth import (
    DUMMY_PASSWORD_HASH,
    SESSION_COOKIE_NAME,
    SESSION_LIFETIME_DAYS,
    create_jwt,
    get_current_user,
    hash_password_async,
    verify_password_async,
)

limiter = Limiter(key_func=get_remote_address)
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]

router = APIRouter(prefix="/auth", tags=["auth"])


def set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_LIFETIME_DAYS * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
        secure=not settings.debug,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=not settings.debug,
        path="/",
    )


def to_user_read(user: User) -> UserRead:
    return UserRead.model_validate(user)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request,
    payload: UserRegister,
    response: Response,
    session: DbSession,
) -> UserRead:
    existing_user = await session.scalar(select(User).where(User.email == payload.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        password_hash=await hash_password_async(payload.password),
        display_name=payload.display_name,
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        ) from exc

    await session.refresh(user)

    set_session_cookie(response, create_jwt(user.id))
    return to_user_read(user)


@router.post("/login", response_model=UserRead)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: UserLogin,
    response: Response,
    session: DbSession,
) -> UserRead:
    user = await session.scalar(select(User).where(User.email == payload.email))
    if user is None:
        await verify_password_async(payload.password, DUMMY_PASSWORD_HASH)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not await verify_password_async(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user.last_login_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(user)

    set_session_cookie(response, create_jwt(user.id))
    return to_user_read(user)


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> UserRead:
    return to_user_read(current_user)


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> dict[str, bool]:
    if not await verify_password_async(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.password_hash = await hash_password_async(payload.new_password)
    await session.commit()
    return {"ok": True}


@router.post("/logout")
async def logout(response: Response, _: CurrentUser) -> dict[str, bool]:
    clear_session_cookie(response)
    return {"ok": True}
