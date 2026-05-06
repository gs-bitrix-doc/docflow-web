# Build context: repo root (не backend/) — нужен доступ к pipeline/ submodule.
# Требует: git submodule update --init перед docker compose build.
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/pipeline

COPY pipeline/ ./pipeline/

COPY backend/pyproject.toml ./backend/
COPY backend/app/ ./backend/app/
RUN pip install --no-cache-dir -e ./backend/

COPY backend/migrations/ ./backend/migrations/
COPY backend/alembic.ini ./backend/

WORKDIR /app/backend

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]