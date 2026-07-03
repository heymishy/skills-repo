## Test Plan: arl-s1 — Create user_roles DB table and load role into session for all auth paths

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s1.md
**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Test plan author:** Claude Sonnet 4.6 (/test-plan skill)
**Date:** 2026-07-03

---

## Test runner

`node tests/check-arl-s1-user-roles.js`

Add to `package.json` `scripts.test` chain: append `&& node tests/check-arl-s1-user-roles.js` before the final entry in the chain. File location: `tests/check-arl-s1-user-roles.js`.

Pattern: plain Node.js, CommonJS, `require('assert')`, custom `test(name, fn)` harness (same pattern as existing check-*.js files). Exit code 1 on any failure.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Migration creates user_roles table idempotently | 1 | 1 | — | — | — | 🟢 |
| AC2 | GitHub OAuth: admin tenantId → session.role = 'admin' | 2 | — | — | — | — | 🟢 |
| AC3 | GitHub OAuth: no row → session.role = 'user' | 1 | — | — | — | — | 🟢 |
| AC4 | Email auth: matching row → session.role from DB | 1 | — | — | — | — | 🟢 |
| AC5 | Google OAuth: matching row → session.role from DB | 1 | — | — | — | — | 🟢 |
| AC6 | Adapter stub throws when not wired | 1 | — | — | — | — | 🟢 |
| AC7 | Production wiring: setGetUserRole wired in server.js | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

No gaps. All ACs are automatable via unit or integration tests.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — all test data is created in test setup functions.
**Owner:** Self-contained — tests generate their own data in setup/teardown.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Migration SQL string | Code inspection of server.js startup block | None | Check string presence, not DB execution |
| AC2 | Mock getUserRole returning 'admin' for tenantId 'heymishy' | Synthetic | None | |
| AC3 | Mock getUserRole returning null/undefined (no row) | Synthetic | None | Default fallback tested |
| AC4 | Mock getUserRole returning 'user' for email tenantId | Synthetic | None | |
| AC5 | Mock getUserRole returning 'admin' for Google sub tenantId | Synthetic | None | |
| AC6 | Adapter module loaded without wiring | Synthetic | None | |
| AC7 | server.js source code | Code inspection | None | Check that setGetUserRole is called in startup |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### getUserRole throws when adapter not wired

- **Verifies:** AC6
- **Precondition:** Role adapter module loaded fresh (cache cleared). `setGetUserRole` has not been called.
- **Action:** Call `getUserRole('any-tenant')`.
- **Expected result:** Throws `Error` with message containing `'Adapter not wired: getUserRole'`.
- **Edge case:** No.

### getUserRole returns value after setGetUserRole wired

- **Verifies:** AC7 (partial — unit half)
- **Precondition:** `setGetUserRole` called with a synchronous function that returns `'admin'`.
- **Action:** Call `getUserRole('heymishy')`.
- **Expected result:** Resolves to `'admin'` without throwing.
- **Edge case:** No.

### handleAuthCallback sets session.role to 'admin' for admin tenantId

- **Verifies:** AC2
- **Precondition:** `setGetUserRole` wired to return `'admin'` when `tenantId === 'heymishy'`. Mock `req.session = { tenantId: 'heymishy' }`. Mock GitHub user object `{ id: 1, login: 'heymishy' }`.
- **Action:** Call `handleAuthCallback` (or the role-loading helper it delegates to) with the mock session.
- **Expected result:** `req.session.role === 'admin'` after the call completes.
- **Edge case:** No.

### handleAuthCallback sets session.role to 'user' when no row in user_roles

- **Verifies:** AC3
- **Precondition:** `setGetUserRole` wired to return `null` (simulating no row). Mock `req.session = { tenantId: 'unknown-user' }`.
- **Action:** Call the role-loading helper with the mock session.
- **Expected result:** `req.session.role === 'user'` (default applied).
- **Edge case:** No.

### Email auth callback sets session.role from DB row

- **Verifies:** AC4
- **Precondition:** `setGetUserRole` wired to return `'user'` for email `'test@example.com'`. Mock `req.session = { tenantId: 'test@example.com' }`.
- **Action:** Call the role-loading helper with the mock session.
- **Expected result:** `req.session.role === 'user'`.
- **Edge case:** No.

### Google OAuth callback sets session.role from DB row

- **Verifies:** AC5
- **Precondition:** `setGetUserRole` wired to return `'admin'` for Google sub `'google-sub-123'`. Mock `req.session = { tenantId: 'google-sub-123' }`.
- **Action:** Call the role-loading helper with the mock session.
- **Expected result:** `req.session.role === 'admin'`.
- **Edge case:** No.

---

## Integration Tests

### Migration SQL contains CREATE TABLE IF NOT EXISTS user_roles

- **Verifies:** AC1 (partial — structure check)
- **Components involved:** `server.js` startup migration block
- **Precondition:** `server.js` source file readable.
- **Action:** Read `src/web-ui/server.js` as a string. Check for the presence of `CREATE TABLE IF NOT EXISTS user_roles`.
- **Expected result:** The string is present. Also check for `tenant_id VARCHAR PRIMARY KEY` and `role VARCHAR NOT NULL DEFAULT 'user'` in the same SQL block.
- **Edge case:** No.

### server.js calls setGetUserRole before starting HTTP server

- **Verifies:** AC7 (wiring check)
- **Components involved:** `server.js` startup sequence
- **Precondition:** `server.js` source file readable.
- **Action:** Read `src/web-ui/server.js` as a string. Check for the presence of `setGetUserRole(` before the `createServer(` call or `listen(` call.
- **Expected result:** `setGetUserRole(` appears in the file, confirming the adapter is wired. The call must appear before any route handler registration or server start.
- **Edge case:** No.

### handleAuthCallback or role-loading helper calls getUserRole with req.session.tenantId

- **Verifies:** AC2, AC3 (integration — correct field used)
- **Components involved:** `auth.js` handleAuthCallback, getUserRole adapter
- **Precondition:** `setGetUserRole` replaced with a spy that records the `tenantId` argument it receives. Mock session with `tenantId: 'heymishy'`.
- **Action:** Call `handleAuthCallback` with a mock req/res and stub OAuth exchange.
- **Expected result:** The spy is called with `'heymishy'`. `req.session.role` is set to whatever the spy returns.
- **Edge case:** No.

---

## NFR Tests

### Role load failure propagates — session.role not set on DB error

- **NFR addressed:** Correctness (NFR-CORRECT-1: if DB query fails, error must propagate; session must not be saved with incorrect role)
- **Measurement method:** Wire `setGetUserRole` to throw `new Error('DB connection failed')`. Call the role-loading helper. Assert error is thrown (or propagated to next(err)) and `req.session.role` is not set to any value.
- **Pass threshold:** `req.session.role` is `undefined` after the call; the error is rethrown or passed to `next(err)`.
- **Tool:** Node.js assert

### getUserRole response does not come from request input

- **NFR addressed:** Security (NFR-SEC-1: role must not be accepted from user-supplied input)
- **Measurement method:** Read `src/web-ui/routes/auth.js` and `src/web-ui/routes/auth-email.js` as strings. Assert that neither file reads `req.body.role`, `req.query.role`, or `req.headers.role` to set `req.session.role`.
- **Pass threshold:** Zero matches for `req.body.role`, `req.query.role`, `req.headers.role` setting `req.session.role` in either file.
- **Tool:** Node.js string search (`includes` / regex)

---

## Out of Scope for This Test Plan

- Testing actual Postgres database migration (no real DB in CI — migration SQL is verified by code inspection).
- Testing Google OAuth token exchange or GitHub OAuth token exchange (external service — not in scope).
- Testing `req.session.role` persistence across multiple requests (session store behaviour — outside this story's scope).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real DB migration execution (AC1) | No live DB in CI | SQL string verified by code inspection; real execution verified by post-deploy smoke test (arl-s1-verification.md Scenario 1) |
| Three separate auth path integration flows (AC2/AC4/AC5) | Each requires a full auth callback mock | Unit tests cover the role-loading helper directly; integration test confirms the helper is called from each auth path |
