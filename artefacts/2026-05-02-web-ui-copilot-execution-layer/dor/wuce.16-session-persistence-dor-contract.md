# Contract Proposal: Multi-turn session persistence (resume in-progress skill session)

**Story:** wuce.16
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Durable session store: `src/modules/durable-session-store.js` — stores and retrieves application-layer session state (conversation history, partial artefact, question index, session metadata)
  - `createDurableSession(userId, skillName) -> sessionId` — generates cryptographically random session ID (≥128 bits)
  - `saveDurableSession(sessionId, userId, state)` — persists session state to filesystem/in-memory store
  - `loadDurableSession(sessionId, userId) -> state | null` — loads session state; validates userId matches; returns null if mismatch or expired
  - `listDurableSessions(userId) -> [{sessionId, skillName, startedAt, questionsCompleted}]` — for AC5 session list
  - `deleteExpiredSessions(maxAgeHours = 24)` — deletes sessions inactive >24h
- Express route handler extensions: `GET /skills/sessions/:sessionId/resume` — returns session state at exact step for resumption
- Session expiry response: `GET /skills/sessions/:sessionId` for expired session → "Session expired" message with HTTP 410 Gone
- Cross-user access guard: all session endpoints validate `session.userId === authenticatedUser.id` → HTTP 403 if mismatch
- Session list integration: `GET /skills` includes in-progress sessions (integrates with wuce.13 `/skills` route)
- Test fixtures: `tests/fixtures/sessions/durable-session-state.json`

## Components NOT built by this story

- Cross-device session sync (sessions are server-bound in v1)
- Session export or import to/from external format
- Session branching (trying different answers to the same question)
- Delegation of sessions to another user
- WebSocket-based session persistence

## Storage distinction (CRITICAL — must be respected)

| Store | Managed by | Contents | Lifetime |
|-------|-----------|----------|---------|
| COPILOT_HOME dirs | `session-manager.js` (wuce.10) | Copilot CLI state, model context | Ephemeral — deleted on subprocess completion |
| Durable session store | `durable-session-store.js` (wuce.16) | Conversation history, answers, partial artefact, question index | Until expiry (24h inactivity) or commit |

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Close tab + return within 24h → session restored at exact step | `loadDurableSession returns state with correct question index`, `resumed session shows unanswered questions from exact step`, `previously answered questions pre-populated` |
| AC2 | Resumed session + remaining answers → committed artefact has full content from both parts | `partial session state + additional answers → full artefact content on commit`, `no answers lost across session boundary` |
| AC3 | Session ID belonging to different user → 403 | `session owned by user A, loaded by user B → HTTP 403`, `403 returned without leaking session content`, `valid owner can access own session` |
| AC4 | Session inactive >24h → "Session expired" + data deleted | `session older than 24h → "Session expired" response`, `session data deleted after expiry response`, `response is not a 404` |
| AC5 | Multiple in-progress sessions → list at `/skills` | `GET /skills includes in-progress sessions`, `each session shows skill name, start date, questions completed`, `completed sessions not shown in in-progress list` |

## Assumptions

- "Questions completed" = count of questions with a saved answer in session state
- Session inactivity is measured by `lastActivityAt` timestamp updated on each save
- Durable session store is in-memory in v1 (Map); filesystem serialisation is optional enhancement but sessions survive process restart in production via filesystem path

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/modules/durable-session-store.js` | Create | Application-layer session persistence |
| `src/routes/sessions.js` | Create | Session resume and expiry route handlers |
| `src/routes/skills.js` | Extend | Add in-progress session list to GET /skills (wuce.13 integration) |
| `src/server.js` | Extend | Call `deleteExpiredSessions` at startup |
| `src/app.js` | Extend | Mount sessions routes |
| `tests/session-persistence.test.js` | Create | 22 Jest tests for wuce.16 |
| `tests/fixtures/sessions/durable-session-state.json` | Create | Fixture: serialised session state object |

## Contract review

**APPROVED** — all components are within story scope, storage distinction between COPILOT_HOME and durable store is explicit, cryptographic session IDs and cross-user 403 guard are documented in coding agent instructions, OAuth token exclusion from session state is a named constraint, no scope boundary violations identified.
