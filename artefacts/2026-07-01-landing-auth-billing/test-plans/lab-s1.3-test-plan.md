# Test Plan — lab-s1.3 — Multi-provider auth registry (GitHub primary)

**Story:** lab-s1.3
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s1.3-provider-registry.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. All provider fetch calls (GitHub user identity, token exchange) are monkeypatched via the injectable adapter (`setProviderAdapter()`). No real GitHub API calls in tests.

- Mock session objects are constructed inline in each test.
- `rotateSessionId` (from `src/web-ui/middleware/session.js`) is monkeypatched to track call count.
- `authGuard` tests inject mock sessions directly.
- Regression check (`check-wuce1-oauth-flow.js`) is run as a child process in AC7.

**PCI/sensitivity:** None — no real tokens, no real user data.

**Test data gaps:** None.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | GitHub OAuth works after registry introduced | Integration | IT1.1, IT1.2 | None |
| AC2 | `rotateSessionId` called after every provider login | Unit | T2.1, T2.2 | None |
| AC3 | Pre-deploy sessions rejected after registry deployed | Unit | T3.1 | None |
| AC4 | `authGuard` uses `req.session.accessToken` | Unit | T4.1, T4.2 | None |
| AC5 | Default provider adapter stub throws | Unit | T5.1, T5.2 | None |
| AC6 | Production wiring verified in `server.js` | Unit | T6.1 | None |
| AC7 | No regression on `check-wuce1-oauth-flow.js` | Regression | R7.1 | None |

---

## Gap table

No gaps — all ACs are unit/integration testable without a real browser or real OAuth provider.

---

## E2E / browser-layout detection

No browser-layout-dependent ACs. No E2E tooling required.

---

## Unit tests

### T2 — `rotateSessionId` called after login (AC2)

**T2.1** — `rotate-session-id-called-on-github-callback-success`
Covers: AC2
Precondition: Provider adapter monkeypatched to return a valid user identity; `rotateSessionId` monkeypatched to a spy (tracks call count)
Action: Call the GitHub callback handler with a mock `req` (valid state, valid code)
Expected: `rotateSessionId` spy has been called exactly once; spy receives the pre-login session ID as argument
Edge case: If `rotateSessionId` is called before session population, log this as a finding — it must be called after session fields are set

**T2.2** — `new-session-cookie-set-after-rotation`
Covers: AC2 (Set-Cookie header)
Precondition: T2.1 setup
Action: Inspect `res.headers['set-cookie']` after callback handler runs
Expected: `set-cookie` header contains a `session_id=<new-value>` cookie (different from the pre-rotation session ID)
Edge case: Header may be set by the session middleware — verify it is present regardless of which layer sets it

### T3 — Session schema migration: pre-deploy sessions rejected (AC3)

**T3.1** — `old-session-structure-rejected-by-auth-guard`
Covers: AC3
Precondition: Mock session that lacks `req.session.accessToken` (simulates a pre-registry session — e.g. has only `req.session.token` or is missing fields entirely)
Action: Call `authGuard` with this pre-registry session mock
Expected: `authGuard` calls `res.redirect('/')` or returns 302 — the pre-registry session is not treated as authenticated
Edge case: Verify the guard reads `req.session.accessToken` specifically — a session with `req.session.token` set but no `req.session.accessToken` must be rejected

### T4 — `authGuard` uses canonical field (AC4)

**T4.1** — `auth-guard-allows-request-with-access-token`
Covers: AC4
Precondition: `req.session.accessToken` set to a non-empty string
Action: Call `authGuard` with mock req/res/next; check if `next()` is called
Expected: `next()` is called; `res.redirect` is not called
Edge case: none

**T4.2** — `auth-guard-rejects-request-with-only-session-token-field`
Covers: AC4 (canonical field enforcement)
Precondition: `req.session.token` set (legacy/wrong field); `req.session.accessToken` NOT set
Action: Call `authGuard`
Expected: `next()` is NOT called; redirect to `/` fires
Edge case: This test ensures the CLAUDE.md canonical field rule is enforced

### T5 — Default adapter stub throws (AC5)

**T5.1** — `default-provider-adapter-throws-on-get-user-identity`
Covers: AC5
Precondition: `src/web-ui/auth/oauth-adapter.js` (or equivalent provider registry) required fresh without calling `setProviderAdapter()`
Action: Call the default `getUserIdentity()` function (or equivalent)
Expected: Throws `Error` with message containing `Adapter not wired` and the adapter name
Edge case: Error must be thrown — not return `null` or `undefined`

**T5.2** — `default-provider-adapter-throws-on-exchange-code`
Covers: AC5
Precondition: Same as T5.1
Action: Call the default `exchangeCode()` function (or equivalent)
Expected: Throws `Error` with `Adapter not wired` message
Edge case: none

### T6 — Production wiring in `server.js` (AC6)

**T6.1** — `server-js-calls-set-provider-adapter-on-startup`
Covers: AC6
Precondition: `server.js` can be partially required in test mode (without binding to a port); or a startup log capture approach is used
Action: Require `server.js` in a test environment; capture log output or inspect module state post-require
Expected: The provider registry adapter is wired with a real implementation (not the throwing stub) — confirmed by calling `getUserIdentity()` and seeing it does not throw (or by verifying `setProviderAdapter` was called)
Edge case: `server.js` binds to a port — use `NODE_ENV=test` pattern that skips `app.listen()` if already implemented; otherwise require the routes module directly

---

## Integration tests

### IT1 — GitHub OAuth happy path end-to-end (AC1)

**IT1.1** — `github-oauth-full-flow-sets-session-fields`
Covers: AC1
Precondition: Mock provider adapter set up to return GitHub user identity (`{ login: 'testuser', id: 123 }`); state stored in session; `rotateSessionId` monkeypatched
Action: (1) Call `GET /auth/github` handler; capture state stored in session. (2) Call `GET /auth/github/callback` with matching state and code; capture session after
Expected: After callback, `req.session.accessToken` is set (non-empty), `req.session.userId` is set, `req.session.tenantId` is set, response is 302 to `/welcome` or `/dashboard`
Edge case: none

**IT1.2** — `github-oauth-sets-correct-canonical-field-names`
Covers: AC1, AC4
Precondition: IT1.1 scenario
Action: Inspect session fields after callback
Expected: `req.session.accessToken` is set; `req.session.token` is NOT set (or is undefined) — the canonical field name is used exclusively
Edge case: none

---

## NFR tests

**NFR1** — `access-token-not-written-to-redis`
Covers: NFR — `_sanitiseForRedis` strips `accessToken` before Redis write
Precondition: `session.js` `_sanitiseForRedis` function loaded; a mock session object containing `accessToken`
Action: Call `_sanitiseForRedis({ accessToken: 'secret', userId: '123', tenantId: 't1' })`
Expected: Returned object does NOT contain `accessToken` field; `userId` and `tenantId` are preserved
Edge case: Test the exact exported function — not a copy

---

## Regression

**R7.1** — `no-regression-on-check-wuce1-oauth-flow`
Covers: AC7
Precondition: Implementation of lab-s1.3 is complete
Action: Run `node tests/check-wuce1-oauth-flow.js` (as subprocess or directly)
Expected: Exit code 0; all previously passing assertions continue to pass; zero new failures
Edge case: If any test in check-wuce1 fails, this is a regression introduced by this story

---

## State update fields

- `totalTests`: 11
- `acTotal`: 7
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false
