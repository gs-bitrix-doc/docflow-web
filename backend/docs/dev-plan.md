# DocFlow Web Backend — План разработки

Разработка ведётся итерационно: каждый этап даёт рабочий вертикальный срез. Следующий этап начинается только после того, как текущий работает end-to-end.

---

## Этап 1 — Модели и миграции

Создать SQLAlchemy-модели и Alembic-миграции для всех таблиц.

**Файлы:**
- `app/models/user.py` — `User`
- `app/models/project.py` — `Project`
- `app/models/task.py` — `Task`
- `app/models/publication.py` — `Publication`
- `app/models/dictionary_entry.py` — `DictionaryEntry`
- `app/models/notification_channel.py` — `NotificationChannel`
- `app/models/__init__.py` — реэкспорт всех моделей
- `migrations/versions/001_users.py`
- `migrations/versions/002_projects.py`
- `migrations/versions/003_tasks.py`
- `migrations/versions/004_publications.py`
- `migrations/versions/005_dictionary_entries.py`
- `migrations/versions/006_notification_channels.py`

**Детали:**
- Все `id` — UUID, `default=uuid.uuid4`
- `tasks.status` — CHECK constraint: `queued | running | done | failed | published`
- `projects.exclude_patterns` — `ARRAY(Text)`, default `[]`
- `dictionary_entries` — уникальный индекс `(dict_type, key)`
- Каждая модель импортируется в `app/db/base.py`, чтобы Alembic видел метаданные

**Проверка:** `alembic upgrade head` проходит без ошибок, `alembic check` показывает "No new upgrade operations detected".

---

## Этап 2 — Pydantic-схемы

Создать схемы запросов и ответов. Схемы — контракт API, их форма берётся из `docs/api.md`.

**Файлы:**
- `app/schemas/user.py` — `UserRegister`, `UserLogin`, `UserRead`, `ChangePasswordRequest`
- `app/schemas/project.py` — `ProjectCreate`, `ProjectRead`, `ProjectUpdate`
- `app/schemas/task.py` — `TaskSummary`, `TaskDetail`, `TaskUpdate`, `TaskListResponse`, `TaskCreateResponse`, `SkippedFile`, `RetryRequest`, `ManualTaskFromRepo`, `ConflictDetail`
- `app/schemas/publication.py` — `PublicationRead`, `HistoryResponse`
- `app/schemas/dictionary.py` — `DictionaryEntryRead`, `DictionaryEntryCreate`, `DictionaryEntryUpdate`, `DictionaryResponse`
- `app/schemas/notification.py` — `NotificationChannelCreate`, `NotificationChannelRead`, `NotificationChannelUpdate`
- `app/schemas/analytics.py` — `AnalyticsResponse`
- `app/schemas/__init__.py`

**Детали:**
- Все схемы используют `model_config = ConfigDict(from_attributes=True)` для совместимости с ORM
- UUID-поля — `uuid.UUID`, даты — `datetime`
- `TaskDetail` наследует `TaskSummary` и добавляет content-поля

---

## Этап 3 — Auth

Регистрация, вход, выход, смена пароля. Без GitHub OAuth на этом этапе.

**Файлы:**
- `app/services/auth.py` — `hash_password`, `verify_password`, `create_jwt`, `decode_jwt`, `get_current_user` (dependency)
- `app/api/routes/auth.py` — роутеры
- Подключить в `app/api/router.py`

**Эндпоинты:**
- `POST /auth/register`
- `POST /auth/login` — устанавливает `session` cookie (httponly, samesite=lax)
- `POST /auth/logout` — удаляет cookie
- `GET /auth/me`
- `POST /auth/change-password`

**Детали JWT:**
- Алгоритм HS256, payload: `{"sub": str(user.id), "exp": ...}`
- Срок жизни: 30 дней
- Cookie: `httponly=True`, `samesite="lax"`, `secure=False` в dev / `True` в prod

**Проверка:** регистрация → логин → `GET /auth/me` возвращает пользователя → логаут → `GET /auth/me` возвращает 401.

---

## Этап 4 — GitHub OAuth

Привязка GitHub-аккаунта к пользователю.

**Файлы:**
- Дополнить `app/services/auth.py` — `get_github_oauth_url`, `exchange_code_for_token`, `get_github_user`
- Дополнить `app/api/routes/auth.py`

**Эндпоинты:**
- `GET /auth/github/connect` — редирект на GitHub OAuth с `state` (CSRF)
- `GET /auth/github/callback` — обмен code → token, сохранение `github_id / login / access_token` в users
- `DELETE /auth/github/connect` — отвязка (обнуляет GitHub-поля)

**Детали:**
- `state` генерируется через `secrets.token_urlsafe(16)`, хранится в cookie на время OAuth-флоу
- При callback проверить `state` из cookie
- Если `github_id` уже привязан к другому пользователю — 409
- После callback редиректить на `http://localhost:3000/settings`

---

## Этап 5 — Projects (Репозитории)

CRUD для проектов.

**Файлы:**
- `app/api/routes/projects.py`
- Подключить в `app/api/router.py`

**Эндпоинты:**
- `GET /projects`
- `POST /projects` — генерирует `webhook_secret = secrets.token_hex(32)`
- `GET /projects/{id}`
- `PATCH /projects/{id}`
- `DELETE /projects/{id}`

**Детали:**
- Все операции только с проектами текущего пользователя (`project.user_id == current_user.id`)
- `webhook_url` формируется как `{settings.base_url}/webhook/{project.id}` (или захардкодить паттерн)
- `webhook_secret` возвращается только в `POST /projects` (при создании)
- Для `DELETE`: каскад не удаляет задачи (ON DELETE SET NULL или просто оставить project_id)

---

## Этап 6 — GitHub API клиент

Обёртка над GitHub REST API v3. Используется в webhook, manual tasks и publish.

**Файлы:**
- `app/services/github.py` — класс `GitHubClient`

**Методы:**
- `get_file_content(repo, path, ref) → (content: str, sha: str)` — скачать файл и его blob SHA
- `get_file_sha(repo, path, ref) → str | None` — только SHA (для проверки конфликтов)
- `get_repo_tree(repo, ref, path) → list[str]` — список `.md`-файлов (для file browser)
- `create_or_update_file(repo, path, message, content, sha | None, branch) → commit_sha` — публикация
- `get_user_repos() → list[str]` — список репозиториев для выбора при создании проекта

**Детали:**
- `httpx.AsyncClient` с `Authorization: token {access_token}` header
- `base_url = "https://api.github.com"`
- Обернуть HTTP ошибки в кастомный `GitHubAPIError(status_code, detail)`
- Контент файлов приходит base64-encoded — декодировать

---

## Этап 7 — Webhook

Приём push-события от GitHub, создание задач.

**Файлы:**
- `app/api/routes/webhook.py`
- Подключить в `app/api/router.py`

**Эндпоинт:** `POST /webhook/{project_id}`

**Детали:**
- Верификация HMAC: `hmac.compare_digest(expected, received)` по телу запроса и `project.webhook_secret`
- Фильтр: только `X-GitHub-Event: push` и только коммиты в `project.source_branch`
- Собрать все `.md` из `commits[*].added` + `commits[*].modified`, дедуплицировать
- Применить `exclude_patterns` (использовать `pathspec` или ручной fnmatch)
- Дедупликация: если файл уже в `queued` или `running` задаче — добавить в `skipped`
- Для каждого нового файла: скачать через `GitHubClient`, создать `Task(status="queued")`
- Запустить `pipeline_runner.run_task(task_id)` как FastAPI `BackgroundTask`
- Ответ 202 с `{created, task_ids, skipped}`

---

## Этап 8 — Pipeline Runner

Запуск пайплайна в фоне, запись лога, SSE.

**Файлы:**
- `app/services/pipeline_runner.py`
- `app/services/dictionary_merger.py`
- `app/api/routes/tasks.py` (SSE эндпоинт)

**Детали pipeline_runner:**
- Обновить `task.status = "running"`, `task.updated_at`
- Вызвать `dictionary_merger.merge()` — загрузить базовые словари из `pipeline/data/`, смёржить с `dictionary_entries` из БД
- Записать `task.original_content` во временный файл (`tempfile.NamedTemporaryFile`)
- Вызвать `pipeline.run(input_path, output_path, **merged_dicts)` — импорт из `pipeline/src/`
- Перехватить stdout/stderr → записывать построчно в очередь для SSE
- При успехе: прочитать output файл → `task.translated_content`, `task.status = "done"`, `task.log = лог`
- При исключении: `task.status = "failed"`, `task.error = traceback.format_exc()`
- Очистить временные файлы

**SSE (`GET /tasks/{id}/events`):**
- `StreamingResponse` с `media_type="text/event-stream"`
- Связь runner ↔ SSE через глобальный `dict[UUID, asyncio.Queue]` в `pipeline_runner.py`:
  - при старте runner создаёт `Queue` и кладёт в словарь по `task_id`
  - SSE-эндпоинт достаёт очередь из словаря и читает из неё
  - runner кладёт в очередь события `{"event": "log_line", "data": {...}}` построчно
  - по завершении кладёт `{"event": "status_change", "data": {"status": "done"}}` и `None` как sentinel
  - SSE читает до `None`, затем закрывает поток и удаляет очередь из словаря
- Формат каждого события: `event: log_line\ndata: {"line": "..."}\n\n`
- Если клиент подключился когда задача уже завершена (нет очереди) — сразу отправить `status_change` с текущим статусом

---

## Этап 9 — Tasks CRUD и ручной запуск

**Файлы:**
- Дополнить `app/api/routes/tasks.py`

**Эндпоинты:**
- `GET /tasks` — список с фильтрами `project_id`, `status`, пагинация
- `GET /tasks/{id}` — полные данные включая `original_content`, `translated_content`, `publications`
- `GET /tasks/{id}/log` — сырой лог (text/plain)
- `PATCH /tasks/{id}` — обновить `translated_content` (только `done` / `failed`)
- `POST /tasks/manual` — ручной запуск (вариант A: файл из репо, вариант B: upload)
  - `github_ref` для ручных задач: хранить строку `"manual"` (поле NOT NULL, реального ref нет)
  - `github_sha = null`, `source_file_sha = null` для загружаемых файлов
- `POST /tasks/{id}/retry` — повторный запуск; если SHA source изменился — 409, иначе сброс и старт

---

## Этап 10 — Публикация

**Файлы:**
- Дополнить `app/api/routes/tasks.py`

**Эндпоинт:** `POST /tasks/{id}/publish`

**Алгоритм:**
1. Проверить `task.status == "done"`
2. `current_sha = await github.get_file_sha(target_repo, task.file_path, target_branch)`
3. Если `current_sha != task.target_file_sha` (и не оба null) → 409 с `{base, ours, theirs}`
4. `commit_sha = await github.create_or_update_file(...)` передать `current_sha` для атомарности
5. Создать `Publication` в БД
6. `task.status = "published"`
7. Отправить уведомление через `bitrix_notify`

---

## Этап 11 — History и Analytics

**Файлы:**
- `app/api/routes/history.py` — `GET /history`
- `app/api/routes/analytics.py` — `GET /analytics`

**Модель доступа к History:**

Пользователь видит публикации по всем проектам, у которых совпадает `source_repo` с его собственными проектами. Это позволяет команде, работающей над одним репозиторием, видеть общую историю — без явного шаринга проектов и без дополнительных таблиц.

```
Видимые публикации = publications
  JOIN tasks ON tasks.id = publications.task_id
  JOIN projects ON projects.id = tasks.project_id
  WHERE projects.source_repo IN (
    SELECT source_repo FROM projects WHERE user_id = current_user.id
  )
```

Фильтр `project_id` в query params работает по той же логике — только если этот `project_id` относится к одному из видимых репозиториев.

**Детали:**
- History: JOIN `publications → tasks → projects`, фильтры по `project_id`, `published_by`, диапазону дат; сортировка по `published_at DESC`
- Analytics: агрегирующие SQL-запросы через SQLAlchemy — `count()`, `avg()`, `group by date`; видимость по той же логике `source_repo IN (...)`

---

## Этап 12 — Словари

**Файлы:**
- `app/api/routes/dictionaries.py`
- `app/services/dictionary_merger.py` (уже создан в этапе 8)

**Эндпоинты:**
- `GET /dictionaries/{dict_type}` — мёрж базовых файлов + БД записей
- `POST /dictionaries/{dict_type}`
- `PATCH /dictionaries/{dict_type}/{entry_id}`
- `DELETE /dictionaries/{dict_type}/{entry_id}` — soft delete (`is_deleted=True`) для базовых

**Поддерживаемые типы:** `dictionary`, `glossary`, `static_terms`, `section_headings`, `note_titles`, `include_labels`, `prompt`

---

## Этап 13 — Уведомления Bitrix24

**Файлы:**
- `app/services/bitrix_notify.py`
- `app/api/routes/notifications.py`

**Сервис `bitrix_notify.py`:**
- `async def notify(event: str, payload: dict)` — загружает активные каналы с нужным event, итерирует
- Для `incoming_webhook`: `POST {webhook_url}` с JSON телом
- Для `rest_api`: `POST {bitrix_url}/im.message.add` с токеном, `DIALOG_ID` из `destination_type + destination_id`

**Эндпоинты:**
- `GET /notifications/channels`
- `POST /notifications/channels`
- `PATCH /notifications/channels/{id}`
- `DELETE /notifications/channels/{id}`
- `POST /notifications/channels/{id}/test` — отправить тестовое сообщение

---

## Этап 14 — Финальная сборка

- Подключить все роутеры в `app/api/router.py` с правильными prefix и tags
- CORS: разрешить `http://localhost:3000` в dev
- Глобальный exception handler для `GitHubAPIError` → 502
- Проверить все 401/403/404 кейсы
- Пройтись по `docs/api.md` и убедиться, что все коды ответов совпадают
- Smoke-тест: запустить `docker compose up`, пройти полный флоу через Swagger UI

---

## Порядок этапов

```
1 Модели + миграции
2 Схемы
3 Auth (email/password)
4 GitHub OAuth
5 Projects CRUD
6 GitHub API клиент
7 Webhook
8 Pipeline Runner + SSE
9 Tasks CRUD + ручной запуск
10 Публикация
11 History + Analytics
12 Словари
13 Уведомления Bitrix24
14 Финальная сборка
```

Этапы 1–5 не зависят от внешних сервисов и могут быть проверены локально без реального GitHub и пайплайна.
Этапы 6–10 требуют настроенного GitHub OAuth App и подключённого pipeline submodule.