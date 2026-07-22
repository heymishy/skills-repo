# Story: Skill session lookups fall back to Redis consistently across every request handler, not just chat-page load

**Epic reference:** None — short-track. Direct follow-on from srf-s1 (session middleware) and jrf-s2 (journey store) — the third and final instance of the same recurring pattern, identified via the operator's own requested audit this session.
**Discovery reference:** None — short-track skips discovery; root cause confirmed by direct code inspection this session.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## Background

Following the operator's request to check whether the in-memory-Map/Postgres-or-Redis-write-behind pattern (already found and fixed twice this session — `srf-s1` for login sessions, `jrf-s2` for journeys) exists elsewhere, a repo-wide audit found a third instance: `routes/skills.js`'s `_sessionStore` (the actual skill conversation/session data — chat turns, in-progress artefact content).

This one is **partially** mitigated already: `handleGetChatHtml` (the chat page's own `GET` handler) contains a correct, working Redis-restore sequence (read the compact Redis record, `registerHtmlSession` to rebuild the system prompt, `mergeRedisSessionData` to restore turns/state, then re-attach `journeyId`) — but this logic was written **inline, once, in that one handler**, never extracted into a shared helper. Every other request handler that reads `_sessionStore.get(sessionId)` directly (answer submission, turn submission, streaming turn, commit, assumption confirm, session-state polling) has no such fallback — the same silent-miss risk `srf-s1`/`jrf-s2` fixed elsewhere, still present here.

In practice this is lower-severity than the other two: a user's normal navigation flow loads the chat page first (which already restores from Redis), so the gap mostly bites when a deploy lands strictly between a page load and a subsequent in-page action (answering, submitting a turn) — the same narrow race window already characteristic of this whole bug class today.

## User Story

As **a user in the middle of an active skill session (discovery, definition, etc.)**,
I want **every action I take (answering a question, submitting a turn, checking status, committing an artefact) to survive a server process replacement, not just the initial page load**,
So that **a deploy landing mid-session doesn't silently lose my conversation turns or artefact-in-progress at some actions but not others — the resilience `handleGetChatHtml` already has should apply consistently everywhere this session is read**.

## Architecture Constraints

- Checked against `.github/architecture-guardrails.md` — no conflicting ADR found.
- Extracts `handleGetChatHtml`'s own existing, already-correct restore sequence into one shared helper (`_getSessionOrRestore`), used by both `handleGetChatHtml` (de-duplicated) and every other qualifying handler — not a new mechanism, a DRY consolidation of a proven one.
- **Explicit scope boundary:** this story converts only the **async request-handler-level** call sites (`handlePostAnswer`, `handleGetSessionState`, `handleCommitArtefact`, `handlePostCanvasEditHtml`, `handlePostTurnHtml`, `handlePostTurnStreamHtml`, `handlePostAssumptionConfirm`, `htmlSubmitTurn`, `htmlRecordAnswer`) — each already `async`, each independently awaitable at its own single call site, mirroring `srf-s1`'s exact "confirm the blast radius, then await" discipline. It explicitly does **not** convert the remaining **synchronous, broadly-reused** accessor functions (`_getHtmlSession`, `htmlGetNextQuestion`, `htmlGetCompletePage`, `htmlGetPreview`, `linkSessionToJourney`) — converting those to async has a wider, harder-to-fully-map ripple (multiple callers across `server.js`/`journey.js`/`products.js`/tests, some of which are themselves synchronous), and those specific paths are lower-exposure (rarer actions, or usually reached only after the primary chat-page load has already warmed the in-memory entry). This is a deliberate, named, and accepted scope cut for this pass, not an oversight.

## Dependencies

- **Upstream:** None — modifies existing, already-merged code.
- **Downstream:** None yet. The excluded sync-function gap (see Architecture Constraints) is a candidate for a future, separately-scoped follow-on if it proves to matter in practice.

## Acceptance Criteria

**AC1 (shared helper extracted, chat-page-load behavior unchanged):** Given `handleGetChatHtml`'s existing inline Redis-restore logic, When it is extracted into a shared `_getSessionOrRestore(sessionId)` helper, Then `handleGetChatHtml`'s own observable behavior (session restored from Redis on a cold in-memory Map, 404 if genuinely absent from both) is unchanged — verified by re-running its own existing test coverage unmodified.

**AC2 (answer/turn/commit/assumption/canvas handlers gain the same fallback):** Given each of the 9 named async handlers (`handlePostAnswer`, `handleGetSessionState`, `handleCommitArtefact`, `handlePostCanvasEditHtml`, `handlePostTurnHtml`, `handlePostTurnStreamHtml`, `handlePostAssumptionConfirm`, `htmlSubmitTurn`, `htmlRecordAnswer`), When the in-memory `_sessionStore` has lost a session that is still present in Redis, Then each handler successfully restores and uses it — verified by a dedicated test per handler (or a shared parametrized test exercising all 9), not inferred from AC1 alone.

**AC3 (genuine double-miss still 404s/errors exactly as today):** Given a session absent from both the in-memory Map and Redis, When any of the above handlers runs, Then it produces the exact same "not found" response it does today — this story does not change that path's behavior.

**AC4 (sync helper functions explicitly unconverted, documented gap):** Given `_getHtmlSession`, `htmlGetNextQuestion`, `htmlGetCompletePage`, `htmlGetPreview`, and `linkSessionToJourney` remain synchronous, When any of them is called against a cold in-memory Map, Then it still returns `null`/`undefined` exactly as today (unchanged, not silently "fixed" by an incomplete implementation) — this AC exists to make the boundary of this story's fix explicit and testable, not to add new behavior.

## Out of Scope

- Converting `_getHtmlSession`, `htmlGetNextQuestion`, `htmlGetCompletePage`, `htmlGetPreview`, `linkSessionToJourney` to async with Redis fallback — named, accepted gap (see Architecture Constraints); a future story if it proves to matter.
- Any change to `readSessionFromRedis`/`mergeRedisSessionData`'s own internals — reused exactly as already proven in `handleGetChatHtml`.
- Any change to Redis write timing/frequency (`skill-session-redis.js`'s own write path) — untouched.

## NFRs

- **Performance:** Redis fallback only fires on an in-memory cache miss — unchanged latency for the common (session-already-loaded) case, matching `srf-s1`'s own NFR framing exactly.
- **Resilience:** This is itself a resilience improvement, extending an already-proven pattern consistently rather than leaving it accidentally single-purpose.
- **Security:** No new data written to Redis — this story only adds read-path consistency.

## Complexity Rating

**Rating:** 2 — mechanically similar to `srf-s1`, but touches 9 call sites across a large file instead of 1, requiring careful per-site verification that each caller is safely awaitable (already confirmed via direct inspection before this story was written).
**Scope stability:** Stable — explicit, named exclusion of the harder sync-function conversion keeps this bounded.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
