# syntax=docker/dockerfile:1
# NIKITA API (control plane). Runs as an unprivileged user; parses no uploaded files.
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv
WORKDIR /app

FROM base AS deps
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

FROM base AS runtime
RUN groupadd --system nikita && useradd --system --gid nikita --home /app nikita
COPY --from=deps /app/.venv /app/.venv
COPY backend/ ./
RUN uv sync --frozen --no-dev && chown -R nikita:nikita /app
USER nikita
ENV PATH="/app/.venv/bin:$PATH" NIKITA_LOG_JSON=true
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/live', timeout=2).status == 200 else 1)"]
CMD ["uvicorn", "nikita.api.main:app_factory", "--factory", "--host", "0.0.0.0", "--port", "8000"]
