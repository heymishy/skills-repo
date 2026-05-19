## Story: Per-user session isolation via COPILOT_HOME

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e3-phase2-execution-engine.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **platform operator running the web backend**,
I want each user's Copilot CLI execution to use a fully isolated `COPILOT_HOME` directory that is created before execution and cleaned up after,
So that concurrent sessions from different users cannot access each other's CLI state, cached credentials, or intermediate artefact files.

## Benefit Linkage

**Metric moved:** M1 — Copilot CLI/API feasibility (spike verdict: PROCEED)
**How:** The spike identified `COPILOT_HOME` per-user isolation as a required architecture decision (Spike PROCEED condition c); without isolation, multi-user server deployment is unsafe and P2 cannot be activated for enterprise use.

## Architecture Constraints

- Mandatory security constraint: each user's `COPILOT_HOME` directory must be created in a per-user-per-session scoped path (e.g. `/tmp/copilot-sessions/<userHash>/<sessionId>/`) — never the server's default home directory
- Mandatory security constraint: `COPILOT_HOME` directories must be deleted after session completion (success or failure) — no indefinite accumulation of user session data on the server
- Mandatory security constraint: the path computed for `COPILOT_HOME` must be validated to confirm it resolves within the designated temp directory — path traversal via user-controlled session ID must be mitigated
- ADR-009: session lifecycle management (create, use, cleanup) is a separate module from the subprocess executor (`wuce.9`) — do not inline home-dir management in the subprocess spawner

## Dependencies

- **Upstream:** wuce.9 (this story provides the `homeDir` parameter that wuce.9 uses)
- **Downstream:** wuce.13 (the session lifecycle manager provides the home directory for each guided skill session)

## Acceptance Criteria

**AC1:** Given the server starts a skill execution session for a user, When `createSession(userId)` is called, Then a unique directory is created at `/tmp/copilot-sessions/<sha256(userId)>/<uuid>/` and the absolute path is returned — the directory must not already exist before creation.

**AC2:** Given two concurrent users are executing skills simultaneously, When both sessions are active, Then each user's Copilot CLI subprocess has a distinct `COPILOT_HOME` path — there are no shared files between the two session directories.

**AC3:** Given a skill execution session completes (success or error), When `cleanupSession(sessionPath)` is called, Then the entire session directory and all its contents are deleted from the filesystem within 5 seconds of the session ending.

**AC4:** Given a session cleanup is triggered, When the path is validated, Then the cleanup only proceeds if the resolved absolute path starts with the designated temp base directory — cleanup of paths outside that directory is rejected with an error log entry.

**AC5:** Given the server restarts with orphaned session directories present (e.g. from a previous crash), When the server starts, Then any `COPILOT_HOME` directories older than 24 hours are deleted during startup cleanup.

## Out of Scope

- ACP server session management (`newSession()`, `prompt(sessionId)`) — ACP multi-turn session state is covered in wuce.16
- Persistent across-session Copilot model cache for performance — post-MVP (v1 accepts cold start per session)
- Per-user disk quota enforcement on session directories — post-MVP

## NFRs

- **Security:** Isolated per-user/per-session paths. Path traversal mitigated. Session directories deleted on completion. Startup cleanup of orphans.
- **Performance:** Session directory creation and deletion complete in under 100ms each.
- **Audit:** Session create and cleanup events logged with user ID hash (not raw user ID), session ID, and duration.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
