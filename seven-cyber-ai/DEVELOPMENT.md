# Development

## Prerequisites

- Python ≥ 3.12 and [uv](https://docs.astral.sh/uv/) (containers use 3.12)
- Node 22 and pnpm 10
- PostgreSQL 16 and Redis 7 (native) — or Docker with Compose

## Local database

```bash
sudo -u postgres psql -c "CREATE ROLE seven LOGIN PASSWORD 'seven' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE seven OWNER seven;"
sudo -u postgres psql -c "CREATE DATABASE seven_test OWNER seven;"
```

## Commands

| Command | Does |
|---|---|
| `make install` | install all dependencies |
| `make check` | ruff, ruff format, mypy (strict), pytest, typecheck, eslint, `next build`, compose validation |
| `make test-backend` | pytest; integration tests run when `SEVEN_TEST_DATABASE_URL` is set (Makefile sets it) |
| `make e2e` | Playwright (desktop Chrome + Pixel 7). Start `make api` and the built web app first |
| `make migrate` | apply migrations |

Running Playwright with a preinstalled Chromium: `PW_CHROMIUM_PATH=/path/to/chromium make e2e`.

## Conventions

- Backend: typed everywhere (`mypy --strict`), ruff with bandit rules (`S`) enabled.
- New tables: add the model under `seven/database/models/`, export it in `__init__.py`,
  then `uv run alembic revision --autogenerate -m "..."`, review the file (Postgres enum
  types need an explicit drop in `downgrade`), and run `alembic check`.
- Frontend: Next.js 16 with Cache Components. Read `apps/web/node_modules/next/dist/docs/`
  before using an unfamiliar API — it differs from older Next.js versions (e.g. middleware is
  now `proxy`). `LayoutProps`/`PageProps` are generated: run `pnpm typecheck` (`next typegen`).
- UI pages that are not functional must render `PlannedPage` — never sample data.
- Never log secrets; never return driver error messages to clients.
