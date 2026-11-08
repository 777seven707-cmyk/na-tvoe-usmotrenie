# NIKITA CYBER AI — Architecture Proposal (pre-Phase 1)

Status: **PROPOSAL — awaiting owner approval. No application code has been written.**
Date: 2026-11-08

---

## 0. Environment inspection

| Item | Finding | Consequence |
|---|---|---|
| Repository | `na-tvoe-usmotrenie` currently holds an unrelated static website (studio landing page: `index.html`, `assets/`, Russian `README.md`). | The platform must not touch those files. Proposed home: `nikita-cyber-ai/` sub-directory (or a separate repo — owner decision, see §9). |
| Python | 3.13.18 (system), pip 24 | Containers will pin **Python 3.12** (best wheel coverage for `lief`, `androguard`, `scapy`). |
| Node | 22.x, npm 10, pnpm 10 | pnpm for the web app. |
| PostgreSQL | 16 installed, cluster stopped | Usable natively for tests in this cloud session. |
| Redis | 7.0 installed | Usable natively for tests. |
| Docker | CLI 29 + Compose v5 present, **daemon not running** in this session | `docker-compose.yml` and Dockerfiles will be written and linted, but full-stack container runs cannot be verified here; tests run against native Postgres/Redis. This will be stated in `PROJECT_STATUS.md`, not glossed over. |
| Java | present | Enables optional `jadx` (APK decompilation) later. |
| Analysis binaries | `tshark`, `semgrep`, `bandit`, `apktool`, `jadx` **absent** | Installed inside worker images only, never on the host. Pure-Python engines preferred where they are adequate. |
| Resources | 4 vCPU, 15 GiB RAM, ~30 GB free | Sufficient for dev; Android emulator not feasible (no KVM). |

---

## 1. Architecture assessment

### 1.1 Shape of the system

```
 Browser ──HTTPS──► Next.js (apps/web)  ──same-origin /api rewrite──► FastAPI (api)
                         ▲  WebSocket (job events)                         │
                         └──────────────────────────────────────────────── │
                                                                           ▼
     ┌───────────────────────── Control plane (trusted) ──────────────────────────┐
     │  Auth · Projects · Scope Manager · Policy Engine · Approval Engine          │
     │  Tool Registry · Orchestrator (Claude loop) · Audit · Reporting            │
     └──────────────┬───────────────────────────────┬─────────────────────────────┘
                    │ Postgres (state)              │ Redis (queue, pub/sub, STOP flag, rate limits)
                    ▼                               ▼
     ┌────────────── Data plane (untrusted workloads, isolated containers) ───────┐
     │  worker-static   : no network, read-only artifacts, non-root, cap_drop ALL │
     │  worker-net      : egress ONLY via scope-enforcing egress proxy            │
     │  worker-dynamic  : (future) Android emulator / Windows VM sandbox          │
     └────────────────────────────────────────────────────────────────────────────┘
```

Key decision: **control plane and data plane are separate processes/containers.** The API never parses an uploaded binary itself; it only hashes and stores it. Every parser (PE, APK, PCAP, source code) runs in a worker, because parsers of hostile files are the most likely component to be exploited.

### 1.2 The orchestration loop (the core idea)

Claude never "runs" anything. It only proposes structured tool calls. The backend is the sole authority.

```
user goal ─► Planner (Claude) ─► ResearchPlan {steps[]: tool_id + typed args + rationale}
          ─► Policy Engine evaluates EVERY step  → allow | needs_approval | deny (+reason)
          ─► UI shows plan, per-step policy verdict, risk class   ◄── user approves / edits / rejects
          ─► Execution Engine: re-validates args, re-checks policy + STOP flag at dispatch time,
             enqueues Celery task on the queue matching the tool's isolation tier
          ─► Worker runs a *predefined* implementation (fixed argv, no shell, timeouts, rlimits)
          ─► Output validated against the tool's output schema → stored as AnalysisArtifact
          ─► Result returned to Claude wrapped as UNTRUSTED DATA → interpretation,
             candidate findings (status = hypothesis until evidence-backed), next steps
          ─► Loop until plan complete / budget exhausted / STOP / user ends
```

Two invariants enforced in code, not in prompts:
1. **Claude's output can never change scope, permissions, mode, or approvals.** Those mutate only through authenticated human API calls (CSRF-protected). There is no tool exposed to Claude that touches them.
2. **Approval is bound to a hash of `(tool_id, canonical args, scope version)`.** If Claude (or anything) changes an argument after approval, the approval no longer matches and execution is refused.

### 1.3 Autonomy modes and risk classes

Risk class is a property of each registered tool; mode is a ceiling per research job.

| Risk class | Meaning | Examples |
|---|---|---|
| R0 `local_read` | Read/parse user-supplied material, no network | hash, PE headers, manifest parse, pcap stats, semgrep on uploaded repo |
| R1 `passive_net` | Small number of benign requests to in-scope targets | single GET/HEAD, TLS handshake, fetch `/robots.txt`, fetch OpenAPI doc URL |
| R2 `active_net` | Many requests / crawling / spec-driven API calls to in-scope targets | bounded same-origin crawl, call documented endpoints in a test env, header checks across pages |
| R3 `execution` | Executes code or the target in a sandbox | dynamic APK run, running a project's test suite (future) |
| R4 `intrusive` | Potentially disruptive | **not implemented**; class exists so the policy can reject it explicitly |

| Mode | Max class | Approval |
|---|---|---|
| OBSERVE | R0 (metadata only) + R1 | R1 always requires approval |
| ANALYZE | R0 (full static analysis) | none for R0 within project files |
| AUDIT | R2 | every R1/R2 step requires approval (batch approval of a plan allowed, still per-step hash-bound) |
| RESEARCH | R3 | as AUDIT, plus R3 always individually approved |

Global **STOP**: a Redis key + DB flag checked by the orchestrator between turns, by the execution engine before dispatch, and by workers between sub-steps; also issues Celery `revoke(terminate=True)` for in-flight tasks. Per-job STOP and global STOP both exist.

### 1.4 Findings model (honesty by construction)

`verification_status`: `confirmed` | `potential` | `hypothesis` | `unverified` | `false_positive`.
- Findings produced by Claude start as `hypothesis`.
- Findings produced by a deterministic analyzer (semgrep rule, pip-audit CVE match, missing header) start as `potential` with the analyzer named as `detection_method`.
- `confirmed` requires either a linked evidence artifact produced by a tool run **and** a verification step, or an explicit human confirmation (recorded in audit log). The backend rejects a transition to `confirmed` without one of these.
- Severity: `info/low/medium/high/critical`; optional CVSS v3.1 vector with computed score (computed by library, not by the model). Confidence: `low/medium/high`.

---

## 2. Dependency list

Exact versions are resolved to the latest stable release at Phase 1 and **locked** (`uv.lock`, `pnpm-lock.yaml`). Major lines targeted:

### Backend (Python 3.12, managed with `uv`)
| Purpose | Package |
|---|---|
| API | `fastapi`, `uvicorn[standard]`, `pydantic` v2, `pydantic-settings` |
| DB | `sqlalchemy` 2.x (async), `asyncpg`, `alembic`, `psycopg` (sync for Celery) |
| Queue | `celery` 5.x, `redis` |
| AI | `anthropic` (official SDK, tool use) |
| Auth/security | `argon2-cffi`, `itsdangerous` (signed session), custom CSRF + Redis rate limiter (avoid extra deps) |
| HTTP (scoped) | `httpx` (wrapped by our scope-enforcing transport) |
| Web engine | `selectolax` (HTML parse), `tinycss2`, `cryptography` (cert parsing) |
| API engine | `openapi-spec-validator`, `pyyaml` |
| Android | `androguard` (manifest, DEX, certs) — `jadx` optional in worker image |
| Windows | `pefile`, `lief`, `signify` (Authenticode verification) |
| Network | `dpkt` (fast pcap/pcapng parsing); `tshark` optional in worker image for dissector depth |
| Code | `semgrep` (in worker image), `bandit`, `pip-audit`, `osv-scanner` binary for multi-ecosystem SCA, `detect-secrets` (redacted output) |
| Files | `python-magic` (libmagic type detection) |
| Reports | `jinja2`, `markdown-it-py`, `cvss` |
| Logging | `structlog` |
| Tests | `pytest`, `pytest-asyncio`, `httpx` test client, `respx`, `hypothesis` (fuzz validators), `ruff`, `mypy` |

### Frontend (Node 22, pnpm)
`next` (App Router), `react`/`react-dom`, `typescript`, `tailwindcss` v4, `shadcn/ui` (Radix primitives copied into repo), `lucide-react`, `recharts`, `@xyflow/react` + `elkjs` (architecture graph with auto-layout), `@tanstack/react-query`, `zod`, `react-hook-form`, `@playwright/test`, `eslint`.

### Infrastructure
PostgreSQL 16, Redis 7, Docker Compose. Egress proxy for `worker-net`: small in-house Python proxy reusing the same scope checker (one policy implementation, not two).

Rejected / deferred: LangChain-style frameworks (unnecessary abstraction over the Anthropic SDK), MinIO (local volume is enough initially), Kubernetes.

---

## 3. Final folder structure

Adapted from the brief: Python modules live in one installable package (`nikita`) so the API and workers share code with clean imports; the brief's top-level `core/`, `engines/`, etc. become sub-packages.

```
nikita-cyber-ai/
├── apps/
│   └── web/                      Next.js dashboard
│       ├── app/(dashboard)/…     14 pages (dashboard, projects, workspace, inspectors, …)
│       ├── components/ui/        shadcn primitives
│       ├── components/…          domain components (plan view, approval card, graph, terminal)
│       └── lib/                  api client, ws client, zod schemas
├── backend/
│   ├── pyproject.toml / uv.lock
│   ├── src/nikita/
│   │   ├── api/                  FastAPI app, routers, deps, websocket hub
│   │   ├── core/
│   │   │   ├── config/           settings, secrets loading
│   │   │   ├── orchestrator/     Claude loop, context manager, prompt templates
│   │   │   ├── planner/          plan generation + plan validation
│   │   │   ├── permissions/      scope manager, policy engine, target validation, SSRF guard
│   │   │   ├── approvals/        approval engine (hash-bound)
│   │   │   ├── execution/        dispatcher, sandbox runner (argv-only subprocess, rlimits)
│   │   │   ├── tool_registry/    ToolDefinition, registry, schema export for Claude
│   │   │   ├── audit/            append-only audit log, redaction
│   │   │   └── security/         auth, sessions, CSRF, rate limits
│   │   ├── engines/{web,api,mobile,desktop,network,code,security}/
│   │   ├── integrations/{static_analysis,dependency_audit,apk_analysis,pe_analysis,traffic_analysis}/
│   │   ├── database/{models,repositories}/
│   │   ├── storage/              content-addressed artifact store, upload validation
│   │   ├── reports/              Markdown/HTML/JSON renderers + templates
│   │   └── workers/              Celery app, queues, task wrappers
│   ├── migrations/               Alembic
│   └── tests/{unit,integration,security,fixtures}/
├── e2e/                          Playwright tests
├── docker/                       api, web, worker-static, worker-net, egress-proxy Dockerfiles
├── labs/                         opt-in local training targets (e.g. OWASP Juice Shop compose profile)
├── docs/
├── .env.example  docker-compose.yml
└── README.md CLAUDE.md ARCHITECTURE.md DEVELOPMENT.md SECURITY.md ROADMAP.md PROJECT_STATUS.md CHANGELOG.md
```

---

## 4. Database design (PostgreSQL)

All tables: `id UUID PK`, `created_at`, `updated_at` (timestamptz). Project-owned tables carry `project_id FK` (ON DELETE CASCADE) and every repository query is project-scoped — the isolation boundary.

| Table | Key columns | Notes |
|---|---|---|
| `users` | email (unique), password_hash (argon2), role, is_active, last_login_at | single-owner first, multi-user capable |
| `projects` | owner_id→users, name, description, default_mode, status, archived_at | |
| `project_settings` | project_id (unique), retention_days, max_parallel_jobs, ai_model, token_budget, json settings | |
| `targets` | project_id, kind (`url`,`domain`,`api_spec`,`apk`,`pe`,`repo`,`pcap`,`directory`), value/display, artifact_id→analysis_artifacts (nullable), metadata jsonb | |
| `scope_rules` | project_id, rule_type (`domain`,`url_prefix`,`ip_cidr`,`port`,`path`), pattern, allow (bool), **authorization_note**, **authorized_by**, **valid_from / expires_at**, version | deny wins; expired rules inert |
| `permissions` | project_id, capability (`network.passive`, `network.active`, `execute.sandbox`, …), granted, expires_at, granted_by | per-project capability toggles |
| `tool_definitions` | tool_id (unique), version, description, risk_class, isolation_tier, input_schema jsonb, output_schema jsonb, timeout_s, limits jsonb, enabled | synced from code registry at startup (code is source of truth) |
| `research_jobs` | project_id, created_by, goal, mode, status (`draft→planning→awaiting_approval→running→completed/failed/stopped`), started_at, finished_at, token_usage, cost_estimate | |
| `research_plans` | job_id, version, summary, created_by (`ai`/`user`), plan jsonb, status | plans are versioned, never edited in place |
| `execution_steps` | job_id, plan_id, seq, tool_id, args jsonb, args_hash, policy_verdict, policy_reason, status, celery_task_id, started_at, finished_at, exit_info jsonb, error | indexed (job_id, seq) |
| `approvals` | project_id, step_id, decision (`approved`/`rejected`), decided_by, decided_at, bound_hash, scope_version, expires_at, comment | |
| `analysis_artifacts` | project_id, sha256, kind, original_name, size, mime, storage_path, produced_by_step_id (nullable), retention_until | uploads and tool outputs |
| `findings` | project_id, job_id, title, description, severity, confidence, cvss_vector, cvss_score, affected_component, detection_method, impact, remediation, verification_status, verified_by, dedup_key | index (project_id, severity), (project_id, verification_status) |
| `evidence` | finding_id, artifact_id, step_id, kind, excerpt (redacted), locator (file:line / request id / packet #) | |
| `reports` | project_id, job_id (nullable), format, title, artifact_id, generated_at, parameters jsonb | |
| `audit_logs` | ts, actor_type (`user`,`ai`,`system`,`worker`), actor_id, project_id, action, target_ref, details jsonb (redacted), ip, request_id | append-only: app DB role has INSERT/SELECT only |

Retention: a periodic Celery beat task purges artifacts/temp data past `retention_until`; audit logs retained separately (longer).

---

## 5. API design (FastAPI, `/api/v1`)

Auth: session cookie (HttpOnly, Secure, SameSite=Strict) + `X-CSRF-Token` on mutating requests. OpenAPI generated and used to type the frontend client.

```
POST   /auth/login · /auth/logout        GET /auth/me
GET    /health/live · /health/ready      (db, redis, workers, anthropic key configured)

GET/POST            /projects
GET/PATCH/DELETE    /projects/{pid}
GET/PUT             /projects/{pid}/settings
GET/POST            /projects/{pid}/scope-rules        PATCH/DELETE /scope-rules/{id}
POST                /projects/{pid}/scope/check        (dry-run: "is X in scope and why")
GET/PUT             /projects/{pid}/permissions
GET/POST            /projects/{pid}/targets            DELETE /targets/{id}
POST                /projects/{pid}/uploads            (multipart; validated, hashed, stored)

POST                /projects/{pid}/jobs               (goal, mode, targets) → draft job
GET                 /projects/{pid}/jobs               GET /jobs/{jid}
POST                /jobs/{jid}/plan                   (ask Claude to plan / re-plan)
PUT                 /jobs/{jid}/plan                   (user edits → new plan version)
POST                /jobs/{jid}/steps/{sid}/approve    POST …/reject
POST                /jobs/{jid}/approve-plan           (batch, per-step hash-bound)
POST                /jobs/{jid}/start · /jobs/{jid}/stop
GET                 /jobs/{jid}/steps · /jobs/{jid}/logs
POST                /jobs/{jid}/chat                   (ask Claude about results/findings)
WS                  /ws/jobs/{jid}                     (step status, logs, AI messages)

POST                /system/stop · /system/resume      (global STOP)

GET                 /tools · /tools/{tool_id}
POST                /tools/{tool_id}/run               (manual run — same policy path as AI)

GET                 /projects/{pid}/findings           (filters: severity, status, engine)
GET/PATCH           /findings/{fid}                    (status transitions enforced)
GET                 /findings/{fid}/evidence
GET                 /projects/{pid}/graph              (architecture graph from evidence only)

POST                /projects/{pid}/reports            (format: md|html|json)
GET                 /reports/{rid} · /reports/{rid}/download
GET                 /projects/{pid}/artifacts/{aid}    (metadata; download as attachment only)
GET                 /audit                             (filters)
GET                 /dashboard/summary
```

The "terminal" page is a view over `/tools/{tool_id}/run` + step logs: it shows registered commands with typed forms and their outputs. It is **not** a shell.

---

## 6. Security architecture

**Trust boundaries:** browser ↔ API (authn, CSRF, rate limits) · API ↔ Claude (model output = untrusted proposal) · API ↔ workers (workers = untrusted, results validated) · workers ↔ targets/files (hostile input).

| Threat | Control |
|---|---|
| Prompt injection via pages, files, logs | Tool results passed to Claude inside clearly delimited data blocks, size-capped and summarized; system prompt states that data never carries instructions; **and** regardless of model behaviour, policy/approval are enforced in code (§1.2 invariants). Claude has no tool that modifies scope, permissions, approvals, or mode. |
| Arbitrary command execution | No `shell=True`, no model-generated command strings. Tools are Python functions; external binaries use fixed argv templates with validated, typed parameters (paths resolved under the job's workspace only). |
| SSRF / scope escape | Central `ScopeChecker`: parse URL → normalise → match rules (deny wins, expiry enforced) → resolve DNS → reject private, loopback, link-local, multicast, cloud metadata (169.254.169.254, fd00:ec2::254) **unless explicitly in scope** (e.g. localhost lab) → connect to the **pinned resolved IP** (blocks DNS rebinding) → re-check every redirect hop. Enforced twice: in the scoped `httpx` transport and in the egress proxy for `worker-net`. |
| Malicious uploads | Size limits per type, libmagic + structure validation, SHA-256, content-addressed storage outside web root, stored non-executable, mounted read-only/noexec into `worker-static`, never served inline (Content-Disposition: attachment, nosniff). Archives extracted with path-traversal, symlink, and zip-bomb (ratio/size/count) guards. |
| Parser exploitation | Parsing only in `worker-static`: non-root, read-only rootfs, `cap_drop: ALL`, `no-new-privileges`, seccomp default, no network, tmpfs scratch, CPU/mem/pids limits, per-task timeouts + rlimits. |
| Container escape amplification | No Docker socket mounted anywhere. Workers cannot reach Postgres directly — results go back through the Celery result channel / API (to be confirmed in Phase 3; minimal-privilege DB role otherwise). |
| Secret leakage | Anthropic key server-side only (env/secret file), never sent to frontend. `structlog` redaction processor (keys, tokens, Authorization/Cookie headers, password fields). Secret scanner output stores rule + location + **masked** preview only. |
| Web app vulns | SQLAlchemy parameterised queries, Pydantic validation, CSP + security headers on Next.js, CSRF tokens, argon2 hashes, login rate limit + lockout, session rotation on login. |
| Abuse of the platform itself | Scope rules require an authorization note and expiry; R4 class rejected; no credential-attack, exploitation, persistence, or evasion tools in the registry. Every action audited. |
| Runaway AI cost/loops | Per-job token budget, max turns, max steps, wall-clock limit; STOP. |

---

## 7. Development roadmap

Each phase ends with: tests run → errors fixed → `PROJECT_STATUS.md` updated → summary + next phase. Phases are not skipped.

| Phase | Deliverable (definition of done) |
|---|---|
| 1 Foundation | Monorepo skeleton, FastAPI app with `/health`, settings, structlog; Alembic + first migration (users, projects); Next.js app with sidebar navigation & empty pages; Dockerfiles + compose (lint-validated); pytest + tsc + eslint green. |
| 2 Dashboard | Design tokens & shadcn setup, dark neutral theme; auth (login/logout/session/CSRF); projects CRUD end-to-end; settings page; workspace layout; dashboard wired to real `/dashboard/summary`. Playwright smoke test. |
| 3 Core security | Scope manager + ScopeChecker (heavily unit/property-tested incl. SSRF corpus); permissions; tool registry; approval engine (hash-bound); execution engine + Celery queues + sandbox runner; audit log; global/per-job STOP; uploads pipeline. First real tools: `file.identify`, `file.hash`. |
| 4 Claude integration | Anthropic client, tool schemas exported from registry, planner, plan validation, orchestration loop, context management (artifact summaries instead of raw dumps), result interpretation into hypothesis findings, research workspace UI with live WS timeline. Tests use recorded/mocked API responses; one live smoke test only if a key is provided. |
| 5 Engines | Web, API (OpenAPI import), Android (androguard), Windows (pefile/lief/signify), Network (dpkt, optional tshark), Code (repo structure, languages, dependency graph). Each with fixtures and tests; architecture graph endpoint + React Flow UI. |
| 6 Security auditing | semgrep/bandit static analysis, pip-audit/osv-scanner SCA, secrets detection (masked), header/cookie/TLS config checks, OWASP-mapped rules, Juice Shop lab profile. |
| 7 Reporting | Findings management (status workflow, dedup, evidence viewer), CVSS calc, MD/HTML/JSON reports with executive summary + appendix, exports. |
| 8 Finalization | Coverage gaps, integration & security tests (SSRF, traversal, CSRF, authz), Playwright flows, perf checks on large pcaps/repos, docs & install guide. |

---

## 8. Technical risks

1. **No Docker daemon in this cloud session.** Container isolation can be designed, written and linted here, but not executed end-to-end. Mitigation: native Postgres/Redis for tests; isolation verification documented as a step you run locally (`make verify-isolation`).
2. **Dynamic analysis (Android emulator / Windows VM) needs KVM or real VMs.** Not feasible in the default stack; delivered as a pluggable `worker-dynamic` interface, labelled *not implemented* until a host with virtualization is available.
3. **Prompt injection is not fully solvable at the model level.** Design treats the model as untrusted; residual risk is limited to Claude producing misleading *text*, mitigated by the verification-status model.
4. **Hostile-file parsers** (lief, androguard, dpkt) have had CVEs. Mitigated by worker sandboxing and timeouts; keep dependencies updated.
5. **Context/cost limits** on large repos and pcaps. Mitigation: deterministic analyzers summarise first; Claude sees structured summaries and can request specific slices.
6. **Tool binary weight** (semgrep, tshark, jadx) inflates worker images. Mitigation: separate optional image variants.
7. **False positives** from static analyzers. Mitigation: never auto-confirmed; triage UI.
8. **Scope correctness is safety-critical.** Mitigation: single implementation, exhaustive tests (IDN, IPv6, decimal/octal IPs, redirects, rebinding, userinfo tricks).
9. **Scale of the brief.** 14 pages × 6 engines is large; each phase will ship working vertical slices rather than wide stubs, and incomplete parts are labelled as such.
10. **Legal/authorization.** The platform records authorization, but cannot verify it. Scope rules require an explicit note and expiry; this is documented in `SECURITY.md`.

---

## 9. Decisions requested from the owner

1. **Location:** (a) `nikita-cyber-ai/` sub-directory in this repo on branch `claude/trusting-gauss-63rs2i` *(recommended for now — the session can only push to this repo)*, or (b) a new dedicated repository you create and attach.
2. **Auth model:** single-owner local account bootstrapped from env (recommended), or multi-user from day one.
3. **Task queue:** Celery (recommended — matches brief, mature revoke/beat support).
4. **Graph library:** React Flow + ELK auto-layout (recommended) vs Cytoscape.js.
5. **Anthropic API key:** needed only from Phase 4; until then all AI paths are tested with mocks.
6. Approve proceeding to **Phase 1**.
