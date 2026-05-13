from __future__ import annotations

import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.task import Task
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
PIPELINE_DIR = Path(__file__).resolve().parents[4] / "pipeline"


@lru_cache(maxsize=1)
def get_pipeline_version() -> str:
    try:
        result = subprocess.run(
            ["git", "-C", str(PIPELINE_DIR), "rev-parse", "--short", "HEAD"],
            capture_output=True,
            check=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return "unknown"

    return result.stdout.strip() or "unknown"


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Проверка работоспособности",
    description="Проверяет доступность сервиса, БД и возвращает метаданные пайплайна.",
)
async def health_check(session: DbSession) -> HealthResponse:
    await session.execute(text("SELECT 1"))
    last_webhook_at = await session.scalar(
        select(func.max(Task.created_at)).where(Task.github_sha.is_not(None))
    )
    return HealthResponse(
        status="ok",
        pipeline_version=get_pipeline_version(),
        last_webhook_at=last_webhook_at,
    )
