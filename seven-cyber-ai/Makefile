.PHONY: help install check test test-backend lint-backend check-web e2e migrate api web compose-config up down

TEST_DB ?= postgresql+asyncpg://seven:seven@localhost:5432/seven_test

help:
	@echo "install        install backend (uv) and web/e2e (pnpm) dependencies"
	@echo "check          all static checks + unit/integration tests"
	@echo "test-backend   pytest (integration tests need SEVEN_TEST_DATABASE_URL / TEST_DB)"
	@echo "check-web      typecheck + lint + production build of the dashboard"
	@echo "e2e            Playwright suite (API on :8000 and web on :3000 must be running)"
	@echo "migrate        alembic upgrade head"
	@echo "api / web      run the API (:8000) / dashboard (:3000) for local development"
	@echo "up / down      docker compose stack"

install:
	cd backend && uv sync
	cd apps/web && pnpm install
	cd e2e && pnpm install

lint-backend:
	cd backend && uv run ruff check src tests migrations
	cd backend && uv run ruff format --check src tests migrations
	cd backend && uv run mypy

test-backend:
	cd backend && SEVEN_TEST_DATABASE_URL=$(TEST_DB) uv run pytest -q

check-web:
	cd apps/web && pnpm typecheck && pnpm lint && pnpm build

compose-config:
	docker compose --env-file .env.example config -q

check: lint-backend test-backend check-web compose-config

e2e:
	cd e2e && pnpm test

migrate:
	cd backend && uv run alembic upgrade head

api:
	cd backend && uv run uvicorn seven.api.main:app_factory --factory --reload --port 8000

web:
	cd apps/web && pnpm dev

up:
	docker compose up --build -d

down:
	docker compose down
