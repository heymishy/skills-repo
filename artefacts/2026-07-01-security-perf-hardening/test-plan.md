# Test Plan — Security and Performance Hardening

**Feature slug:** 2026-07-01-security-perf-hardening
**Story:** sec-perf — Five targeted security and performance fixes
**Author:** Claude Sonnet 4.6 — 2026-07-01
**Short-track:** test-plan → DoR → implementation

---

## Scope

Five fixes identified by codebase audit, in implementation order:

1. **Rate limiting on SSE turn endpoint** — `handlePostTurnStreamHtml` has no rate limit; an authenticated user can fire unlimited concurrent Anthropic API calls
2. **`KEYS` → `SCAN` in Redis startup** — `session-redis.js` `loadAllSessions` uses `KEYS` (O(N), blocks Redis server during scan); must use `SCAN` with cursor
3. **`returnTo` open redirect bypass** — `/^\//.test(returnTo)` allows `//evil.com`; browsers follow double-slash as protocol-relative URL
4. **Early return before artefact I/O in `handleGetJourneyResume`** — Postgres + disk artefact reads fire even when the session is already in memory and a redirect is imminent
5. **Session fixation on login** — session ID not rotated after OAuth callback; pre-auth session ID carries over with the new token

---

## Test strategy

Node.js unit tests only — no browser, no live Redis or Anthropic dependency. All external adapters replaced with stubs. Each fix has its own test file.

---

## Test files and acceptance criteria

### `tests/check-sec1-sse-rate-limit.js` — AC1

| AC | Description | Assertion |
|----|-------------|-----------|
| AC1a | Requests within limit pass through | Handler called; no 429 |
| AC1b | Exceeding limit (>30/min per tenant) returns 429 | `res._status === 429` |
| AC1c | Different tenants have independent counters | Tenant A at limit does not block tenant B |

Rate: 30 requests per 60-second window per tenant. Existing `createRateLimiter` middleware, wired at `server.js` route registration.

### `tests/check-sec2-redis-scan.js` — AC2

| AC | Description | Assertion |
|----|-------------|-----------|
| AC2a | `loadAllSessions` calls `scan` not `keys` | Stub asserts `scan` called, `keys` not called |
| AC2b | Paginates when cursor non-zero | Two-page result returns all sessions from both pages |
| AC2c | Empty result set returns `[]` | Zero keys → empty array, no error |

### `tests/check-sec3-return-to.js` — AC3

| AC | Description | Assertion |
|----|-------------|-----------|
| AC3a | `/journey/foo/resume` → honoured | Redirects to the stored path |
| AC3b | `//evil.com` → falls back to `/dashboard` | Location is `/dashboard` |
| AC3c | `https://evil.com` → falls back to `/dashboard` | Location is `/dashboard` |
| AC3d | Empty string → falls back to `/dashboard` | Location is `/dashboard` |
| AC3e | `null`/`undefined` → falls back to `/dashboard` | Location is `/dashboard` |

### `tests/check-sec4-early-return.js` — AC4

| AC | Description | Assertion |
|----|-------------|-----------|
| AC4a | Session in memory → redirects before Postgres call | Postgres artefact read stub never called |
| AC4b | Session missing from memory → Postgres call happens | Postgres artefact read stub called |
| AC4c | Session in memory but done → Postgres call happens (needs new session) | Postgres artefact read stub called |

### `tests/check-sec5-session-rotation.js` — AC5

| AC | Description | Assertion |
|----|-------------|-----------|
| AC5a | After login, `req.sessionId` is a new ID | Pre-login and post-login session IDs differ |
| AC5b | Old session is deleted from store | Old ID no longer in `_sessions` after rotation |
| AC5c | New session carries over all data from old session | `login`, `tenantId`, `accessToken` present on new session |
| AC5d | `Set-Cookie` header set with new session ID | Response header contains the new ID |
| AC5e | Old session deleted from Redis | Redis `deleteSession` called with old ID |

---

## NFRs

- Rate limit is per-tenant (falls back to IP when tenantId absent)
- Rate limit failures return JSON `{ "error": "..." }` with status 429 — not an SSE stream
- `SCAN` uses `count: 100` hint per page to bound per-request Redis cost
- `returnTo` validation must not use regex — use `startsWith` for clarity and auditability
- Session rotation must copy all session fields before deleting old session to avoid data loss
- Session rotation fires even when Redis is not configured (in-memory only path must work)

---

## Files touched

| File | Fix |
|------|-----|
| `src/web-ui/server.js` | AC1: wire rate limiter to SSE turn route |
| `src/web-ui/adapters/session-redis.js` | AC2: replace `keys` with `scan` loop |
| `src/web-ui/routes/auth.js` | AC3: harden `returnTo` check; AC5: call `rotateSessionId` |
| `src/web-ui/routes/journey.js` | AC4: move in-memory check before priorArtefacts load |
| `src/web-ui/middleware/session.js` | AC5: add `rotateSessionId` export |
