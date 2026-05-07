## Story: Session persistence — disk-backed journey and skill session store

**Epic reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md

## User Story

As an **operator using the web UI for real delivery work**,
I want journey state and skill session turns to be persisted to disk automatically,
So that I can close the browser, restart the server, and resume exactly where I left off — without re-entering any prior turns.

## Benefit Linkage

**Metric moved:** Session continuation rate — the proportion of journeys that span more than one server process lifetime.
**How:** Currently, a server restart or browser refresh loses all in-progress journey and session state. This makes the tool unsuitable for any delivery session longer than a single uninterrupted browser window. Disk persistence transforms the tool from a demo to a production-usable instrument.

## Architecture Constraints

- Persistence store location: `SESSION_STORE_PATH` env var (default `./sessions-store/`). One JSON file per session/journey ID. File name = `<id>.json`.
- **Security constraint (mandatory):** `accessToken` (the GitHub OAuth token stored in `req.session.accessToken`) MUST NOT be written to disk. It is excluded before every serialize. On restore, if `accessToken` is absent, the user must re-authenticate — the journey state is restored but the auth state is not.
- Write-on-every-mutation: every handler that modifies journey state or appends a skill session turn must call the persistence adapter after the mutation. Lazy/batch writes are not acceptable — a crash between write and flush must not lose more than one turn.
- Read-on-startup: at server start, all valid session files in `SESSION_STORE_PATH` are loaded into the in-memory store. Invalid JSON files are logged at WARN and skipped — they do not crash the server.
- Stale session cleanup: sessions older than `SESSION_MAX_AGE_DAYS` (default 7, configurable via env var) are deleted from disk on server startup. "Older than" means the session's `lastUpdated` timestamp.
- D37: the persistence adapter is injectable (`_sessionStore`) with a stub that throws. The real implementation is wired in `server.js`. `NODE_ENV=test` stubs for isolation.
- No new npm dependencies — `fs`, `path`, built-ins only.

## Dependencies

- **Upstream:** ougl.1–ougl.7 (DoD-complete) — in-memory journey and session infrastructure must exist before persistence is layered on.
- **Downstream:** wsm.3 (non-happy-path branching) requires persistence to survive back-navigation state changes.

## Acceptance Criteria

**AC1:** Given an operator is mid-journey (has completed two stage turns), when the Node.js server process is restarted and the operator opens the journey URL, then all prior turns are visible in the chat panel and the journey is at the same stage as before the restart.

**AC2:** Given an operator's session contains an `accessToken`, when the session is written to disk, then the resulting JSON file contains no `accessToken` field — it is stripped before write.

**AC3:** Given the server starts with an existing sessions store containing three session files, when startup completes, then all three sessions are available in memory — confirmed by loading each journey URL and seeing its prior state.

**AC4:** Given a session file in the store contains invalid JSON, when the server starts, then a WARN log is emitted for that file and the server starts normally — no crash.

**AC5:** Given `SESSION_MAX_AGE_DAYS=1` and a session file has `lastUpdated` set to 8 days ago, when the server starts, then that session file is deleted from disk and a log entry records the deletion.

**AC6:** Given the operator appends a new skill session turn (e.g. sends a message in the chat panel), when the turn is saved to memory, then the session file on disk is also updated within the same synchronous request cycle — not deferred to a background tick.

**AC7:** Given `SESSION_STORE_PATH` is set to a directory that does not exist, when the server starts, then the directory is created automatically — the server does not exit.

## Out of Scope

- Encrypting session files on disk — outside this story's scope; a follow-on security hardening story if required.
- Syncing sessions across multiple server instances — single-process only.
- Remote (cloud) session storage — local filesystem only.

## NFRs

- **Security:** `accessToken` never on disk — enforced by the serializer and tested with an explicit AC2 assertion.
- **Reliability:** A single session file that cannot be written (permissions, disk full) must not crash the server; the error is logged at ERROR level and the mutation completes in memory.

## Complexity Rating

**Rating:** 2 — inject persistence into all mutation paths; `accessToken` exclusion must be verified.
**Scope stability:** Stable.
