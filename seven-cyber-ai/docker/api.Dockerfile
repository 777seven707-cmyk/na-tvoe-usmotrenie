# syntax=docker/dockerfile:1
# SEVEN API (control plane). Runs as an unprivileged user; parses no uploaded files.
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv
WORKDIR /app

FROM base AS deps
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

FROM base AS runtime
RUN groupadd --system seven && useradd --system --gid seven --home /app seven
COPY --from=deps /app/.venv /app/.venv
COPY backend/ ./
RUN uv sync --frozen --no-dev && chown -R seven:seven /app
USER seven
ENV PATH="/app/.venv/bin:$PATH" SEVEN_LOG_JSON=true
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/live', timeout=2).status == 200 else 1)"]
CMD ["uvicorn", "seven.api.main:app_factory", "--factory", "--host", "0.0.0.0", "--port", "8000"]
