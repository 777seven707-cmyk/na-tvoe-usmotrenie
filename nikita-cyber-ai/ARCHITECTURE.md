# Architecture

The full design (data model, API surface, threat model, risk classes, autonomy modes) is in
[`docs/ARCHITECTURE_PROPOSAL.md`](docs/ARCHITECTURE_PROPOSAL.md), approved on 2026-11-08.
This file tracks what is **actually built** and the interfaces between modules.

## Principles enforced in code

1. **The model proposes, the backend decides.** Claude emits typed tool calls only. Scope,
   permissions, mode and approvals are changed exclusively by authenticated human requests.
2. **Approvals are hash-bound** to `(tool_id, canonical args, scope version)`.
3. **Control plane never parses untrusted files.** Parsing happens in isolated workers.
4. **No shell.** Tools are Python functions; external binaries run from fixed argv templates.
5. **Findings carry a verification status.** Model output starts as `hypothesis`.

## Built so far (Phase 1)

```
browser ── same origin ──► Next.js (apps/web)
                              │ rewrite /api/* (server side, NIKITA_API_ORIGIN)
                              ▼
                           FastAPI (nikita.api)
                              ├── /api/v1/health/live    process liveness
                              └── /api/v1/health/ready   PostgreSQL + Redis checks
                              │
                 PostgreSQL 16 (users, projects)    Redis 7
```

| Module | Path | State |
|---|---|---|
| Settings | `nikita.core.config` | `NIKITA_*` env, `SecretStr` secrets, production guard |
| Logging | `nikita.core.audit.logging` | structlog, mandatory secret redaction |
| HTTP middleware | `nikita.api.middleware` | request IDs (validated), security headers |
| Health | `nikita.api.health`, `routers/health.py` | pluggable checks with timeouts, error class only |
| Database | `nikita.database` | async SQLAlchemy 2, naming convention, `users`, `projects` |
| Migrations | `backend/migrations` | Alembic (async), round-trip tested |
| Dashboard | `apps/web` | app shell, sidebar, 14 routes, live health card |

Empty packages under `core/`, `engines/`, `integrations/`, `workers/`, `storage/`, `reports/`
are placeholders for later phases and contain no logic.

## Network layout (compose)

- `backend` network is `internal: true`: PostgreSQL and Redis have no outside route.
- `api` joins `backend` and `frontend`; `web` joins `frontend` only and is the single
  published port (bound to `127.0.0.1`).
- Analysis workers and the egress proxy are introduced in Phase 3.
