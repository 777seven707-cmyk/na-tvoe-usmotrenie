# SEVEN CYBER AI

A personal, AI-assisted security research and application analysis workstation.
Claude plans and interprets; a Python backend enforces scope, approvals and isolation;
a Next.js dashboard is the control centre.

> **Status: Phase 1 (Foundation) complete.** The stack runs end-to-end (dashboard → API →
> PostgreSQL/Redis) but **no analysis engine exists yet**. Every page that is not functional
> says so. See [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

Use only against systems you own or are explicitly authorized to test. See [`SECURITY.md`](SECURITY.md).

## Quick start (Docker)

```bash
cp .env.example .env          # set POSTGRES_PASSWORD and SEVEN_SECRET_KEY
docker compose up --build -d
open http://localhost:3000
```

## Quick start (native)

Requires Python ≥ 3.12 with [uv](https://docs.astral.sh/uv/), Node 22 with pnpm, PostgreSQL 16, Redis 7.

```bash
make install
make migrate      # uses SEVEN_DATABASE_URL
make api          # http://localhost:8000/api/v1/docs
make web          # http://localhost:3000
```

## Repository layout

| Path | Contents |
|---|---|
| `apps/web/` | Next.js 16 dashboard (TypeScript, Tailwind 4) |
| `backend/src/seven/` | FastAPI app, core (policy, approvals, orchestrator…), engines, workers |
| `backend/migrations/` | Alembic migrations |
| `backend/tests/` | unit, integration, security tests |
| `e2e/` | Playwright tests |
| `docker/` | Dockerfiles |
| `docs/` | architecture proposal and design records |

## Documentation

[`ARCHITECTURE.md`](ARCHITECTURE.md) · [`DEVELOPMENT.md`](DEVELOPMENT.md) ·
[`SECURITY.md`](SECURITY.md) · [`ROADMAP.md`](ROADMAP.md) ·
[`PROJECT_STATUS.md`](PROJECT_STATUS.md) · [`CHANGELOG.md`](CHANGELOG.md) ·
[`docs/ARCHITECTURE_PROPOSAL.md`](docs/ARCHITECTURE_PROPOSAL.md)
