from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


@lru_cache
def get_engine():
    settings = get_settings()
    return create_async_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)


@lru_cache
def get_session_factory():
    return async_sessionmaker(
        bind=get_engine(),
        class_=AsyncSession,
        autoflush=False,
        expire_on_commit=False,
    )


async def get_db_session() -> AsyncIterator[AsyncSession]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session
