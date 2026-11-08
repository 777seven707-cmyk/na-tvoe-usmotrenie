# Roadmap

| Phase | Scope | State |
|---|---|---|
| 1 Foundation | repo skeleton, FastAPI + health, settings, logging, Alembic, Next.js shell + navigation, Docker, tests | ✅ done |
| 2 Dashboard | design system, auth (sessions, CSRF), projects CRUD, settings, workspace layout, dashboard data | next |
| 3 Core security | scope manager + SSRF guard, permissions, tool registry, approval engine, execution engine + Celery + sandbox, audit log, STOP, uploads | planned |
| 4 Claude integration | Anthropic client, tool schemas, planner, orchestration loop, context management, interpretation, live workspace | planned |
| 5 Analysis engines | web, API, Android, Windows, network, code; architecture graph | planned |
| 6 Security auditing | semgrep/bandit, OSV/pip-audit, secrets (masked), config checks, OWASP mapping, training lab | planned |
| 7 Reporting | findings workflow, evidence, CVSS, Markdown/HTML/JSON reports | planned |
| 8 Finalization | coverage, security & UI tests, performance, install guide | planned |

Deferred until suitable hardware: dynamic analysis (Android emulator needs KVM; Windows needs a VM).
