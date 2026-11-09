# Security

## Intended use

SEVEN CYBER AI is for analysing material you own or are explicitly authorized to test:
your own applications and source code, localhost, isolated training labs, and domains or
devices covered by written authorization. The platform records authorization (scope rules
carry a note, an author and an expiry) but cannot verify it — that responsibility is yours.

The platform deliberately does **not** implement: credential attacks, exploitation beyond
safe verification in training labs, persistence, malware deployment, data exfiltration,
evasion of security controls, or capture of other people's traffic.

## Security architecture

See section 6 of [`docs/ARCHITECTURE_PROPOSAL.md`](docs/ARCHITECTURE_PROPOSAL.md) for the
threat model. Implemented controls are listed below; everything else is planned.

| Control | Status |
|---|---|
| Secrets as `SecretStr`, never in `repr`, never returned by the API | Phase 1 ✅ |
| Production refuses default `SEVEN_SECRET_KEY` | Phase 1 ✅ |
| Log redaction of password/token/key/cookie/authorization fields | Phase 1 ✅ |
| Security headers on API and web responses | Phase 1 ✅ |
| Request-ID validation (header injection) | Phase 1 ✅ |
| Health errors expose exception class only (no DSNs/hosts) | Phase 1 ✅ |
| API docs/OpenAPI disabled in production | Phase 1 ✅ |
| Containers: non-root, `cap_drop: ALL`, `no-new-privileges`, read-only rootfs (api, web, redis) | Phase 1 ✅ (written; not run in the dev cloud session — no Docker daemon) |
| DB/Redis on an internal-only network; web bound to 127.0.0.1 | Phase 1 ✅ (same caveat) |
| Authentication, sessions, CSRF, rate limiting | Phase 2 |
| Scope manager, SSRF guard, approvals, tool registry, audit log, STOP | Phase 3 |
| Upload validation and isolated parsing workers | Phase 3 |
| Prompt-injection containment in the orchestrator | Phase 4 |

## Reporting a problem

This is a personal project. Open a private issue on the repository or contact the owner.
