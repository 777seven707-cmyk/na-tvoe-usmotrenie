# Changelog

## [0.1.0] — 2026-11-08 — Phase 1: Foundation

### Added
- Architecture proposal (`docs/ARCHITECTURE_PROPOSAL.md`).
- Backend package `nikita`: settings (`NIKITA_*`), structured logging with secret redaction,
  request-ID and security-header middleware, `/api/v1/health/live` and `/api/v1/health/ready`.
- Async SQLAlchemy models `users`, `projects`; Alembic migration `0001`.
- Next.js 16 dashboard: dark theme tokens, responsive app shell with sidebar and mobile
  drawer, 14 routes, live system-health card, same-origin `/api` rewrite.
- Dockerfiles (api, web), `docker-compose.yml` with internal backend network and hardening.
- Tests: 17 pytest (unit, security, integration with real PostgreSQL + Redis),
  12 Playwright cases (desktop + mobile; 10 run, 2 device-specific skips).
