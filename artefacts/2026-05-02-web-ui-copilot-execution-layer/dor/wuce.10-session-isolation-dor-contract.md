# Contract Proposal: Per-user session isolation via COPILOT_HOME

**Story:** wuce.10
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Session manager module: `src/modules/session-manager.js` — standalone module (ADR-009)
  - `createSession(userId) -> sessionPath` — creates `/tmp/copilot-sessions/<sha256(userId)>/<uuid>/`; returns absolute path for use as COPILOT_HOME
  - `cleanupSession(sessionPath)` — deletes the session directory; validates that sessionPath starts with the configured temp base dir before any deletion operation
  - Startup cleanup: `cleanupOrphanSessions(baseDir, maxAgeHours = 24)` — deletes session dirs older than 24h on server start
- Path validation: `isWithinBase(path, baseDir)` — used by `cleanupSession` to prevent path traversal
- Configurable base directory: `WUCE_SESSION_BASE_DIR` env var (default `/tmp/copilot-sessions`)

## Components NOT built by this story

- Persistent model context across sessions — each session is ephemeral
- Disk quota or usage accounting per user
- Cloud storage or remote backup of session directories
- Session listing or management UI

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | `createSession(userId)` → `/tmp/copilot-sessions/<sha256(userId)>/<uuid>/` | `createSession returns path matching expected pattern`, `path contains sha256 of userId`, `path contains UUID segment after userId hash`, `directory created on disk` |
| AC2 | Concurrent users → distinct COPILOT_HOME paths | `two users → two distinct paths`, `same user two calls → two distinct UUID segments`, `paths never collide across concurrent calls` |
| AC3 | `cleanupSession(sessionPath)` deletes within 5s | `cleanupSession removes created directory`, `cleanup completes within 5s`, `cleanup returns success after deletion` |
| AC4 | Cleanup validates path starts with temp base dir | `cleanupSession with path outside base dir → throws error`, `cleanupSession with path traversal attempt → throws error`, `valid path within base → proceeds normally` |
| AC5 | Server restart → delete COPILOT_HOME dirs older than 24h | `cleanupOrphanSessions removes dirs older than 24h`, `cleanupOrphanSessions preserves dirs younger than 24h`, `cleanup completes without throwing` |

## Assumptions

- The `uuid` package or Node.js built-in `crypto.randomUUID()` is used for session UUID generation
- `sha256(userId)` uses Node.js built-in `crypto.createHash('sha256')` — no external dependency
- The server calls `cleanupOrphanSessions` once during startup initialisation, before accepting requests

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/modules/session-manager.js` | Create | Session lifecycle standalone module |
| `src/utils/path-validator.js` | Create | `isWithinBase` path traversal mitigation |
| `src/server.js` | Extend | Call `cleanupOrphanSessions` at startup |
| `tests/session-isolation.test.js` | Create | 17 Jest tests for wuce.10 |

## Contract review

**APPROVED** — all components are within story scope, path traversal mitigation in `cleanupSession` is explicit, session manager is a standalone module per ADR-009, no scope boundary violations identified.
