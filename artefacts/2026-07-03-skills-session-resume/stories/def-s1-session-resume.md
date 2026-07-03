# Story def-s1 — Skills session resume: restore turns and artefact from Redis on page load

**Feature:** 2026-07-03-skills-session-resume
**Epic:** N/A (short-track defect)
**Track:** short-track (bug fix)
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## Defect summary

When a user navigates directly to a `/skills/:skillName/sessions/:id/chat` URL after a server restart or Fly.io deploy, they receive a 404 "Session not found" page. The session IS durably persisted in Redis (via `skill-session-redis.js`) — it is not lost — but `handleGetChatHtml` in `src/web-ui/routes/skills.js` checks only the in-memory `_sessionStore` and returns 404 immediately if the session is absent, without attempting a Redis restore.

The consequence: users lose access to their in-progress skill session (turns and partial artefact) on every server restart. On Fly.io this happens on every deploy. The session data is safely in Redis and recoverable — the handler just never tries.

A secondary gap: once the page loads (same server instance, session still in `_sessionStore`), `session.turns` and `session.artefactContent` are served from memory correctly. The Redis restore path must replicate this, restoring both `turns` (conversation history → rendered as prior Q&A pairs) and `artefactContent` (partial skill output → rendered in the artefact panel).

## User story

As a platform user with an in-progress skill session,
I want navigating to my session URL (e.g. after a browser refresh or a server deploy) to reload my prior conversation and partial artefact,
So that I never lose in-progress skill work due to a server restart.

## Root cause

`handleGetChatHtml` (`src/web-ui/routes/skills.js`, ~line 3569):

```js
var session = _sessionStore.get(sessionId);
if (!session) {
  // returns 404 — no Redis restore attempted
}
```

The Redis restore functions (`readSessionFromRedis`, `registerHtmlSession`, `mergeRedisSessionData`) already exist and are used by `handleGetJourneyResume` in `journey.js` (lines 1191-1197), but are not called from the standalone skills chat handler.

## Acceptance criteria

**AC1** — Redis restore on cache miss: session URL loads (200) when session absent from `_sessionStore` but present in Redis
Given a user navigates to `/skills/:skillName/sessions/:sessionId/chat`,
And the sessionId is NOT present in the in-memory `_sessionStore` (e.g. after server restart),
And the sessionId IS present in Redis (returned by `readSessionFromRedis`),
When `handleGetChatHtml` executes,
Then the handler calls `registerHtmlSession` then `mergeRedisSessionData`, populates `_sessionStore`, and serves the chat page with HTTP 200.

**AC2** — 404 preserved for genuinely unknown sessions
Given the sessionId is NOT in `_sessionStore` AND `readSessionFromRedis` returns null (not in Redis),
When `handleGetChatHtml` executes,
Then the handler returns 404 "Session not found" (existing behaviour preserved).

**AC3** — Prior conversation turns restored
Given AC1 holds (Redis restore occurred),
When the rendered chat page HTML is inspected,
Then the `priorQA` pairs built from `session.turns` are present in the HTML — the user sees their prior conversation, not a blank chat.

**AC4** — Prior artefact content restored
Given AC1 holds (Redis restore occurred),
And the session had a non-null `artefactContent` at the time of the last Redis write,
When the rendered chat page HTML is inspected,
Then `window.__SW_INITIAL_ARTEFACT__` is set in the inline script (artefact panel shows the prior draft).

**AC5** — Journey panel renders correctly after Redis restore
Given AC1 holds (Redis restore occurred),
And `redisData.journeyId` is non-null (the restored session was linked to a journey),
When the rendered chat page HTML is inspected,
Then `session.journeyId` is set on the restored session so the journey navigator and gate-confirm panel render correctly.

**AC6** — No regression: sessions already in `_sessionStore` are unaffected
Given the sessionId IS present in `_sessionStore` (normal in-process path),
When `handleGetChatHtml` executes,
Then the handler serves the chat page exactly as before — no change in behaviour, no additional Redis reads.

## Out of scope

- `handleResumeSession` API (`GET /api/skills/:name/sessions/:id/resume`): this uses the separate `src/session-store.js` durable store and is a distinct flow used by the sessions list page. To be addressed separately if needed.
- Journey resume path (`handleGetJourneyResume` in `journey.js`): already implements Redis restore; no change required.
- Session migration or data backfill: Redis writes are fire-and-forget after every turn; all sessions written since `skill-session-redis.js` was deployed (feature `2026-06-20-skill-session-precomp`) are already available in Redis.
- UI changes: the fix is entirely in the server-side handler; the rendered HTML is unchanged.

## Implementation touchpoints

- `src/web-ui/routes/skills.js` — `handleGetChatHtml` (line ~3569): add async Redis restore before the 404 branch. Pattern:
  1. `var _redisData = await readSessionFromRedis(sessionId);`
  2. If `_redisData`: call `registerHtmlSession(sessionId, _redisData.sessionPath, _redisData.skillName, { featureSlug: _redisData.featureSlug })` to create an in-memory session with a fresh system prompt
  3. Call `mergeRedisSessionData(sessionId, _redisData)` to restore `turns`, `artefactContent`, `journeyId`, etc.
  4. Re-read `session = _sessionStore.get(sessionId)`
- `tests/web-ui/skills-session-resume.test.js` (new): unit tests for AC1–AC6

## Architecture constraints

- `registerHtmlSession` is a synchronous function and `readSessionFromRedis` is async — `handleGetChatHtml` is already `async`; no await chain changes needed.
- `mergeRedisSessionData` requires the session to already exist in `_sessionStore` (it reads from there) — call order is: `registerHtmlSession` FIRST, then `mergeRedisSessionData`. Reversing the order will produce a no-op merge.
- Redis data does NOT include `systemPrompt`, `contextFiles`, or `precomputedStep1` (stripped by `COMPACT_STRIP` in `skill-session-redis.js`). `registerHtmlSession` rebuilds these from the skill SKILL.md. This is correct and expected.
- `_redisData.done === true` → `readSessionFromRedis` returns null (this check is already in `readSessionFromRedis` line 78). Completed sessions are deleted from Redis on completion. No handling needed for `done` case.
- Path traversal: `_redisData.sessionPath` comes from Redis (written by the server). It is server-originated, not user-controlled. The existing path traversal guard in `registerHtmlSession` (if any) covers this; no additional guard needed in `handleGetChatHtml`.

## NFRs

- **No additional Redis reads for hot path**: Redis restore only executes when `_sessionStore.get(sessionId)` returns null (cache miss). Sessions already in memory incur zero additional I/O (AC6).
- **Graceful Redis unavailability**: `readSessionFromRedis` already returns null if `_skillSessionRedis` is null or if the read throws. The 404 fallback is preserved when Redis is unavailable.
- **No credentials in Redis data**: `skill-session-redis.js` already strips `accessToken` from all writes (`_sanitise`). No change needed.

## Test

Tests live in `tests/web-ui/skills-session-resume.test.js`. The test injects a mock `_skillSessionRedis` adapter via `setSkillSessionRedisAdapter`. Required cases:
- AC1: mock Redis returns session data → 200 response, session appears in `_sessionStore`
- AC2: mock Redis returns null → 404 response
- AC3: session has turns → priorQA HTML present in response body
- AC4: session has `artefactContent` → `__SW_INITIAL_ARTEFACT__` present in response body
- AC5: session has `journeyId` → restored session has `journeyId` set
- AC6: session already in `_sessionStore` → 200, Redis adapter NOT called
