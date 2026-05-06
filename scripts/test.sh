#!/usr/bin/env sh
# Запускает тесты backend: поднимает db_test, ждёт Postgres, запускает pytest.
# Использование: ./scripts/test.sh [pytest-args]
# Примеры:
#   ./scripts/test.sh
#   ./scripts/test.sh tests/test_auth.py -v
#   ./scripts/test.sh -x -k "test_login"
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Определяем Python из venv (Windows: Scripts/, Unix: bin/)
if [ -f "$REPO_ROOT/backend/.venv/Scripts/python" ]; then
    PYTHON="$REPO_ROOT/backend/.venv/Scripts/python"
elif [ -f "$REPO_ROOT/backend/.venv/bin/python" ]; then
    PYTHON="$REPO_ROOT/backend/.venv/bin/python"
else
    echo "ERROR: backend/.venv не найден."
    echo "  cd backend && python -m venv .venv && pip install -e '.[dev]'"
    exit 1
fi

COMPOSE="docker compose -f $REPO_ROOT/docker-compose.yml -f $REPO_ROOT/docker-compose.dev.yml"

# Поднимаем db_test (idempotent — не трогает уже запущенный контейнер)
echo "==> Запуск db_test..."
$COMPOSE up db_test -d

# Ждём готовности Postgres (таймаут 30 секунд)
echo -n "==> Ожидание Postgres"
i=0
until $COMPOSE exec -T db_test pg_isready -U docflow -q 2>/dev/null; do
    i=$((i + 1))
    if [ $i -ge 30 ]; then
        echo ""
        echo "ERROR: Postgres не поднялся за 30 секунд."
        echo "  Проверьте логи: $COMPOSE logs db_test"
        exit 1
    fi
    printf '.'
    sleep 1
done
echo " готов."

# Запускаем pytest из backend/ (чтобы pyproject.toml был в cwd)
echo "==> pytest $*"
cd "$REPO_ROOT/backend"
DATABASE_TEST_URL="postgresql+asyncpg://docflow:docflow_secret@localhost:5433/docflow_test" \
    "$PYTHON" -m pytest "$@"