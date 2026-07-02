# Definition of Ready — sec-perf

**Feature:** 2026-07-01-security-perf-hardening
**Story ID:** sec-perf
**Story title:** Security and performance hardening (5 fixes)
**Sign-off date:** 2026-07-01
**Signed off by:** Hamish King

---

## Story

**As a** platform operator,
**I want** the web UI to rate-limit model API calls, use safe Redis scan patterns, block open redirect attacks, avoid unnecessary I/O on session resume, and rotate session IDs on login,
**So that** the platform is resistant to abuse, credential-fixation attacks, and open-redirect exploitation, and resumes are fast for the common case.

---

## Acceptance criteria

**AC1 — SSE rate limit:** `handlePostTurnStreamHtml` is protected by `createRateLimiter({ maxRequests: 30, windowMs: 60000 })`. Requests beyond 30/minute per tenant return 429 JSON before any Anthropic API call is made. Different tenants have independent counters.

**AC2 — Redis SCAN:** `loadAllSessions` in `session-redis.js` uses `client.scan` with cursor-based pagination (count hint: 100) instead of `client.keys`. The loop continues until cursor returns to `'0'`.

**AC3 — returnTo hardening:** The `returnTo` check in `handleAuthCallback` uses `returnTo.startsWith('/') && !returnTo.startsWith('//')` (string methods, no regex). Values that fail the check fall back to `/dashboard`. This blocks `//evil.com` protocol-relative redirect.

**AC4 — Early return on in-memory session:** In `handleGetJourneyResume`, the check for an in-memory active session is performed before the Postgres and disk artefact reads. A redirect is issued immediately when the session is found in memory. The artefact I/O only runs when the Redis restore path or new session creation is needed.

**AC5 — Session fixation rotation:** A `rotateSessionId(oldId, res)` function is added to `session.js`. It creates a new session, copies all data from the old session, deletes the old session (in-memory and Redis), and sets a `Set-Cookie` header with the new ID. `handleAuthCallback` calls it after successful token exchange and before `persistSession`.

---

## Contract

### In scope
- `src/web-ui/server.js` — rate limiter wiring (AC1)
- `src/web-ui/adapters/session-redis.js` — SCAN (AC2)
- `src/web-ui/routes/auth.js` — returnTo + session rotation (AC3, AC5)
- `src/web-ui/routes/journey.js` — early return (AC4)
- `src/web-ui/middleware/session.js` — `rotateSessionId` (AC5)

### Out of scope
- Distributed rate limiting (Redis-backed) — current in-memory limiter is RISK-ACCEPTed for single-instance (p4.1 W1)
- CSRF tokens on POST endpoints — separate story
- Session ID rotation on privilege escalation (tenant change) — deferred

### Must NOT touch
- `src/web-ui/adapters/skill-session-redis.js`
- `src/enforcement/`
- Any SKILL.md files

---

## DoR checklist

- [x] All 5 ACs are specific and independently testable
- [x] Test plan written: `artefacts/2026-07-01-security-perf-hardening/test-plan.md`
- [x] Injectable adapter rule (D37) satisfied: rate limiter uses existing `createRateLimiter` pattern already established in `sign-off.js`
- [x] `rotateSessionId` must copy data BEFORE deleting old session (order enforced by implementation)
- [x] `returnTo` check uses `startsWith` — not regex — for auditability
- [x] SCAN cursor loop correctly terminates when cursor === '0' (string comparison)

---

## Coding agent instructions

Implement in AC order. Each fix has its own test file. Run all test files after each fix before proceeding to the next. No fix should break existing tests.
