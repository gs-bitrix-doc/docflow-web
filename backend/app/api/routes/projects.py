from __future__ import annotations

import logging
import secrets
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.project import Project
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectCreateResponse,
    ProjectFilesResponse,
    ProjectRead,
    ProjectUpdate,
    ProjectWebhookSecretResponse,
)
from app.services.auth import (
    decrypt_github_access_token,
    encrypt_webhook_secret,
    get_current_user,
)
from app.services.github import GitHubClient
from app.services.projects import ensure_github_linked, get_project_or_404

router = APIRouter(prefix="/projects", tags=["projects"])
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]
logger = logging.getLogger(__name__)


def _validate_tree_path(path: str) -> str:
    normalized = path.strip("/")
    if not normalized:
        return ""
    if "\\" in normalized or normalized.startswith("/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="path must be a forward-slash relative path",
        )
    if any(part in {"", ".", ".."} for part in normalized.split("/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="path must not contain '.' or '..' segments",
        )
    return normalized


@router.get(
    "",
    response_model=list[ProjectRead],
    summary="Список проектов",
    description="Возвращает все проекты текущего пользователя, отсортированные по дате создания (новые первые). `webhook_secret` в ответе отсутствует.",
)
async def get_projects(session: DbSession, current_user: CurrentUser) -> list[Project]:
    result = await session.scalars(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
    )
    return list(result.all())


@router.post(
    "",
    response_model=ProjectCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать проект",
    description=(
        "Создаёт пару source/target репозиториев и генерирует `webhook_secret`. "
        "`webhook_secret` возвращается **только здесь** — сохраните его для настройки GitHub Webhook. "
        "`source_repo` и `target_repo` должны быть в формате `owner/repo`. "
        "Требует привязанный GitHub-аккаунт."
    ),
    responses={
        201: {"description": "Проект создан, `webhook_secret` в ответе"},
        400: {"description": "GitHub-аккаунт не привязан или невалидный формат репо"},
        422: {"description": "Ошибка валидации полей"},
    },
)
async def create_project(
    payload: ProjectCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> ProjectCreateResponse:
    ensure_github_linked(current_user)

    plaintext_secret = secrets.token_hex(32)
    project = Project(
        user_id=current_user.id,
        name=payload.name,
        source_repo=payload.source_repo,
        source_branch=payload.source_branch,
        target_repo=payload.target_repo,
        target_branch=payload.target_branch,
        webhook_secret=encrypt_webhook_secret(plaintext_secret),
        exclude_patterns=payload.exclude_patterns,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)

    response = ProjectCreateResponse.model_validate(project)
    response.webhook_secret = plaintext_secret
    logger.info("project_created", extra={"project_id": str(project.id)})
    return response


@router.get(
    "/{project_id}/files",
    response_model=ProjectFilesResponse,
    summary="List project source files",
    description="Возвращает markdown-файлы из source-репозитория проекта под указанным путём.",
    responses={
        200: {"description": "Список markdown-файлов"},
        400: {"description": "GitHub не привязан или path невалиден"},
        404: {"description": "Проект не найден"},
    },
)
async def get_project_files(
    project_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
    path: str = Query(default=""),
) -> ProjectFilesResponse:
    project = await get_project_or_404(session, project_id, current_user)
    ensure_github_linked(current_user)
    normalized_path = _validate_tree_path(path)
    github_client = GitHubClient(decrypt_github_access_token(current_user.github_access_token))
    items = await github_client.get_repo_tree(
        project.source_repo,
        project.source_branch,
        normalized_path,
    )
    return ProjectFilesResponse(items=items)


@router.get(
    "/{project_id}",
    response_model=ProjectRead,
    summary="Детали проекта",
    responses={
        200: {"description": "Проект найден"},
        404: {"description": "Проект не найден или не принадлежит текущему пользователю"},
    },
)
async def get_project(project_id: UUID, session: DbSession, current_user: CurrentUser) -> Project:
    return await get_project_or_404(session, project_id, current_user)


@router.patch(
    "/{project_id}",
    response_model=ProjectRead,
    summary="Обновить проект",
    description="Частичное обновление: передавайте только изменяемые поля. `source_repo` и `target_repo` изменить нельзя.",
    responses={
        200: {"description": "Проект обновлён"},
        404: {"description": "Проект не найден или не принадлежит текущему пользователю"},
    },
)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> Project:
    project = await get_project_or_404(session, project_id, current_user)
    expected_version = project.version
    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        return project

    result = await session.execute(
        update(Project)
        .where(Project.id == project.id, Project.version == expected_version)
        .values(**changes, version=expected_version + 1)
    )
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project was modified concurrently; refresh and retry",
        )
    await session.commit()
    await session.refresh(project)
    return project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить проект",
    description="Удаляет проект. Связанные задачи сохраняются (`project_id` → `null`).",
    responses={
        204: {"description": "Проект удалён"},
        404: {"description": "Проект не найден или не принадлежит текущему пользователю"},
    },
)
async def delete_project(
    project_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> Response:
    project = await get_project_or_404(session, project_id, current_user)
    await session.delete(project)
    await session.commit()
    logger.info("project_deleted", extra={"project_id": str(project_id)})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{project_id}/regenerate-webhook-secret",
    response_model=ProjectWebhookSecretResponse,
    summary="Regenerate project webhook secret",
    description=(
        "Генерирует новый `webhook_secret` для проекта и возвращает plaintext "
        "только в ответе этого endpoint."
    ),
    responses={
        200: {"description": "Новый webhook secret сгенерирован"},
        404: {"description": "Project not found"},
    },
)
async def regenerate_webhook_secret(
    project_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> ProjectWebhookSecretResponse:
    project = await get_project_or_404(session, project_id, current_user)

    plaintext_secret = secrets.token_hex(32)
    project.webhook_secret = encrypt_webhook_secret(plaintext_secret)
    await session.commit()

    logger.info("project_webhook_secret_regenerated", extra={"project_id": str(project_id)})
    return ProjectWebhookSecretResponse(webhook_secret=plaintext_secret)
