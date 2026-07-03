## Test Plan: arl-s2 — Credits guard admin bypass and requireAdmin middleware

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s2.md
**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Test plan author:** Claude Sonnet 4.6 (/test-plan skill)
**Date:** 2026-07-03

---

## Test runner

`node tests/check-arl-s2-admin-middleware.js`

Add to `package.json` `scripts.test` chain: append `&& node tests/check-arl-s2-admin-middleware.js` after `check-arl-s1-user-roles.js`. File location: `tests/check-arl-s2-admin-middleware.js`.

Pattern: plain Node.js, CommonJS, `require('assert')`, same harness pattern as existing `check-*.js` files.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | admin role → creditsGuard calls next(), no 402 | 2 | — | — | — | — | 🟢 |
| AC2 | user role + 0 balance → 402 (M3 regression gate) | 1 | — | — | — | — | 🟢 |
| AC3 | userId + admin role → requireAdmin calls next() | 1 | — | — | — | — | 🟢 |
| AC4 | userId + user role → requireAdmin returns 403 | 1 | — | — | — | — | 🟢 |
| AC5 | no userId → requireAdmin returns 403 | 1 | — | — | — | — | 🟢 |
| AC6 | /admin/* routes gated by requireAdmin in server.js | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

No gaps. All ACs are automatable.

---

## Test Data Strategy

**Source:** Synthetic — inline mock functions, no external services.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — all test data created in setup.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock req with session.role = 'admin' | Synthetic | None | getBalance mock not called |
| AC2 | Mock req with session.role = 'user', mock getBalance returning 0 | Synthetic | None | M3 regression gate |
| AC3 | Mock req with session.userId = 1 and session.role = 'admin' | Synthetic | None | |
| AC4 | Mock req with session.userId = 1 and session.role = 'user' | Synthetic | None | |
| AC5 | Mock req with no session.userId | Synthetic | None | |
| AC6 | server.js source file | Code inspection | None | String presence check |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### creditsGuard calls next() immediately when session.role is 'admin'

- **Verifies:** AC1
- **Precondition:** `setGetBalance` (or equivalent injectable) wired to a spy that tracks calls. `req.session = { tenantId: 'heymishy', role: 'admin' }`.
- **Action:** Call `creditsGuard(req, res, next)` where `next` is a spy.
- **Expected result:** `next()` is called exactly once. `getBalance` spy is NOT called (balance check bypassed). `res._status` is `undefined` (no 402 written).
- **Edge case:** No.

### creditsGuard does not call next() when session.role is 'admin' even if balance spy would return 0

- **Verifies:** AC1 (negative — confirms bypass is not conditional on balance)
- **Precondition:** Same setup as above. `getBalance` wired to return 0 if called.
- **Action:** Call `creditsGuard(req, res, next)`.
- **Expected result:** `next()` called. `getBalance` NOT called. No 402 response.
- **Edge case:** Yes — confirms bypass is unconditional.

### creditsGuard returns 402 when session.role is 'user' and balance is 0

- **Verifies:** AC2 (M3 regression gate — this test must pass on every build)
- **Precondition:** `setGetBalance` wired to return `0`. `req.session = { tenantId: 'test-user', role: 'user' }`.
- **Action:** Call `creditsGuard(req, res, next)`.
- **Expected result:** `res._status === 402`. `next` is NOT called. Response body is `{ "error": "Insufficient credits", "topUpUrl": "/settings/billing" }`.
- **Edge case:** No.

### requireAdmin calls next() when userId and role are both admin

- **Verifies:** AC3
- **Precondition:** `req.session = { userId: 1, role: 'admin' }`.
- **Action:** Call `requireAdmin(req, res, next)`.
- **Expected result:** `next()` called exactly once. `res._status` is `undefined`.
- **Edge case:** No.

### requireAdmin returns 403 when role is 'user' (authenticated but non-admin)

- **Verifies:** AC4
- **Precondition:** `req.session = { userId: 1, role: 'user' }`.
- **Action:** Call `requireAdmin(req, res, next)`.
- **Expected result:** `res._status === 403`. `next` NOT called.
- **Edge case:** No.

### requireAdmin returns 403 when no userId (unauthenticated)

- **Verifies:** AC5
- **Precondition:** `req.session = {}` (no userId, no role).
- **Action:** Call `requireAdmin(req, res, next)`.
- **Expected result:** `res._status === 403`. `next` NOT called.
- **Edge case:** Yes — tests that unauthenticated sessions cannot bypass the admin gate by omitting role.

---

## Integration Tests

### server.js mounts requireAdmin before /admin route handlers

- **Verifies:** AC6
- **Components involved:** `server.js` route registration block
- **Precondition:** `server.js` source file readable.
- **Action:** Read `src/web-ui/server.js` as a string. Locate the `/admin` route registration. Assert that `requireAdmin` appears in the routing chain for `/admin` paths, before any admin route handler function.
- **Expected result:** String `requireAdmin` is present in the same routing block as paths matching `/admin`. The middleware is applied before any handler that reads from the DB or renders HTML.
- **Edge case:** No.

---

## NFR Tests

### creditsGuard bypass uses strict equality ('admin' only)

- **NFR addressed:** Correctness (NFR-CORRECT-1: strict equality check)
- **Measurement method:** Read `src/web-ui/middleware/credits-guard.js` as a string. Assert that the bypass condition uses `=== 'admin'` (strict equality), not `== 'admin'` (loose), not a truthy check (`if (role)`), and not a prefix or includes check.
- **Pass threshold:** `=== 'admin'` present in the bypass branch; no loose equality or truthy check.
- **Tool:** Node.js string search (regex: `/=== ['"]admin['"]/`)

### requireAdmin checks both userId and role

- **NFR addressed:** Security (NFR-SEC-1: dual-field check)
- **Measurement method:** Read `src/web-ui/middleware/require-admin.js` as a string. Assert that both `req.session.userId` (or `session.userId`) AND `req.session.role` (or `session.role`) are referenced in the guard condition. A file that only checks role without userId would pass a request that lacks authentication.
- **Pass threshold:** Both `userId` and `role` appear as guard conditions before `next()` is called. Neither alone is sufficient.
- **Tool:** Node.js string search

---

## Out of Scope for This Test Plan

- Testing the full HTTP request/response cycle for admin routes (that is arl-s3's scope).
- Testing that role is loaded correctly from the DB (that is arl-s1's scope).
- Testing credits balance logic beyond the 0-balance case (existing lab-s3.3 tests cover other balance scenarios).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All ACs fully covered by unit and integration tests | — |
