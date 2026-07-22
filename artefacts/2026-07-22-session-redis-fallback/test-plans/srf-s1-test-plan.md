## Test Plan: Session middleware Redis fallback on cache miss

**Story reference:** artefacts/2026-07-22-session-redis-fallback/stories/srf-s1-session-middleware-redis-fallback.md
**Epic reference:** None — short-track
**Test plan author:** Claude (autonomous, short-track)
**Date:** 2026-07-22
**Test runner confirmed from package.json:** `node scripts/run-all-tests.js` (per-file `node tests/check-*.js`)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Redis fallback rehydrates session, no new Set-Cookie | 2 tests | — | — | — | — | 🟢 |
| AC2 | Genuine cache miss still creates a new session | 2 tests | — | — | — | — | 🟢 |
| AC3 | OAuth callback survives simulated process replacement | — | 1 test | — | — | — | 🟢 |
| AC4 | accessToken honestly absent after rehydration | 1 test | — | — | — | — | 🟢 |
| AC5 | No Redis configured — unchanged fallback-to-new-session behavior | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All behaviour is server-side session/middleware logic — no CSS-layout or browser-only concern in this story.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, mirrors `check-p3.2-redis-session-adapter.js`'s established stub-adapter convention.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Notes |
|----|-------------|--------|-------|
| AC1 | A stub Redis adapter pre-seeded with one session's data; an in-memory Map with that session cleared | Synthetic | Mirrors the stub-adapter pattern already used by `check-p3.2-redis-session-adapter.js` |
| AC2 | A cookie sessionId absent from both the stub Redis adapter and the in-memory Map | Synthetic | |
| AC3 | A real `handleAuthGithub` → simulated cache-clear → real `handleAuthCallback` round trip | Synthetic, using existing `check-sec5-session-rotation.js`-style fake req/res helpers | |
| AC4 | A stub Redis adapter's stored data already lacking `accessToken` (matching real `_sanitise` behaviour) | Synthetic | |
| AC5 | No Redis adapter configured (`setRedisAdapterForTesting(null)` / unset) | Synthetic | |

### Gaps

None — all test data is available now and self-contained.

---

## Unit Tests

### U1 — sessionMiddleware rehydrates a session from Redis on an in-memory cache miss (AC1)

- **Verifies:** AC1
- **Precondition:** A stub Redis adapter's store contains `{login: 'octocat', userId: 42}` under a known session ID; `_clearForTesting()` ensures the in-memory Map does not have it.
- **Action:** Call `await sessionMiddleware(req, res)` with a `Cookie: session_id=<that id>` header.
- **Expected result:** `req.session` equals the rehydrated data (`login: 'octocat', userId: 42`); `req.sessionId` equals the cookie's ID; `res.setHeader` was never called with `Set-Cookie` (no new session created).

### U2 — the rehydrated session is written back into the in-memory Map (AC1)

- **Verifies:** AC1
- **Precondition:** Same as U1.
- **Action:** Call `sessionMiddleware`, then call `getSession(id)` directly afterward.
- **Expected result:** `getSession(id)` now returns the rehydrated data — subsequent requests in the same process no longer need a second Redis round-trip for this session.

### U3 — a cookie session absent from both memory and Redis creates a new session (AC2)

- **Verifies:** AC2
- **Precondition:** Stub Redis adapter's store does NOT contain the cookie's session ID; in-memory Map doesn't either.
- **Action:** Call `sessionMiddleware` with that cookie.
- **Expected result:** A new session is created (`req.sessionId` differs from the stale cookie value); `Set-Cookie` header was set.

### U4 — no cookie at all creates a new session without attempting a Redis read (AC2)

- **Verifies:** AC2
- **Precondition:** No `Cookie` header on the request.
- **Action:** Call `sessionMiddleware`.
- **Expected result:** A new session is created; the stub Redis adapter's read method was never called (no wasted lookup for a request that was never going to have a cookie to look up).

### U5 — accessToken is absent (not fabricated) after a Redis rehydration (AC4)

- **Verifies:** AC4
- **Precondition:** Stub Redis adapter's stored data for a session has no `accessToken` field (matching real `_sanitise` stripping) but has `login`/`userId`.
- **Action:** Call `sessionMiddleware`, rehydrating that session.
- **Expected result:** `req.session.accessToken` is `undefined`; `req.session.login`/`req.session.userId` are present and correct.

### U6 — with no Redis adapter configured, a cache miss falls straight through to a new session (AC5)

- **Verifies:** AC5
- **Precondition:** `setRedisAdapterForTesting(null)` (or never set) — matches this repo's local-dev/test default.
- **Action:** Call `sessionMiddleware` with a cookie pointing to a session absent from the in-memory Map.
- **Expected result:** A new session is created without error, without hanging, and without attempting any Redis call.

---

## Integration Tests

### IT1 — the real GitHub OAuth callback survives a simulated mid-flow process replacement (AC3)

- **Verifies:** AC3
- **Components involved:** `routes/auth.js`'s `handleAuthGithub` and `handleAuthCallback`, `middleware/session.js`, the stub Redis adapter.
- **Precondition:** Call `handleAuthGithub` for a fresh session (writes `oauthState`, persists to the stub Redis adapter). Then simulate a process replacement: `sessionModule._clearForTesting()` (wipes the in-memory Map, leaving only the stub Redis adapter's data — exactly what a redeploy does to the real in-memory Map while Upstash Redis is untouched).
- **Action:** Call `sessionMiddleware` with the same session cookie (simulating the callback request re-attaching the session), then call `handleAuthCallback` with the matching `state` query param.
- **Expected result:** No 403 "Forbidden" response — the CSRF state check passes because `oauthState` was rehydrated from Redis. The flow proceeds to token exchange (mocked provider adapter, matching this repo's existing OAuth test conventions).

---

## NFR Tests

### NFR1 — no added latency for the common case (session already in memory)

- **Verifies:** Performance NFR
- **Action:** Assert the stub Redis adapter's read method is never called when the in-memory Map already has the session.
- Covered by the existing in-memory-hit path being unchanged — no new test needed beyond confirming U1-U6 only exercise the Redis path on an actual cache miss (already implicit in each test's precondition).

---

## Out of Scope for This Test Plan

- Any test of `accessToken` being cached in Redis — explicitly out of story scope (operator-declined tradeoff).
- Any test of the mid-product-creation-flow bounce — remains a known, undressed gap per the story's own Out of Scope section.
- Load/concurrency testing of the Redis fallback path — not a stated NFR for this narrow fix.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No live-Upstash-Redis integration test (only the stub adapter) | Matches this repo's own established `check-p3.2-redis-session-adapter.js` precedent — no test in this repo connects to a real Upstash instance | The stub adapter's `readSession` signature is verified to match `session-redis.js`'s real `client.get()`-based implementation by direct code inspection at implementation time; the real fallback was additionally verified live on `wuce-staging` post-deploy (see decisions.md), the same "verify in production after the mock-only test suite" pattern already used for tmc-s1's own bulk-assign SQL fix this session |
