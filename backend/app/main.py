from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler
from sqlalchemy import update
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.router import api_router
from app.api.routes.auth import limiter
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.request_context import set_request_id, set_user_id
from app.db.session import get_session_factory
from app.models.task import Task
from app.services.github import GitHubAPIError

logger = logging.getLogger(__name__)


def _warn_missing_pipeline_settings() -> None:
    settings = get_settings()
    missing = [
        name
        for name, value in (
            ("API_KEY", settings.api_key),
            ("BASE_URL", settings.base_url),
            ("MODEL", settings.model),
        )
        if not value
    ]
    if missing:
        logger.warning(
            "Pipeline configuration missing: %s вЂ” translation tasks will fail until set",
            ", ".join(missing),
        )


class _SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> JSONResponse:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response


class _LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> JSONResponse:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        set_request_id(request_id)
        set_user_id(None)

        access_logger = logging.getLogger("app.access")
        start = time.monotonic()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = int((time.monotonic() - start) * 1000)
            access_logger.exception(
                "request_failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            raise

        duration_ms = int((time.monotonic() - start) * 1000)
        log_method = access_logger.warning if response.status_code >= 500 else access_logger.info
        log_method(
            "request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response


@asynccontextmanager
async def _lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(level="DEBUG" if settings.debug else "INFO")
    _warn_missing_pipeline_settings()
    session_factory = get_session_factory()
    async with session_factory() as session:
        result = await session.execute(
            update(Task).where(Task.status == "running").values(
                status="queued",
                current_stage=None,
                error="РџСЂРµСЂРІР°РЅРѕ РїРµСЂРµР·Р°РїСѓСЃРєРѕРј СЃРµСЂРІРµСЂР°",
            )
        )
        await session.commit()
    if result.rowcount:
        logger.info("startup_reset_running_tasks", extra={"count": result.rowcount})
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        version="0.1.0",
        lifespan=_lifespan,
        description=(
            "API СЃРµСЂРІРёСЃР° DocFlow вЂ” Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ РїРµСЂРµРІРѕРґ `.md` РґРѕРєСѓРјРµРЅС‚Р°С†РёРё RUв†’EN "
            "С‡РµСЂРµР· Bitrix GPT СЃ РїСѓР±Р»РёРєР°С†РёРµР№ РІ GitHub."
        ),
        openapi_tags=[
            {
                "name": "health",
                "description": "РџСЂРѕРІРµСЂРєР° СЂР°Р±РѕС‚РѕСЃРїРѕСЃРѕР±РЅРѕСЃС‚Рё СЃРµСЂРІРёСЃР° Рё РїРѕРґРєР»СЋС‡РµРЅРёСЏ Рє Р‘Р”.",
            },
            {
                "name": "auth",
                "description": (
                    "Р РµРіРёСЃС‚СЂР°С†РёСЏ, РІС…РѕРґ РїРѕ email/РїР°СЂРѕР»СЋ, РІС‹С…РѕРґ, СЃРјРµРЅР° РїР°СЂРѕР»СЏ. "
                    "GitHub OAuth РґР»СЏ РїСЂРёРІСЏР·РєРё Р°РєРєР°СѓРЅС‚Р° вЂ” РѕС‚РґРµР»СЊРЅРѕ РѕС‚ РѕСЃРЅРѕРІРЅРѕРіРѕ РІС…РѕРґР°."
                ),
            },
            {
                "name": "projects",
                "description": (
                    "РЈРїСЂР°РІР»РµРЅРёРµ РїСЂРѕРµРєС‚Р°РјРё (РїР°СЂС‹ source/target СЂРµРїРѕР·РёС‚РѕСЂРёРµРІ). "
                    "РўСЂРµР±СѓРµС‚ РїСЂРёРІСЏР·Р°РЅРЅС‹Р№ GitHub-Р°РєРєР°СѓРЅС‚. "
                    "`webhook_secret` РІРѕР·РІСЂР°С‰Р°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РїСЂРё СЃРѕР·РґР°РЅРёРё."
                ),
            },
            {
                "name": "tasks",
                "description": (
                    "Р—Р°РґР°С‡Рё РїРµСЂРµРІРѕРґР°: СЃРїРёСЃРѕРє, РґРµС‚Р°Р»Рё, СЂСѓС‡РЅРѕР№ Р·Р°РїСѓСЃРє, retry, РїСѓР±Р»РёРєР°С†РёСЏ РІ GitHub. "
                    "SSE-СЃС‚СЂРёРј РїСЂРѕРіСЂРµСЃСЃР° РґРѕСЃС‚СѓРїРµРЅ РїРѕ `GET /tasks/{id}/events`."
                ),
            },
            {
                "name": "webhook",
                "description": (
                    "РџСЂРёС‘Рј `push`-СЃРѕР±С‹С‚РёР№ РѕС‚ GitHub. "
                    "РќРµ С‚СЂРµР±СѓРµС‚ Р°РІС‚РѕСЂРёР·Р°С†РёРё вЂ” Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ С‡РµСЂРµР· HMAC-РїРѕРґРїРёСЃСЊ (`X-Hub-Signature-256`)."
                ),
            },
            {
                "name": "history",
                "description": (
                    "РСЃС‚РѕСЂРёСЏ РїСѓР±Р»РёРєР°С†РёР№. Р’РёРґРЅС‹ РїСѓР±Р»РёРєР°С†РёРё РІСЃРµС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, "
                    "СЂР°Р±РѕС‚Р°СЋС‰РёС… СЃ С‚РµРј Р¶Рµ `source_repo`."
                ),
            },
            {
                "name": "analytics",
                "description": (
                    "РђРіСЂРµРіРёСЂРѕРІР°РЅРЅР°СЏ СЃС‚Р°С‚РёСЃС‚РёРєР°: СѓСЃРїРµС€РЅРѕСЃС‚СЊ РїРµСЂРµРІРѕРґРѕРІ, СЃСЂРµРґРЅРµРµ РІСЂРµРјСЏ, "
                    "РґРёРЅР°РјРёРєР° РїРѕ РґРЅСЏРј, С‚РѕРї РѕС€РёР±РѕРє."
                ),
            },
            {
                "name": "dictionaries",
                "description": (
                    "РЎР»РѕРІР°СЂРё РїР°Р№РїР»Р°Р№РЅР°. Р’ MVP РґРѕСЃС‚СѓРїРµРЅ read-only РїСЂРѕСЃРјРѕС‚СЂ merged-РґР°РЅРЅС‹С…; "
                    "СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РѕС‚Р»РѕР¶РµРЅРѕ РґРѕ post-MVP per-user РјРѕРґРµР»Рё."
                ),
            },
            {
                "name": "notifications",
                "description": (
                    "РЈРІРµРґРѕРјР»РµРЅРёСЏ Bitrix24. Р’ MVP РґРѕСЃС‚СѓРїРµРЅ С‚РѕР»СЊРєРѕ РїСѓСЃС‚РѕР№ read-only СЃРїРёСЃРѕРє РєР°РЅР°Р»РѕРІ; "
                    "СЂРµР°Р»СЊРЅР°СЏ РґРѕСЃС‚Р°РІРєР° Рё СѓРїСЂР°РІР»РµРЅРёРµ РєР°РЅР°Р»Р°РјРё РѕС‚Р»РѕР¶РµРЅС‹ РґРѕ post-MVP."
                ),
            },
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_base_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(_SecurityHeadersMiddleware)
    app.add_middleware(_LoggingMiddleware)

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.exception_handler(GitHubAPIError)
    async def _github_api_error_handler(request: Request, exc: GitHubAPIError) -> JSONResponse:
        logger.warning(
            "github_api_error",
            extra={
                "path": request.url.path,
                "status": exc.status_code,
                "detail": exc.detail,
            },
        )
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    app.include_router(api_router)
    return app


app = create_app()
