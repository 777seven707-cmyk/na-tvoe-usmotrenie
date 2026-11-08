# Project status

**Current phase:** 1 — Foundation · **complete** (2026-11-08)
**Next phase:** 2 — Dashboard (design system, auth, projects CRUD, settings, workspace layout)

## Phase 1 — delivered

| Item | State |
|---|---|
| Repository skeleton (`apps/web`, `backend/src/nikita/…`, `docker/`, `e2e/`, `docs/`) | ✅ |
| FastAPI app factory, `/api/v1/health/live`, `/api/v1/health/ready` | ✅ |
| Settings (`NIKITA_*`, secrets as `SecretStr`, production guard) | ✅ |
| Structured logging with secret redaction, request IDs, security headers | ✅ |
| SQLAlchemy async + Alembic; `users`, `projects`; migration round-trip | ✅ |
| Next.js 16 shell: sidebar, mobile drawer, 14 routes, live health card | ✅ |
| Dockerfiles (api, web) and `docker-compose.yml` | ✅ written and `compose config` validated — **not built/run** (see below) |

## Verification (actually executed, 2026-11-08)

| Check | Result |
|---|---|
| `ruff check` / `ruff format --check` | pass |
| `mypy --strict` (43 files) | pass |
| `pytest` — 17 tests incl. integration against real PostgreSQL 16 + Redis 7 | 17 passed |
| `alembic upgrade → downgrade → upgrade`, `alembic check` | pass, no drift |
| `tsc --noEmit` (after `next typegen`), `eslint` | pass |
| `next build` | pass, 15 routes prerendered |
| Playwright against running API + web (Chromium desktop + Pixel 7) | 10 passed, 2 skipped (device-specific by design) |
| `docker compose config` | valid; refuses to start without `POSTGRES_PASSWORD` / `NIKITA_SECRET_KEY` |

## Known gaps / not verified
- **Docker images were not built and the compose stack was not run**: the development cloud
  session has no Docker daemon. Run `docker compose up --build` locally to verify.
- No authentication yet — do not expose the stack beyond localhost (compose binds 127.0.0.1).
- Global STOP button is rendered **disabled**; it becomes functional with the execution engine (Phase 3).
- Only `users` and `projects` tables exist; the remaining tables arrive with their phases.
- All pages except the dashboard are labelled "Not implemented yet".
