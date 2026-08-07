## Test Plan: Consistent skill-session Redis fallback

**Story reference:** artefacts/2026-07-22-skill-session-redis-fallback/stories/wusl-s1-consistent-session-redis-fallback.md
**Epic reference:** None — short-track
**Test plan author:** Claude (autonomous, short-track)
**Date:** 2026-07-22

---

## AC Coverage

| AC | Description | Unit | Integration | Gap type | Risk |
|----|-------------|------|-------------|----------|------|
| AC1 | Extraction, handleGetChatHtml unchanged | — | 1 test (regression) | — | 🟢 |
| AC2 | 9 handlers gain fallback | — | 9 tests (1 per handler) | — | 🟢 |
| AC3 | Genuine double-miss unchanged | — | 1 test | — | 🟢 |
| AC4 | Sync functions explicitly unconverted | 1 test | — | — | 🟢 |

---

## Unit/Integration Tests

### IT1 (AC1) — handleGetChatHtml's own restore behavior is unchanged after extraction

Real function call: session absent from `_sessionStore`, present in a stub Redis adapter. Assert the response is a real chat page (200), not a 404, and the restored session carries the right `skillName`/`turns`.

### IT2-IT10 (AC2) — each of the 9 handlers restores from Redis on a cold in-memory Map

For each handler: register a session via `registerHtmlSession` + a stub Redis adapter write, then `_sessionStore.delete(sessionId)` (simulating the cache miss), then call the real handler. Assert it does NOT return the handler's own "session not found" response, proving it restored from Redis instead of hitting the cold-miss path.

### IT11 (AC3) — a session absent from both memory and Redis still 404s/errors normally

Call any one of the 9 handlers with a sessionId absent from both stores. Assert the exact same "not found"/error response as before this story.

### U1 (AC4) — sync functions remain synchronous and still return null/undefined on a cold Map

Call `_getHtmlSession`, `htmlGetNextQuestion`, `htmlGetCompletePage`, `htmlGetPreview` directly against a cleared `_sessionStore` (no Redis fallback attempted) and assert each returns `null`/`undefined` — proving the explicit scope boundary holds, not silently patched.

---

## Out of Scope for This Test Plan

- Load/concurrency testing.
- Any test of the excluded sync-function Redis-fallback behavior (they don't have any, by design — AC4 tests the absence, not a fallback).
