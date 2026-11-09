# CLAUDE.md — working rules for AI agents on this repository

## Context
NIKITA CYBER AI lives in `nikita-cyber-ai/`. The repository root also contains an unrelated
static website (`index.html`, `assets/`, root `README.md`) — never modify it.

Read first: `PROJECT_STATUS.md` (where we are), `docs/ARCHITECTURE_PROPOSAL.md` (approved design),
`DEVELOPMENT.md` (commands and conventions).

## Non-negotiable rules
- The AI orchestrator never executes shell commands and never changes scope, permissions,
  approvals or mode. Only typed tools from the registry, dispatched by the backend.
- No `subprocess` with `shell=True`; external binaries use fixed argv templates.
- Never log or return secrets; driver/exception messages do not go to clients.
- Uploaded files are never executed and never parsed in the API process.
- Findings produced by the model start as `hypothesis`.
- Never present unimplemented features as working. Non-functional pages use `PlannedPage`.
- Never claim tests passed without running them; record real results in `PROJECT_STATUS.md`.

## Workflow per phase
1. Implement the phase scope only. 2. `make check` (+ `make e2e` when UI changed).
3. Fix failures. 4. Update `PROJECT_STATUS.md`, `CHANGELOG.md`, `ARCHITECTURE.md`.
5. Summarize done / remaining / next phase.

## Next.js
Next.js 16 differs from older versions — read `apps/web/node_modules/next/dist/docs/` before
using unfamiliar APIs (see `apps/web/AGENTS.md`).
