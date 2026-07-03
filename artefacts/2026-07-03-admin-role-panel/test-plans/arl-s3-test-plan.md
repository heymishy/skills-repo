## Test Plan: arl-s3 — Admin credits page: view all balances and submit top-up

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s3.md
**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Test plan author:** Claude Sonnet 4.6 (/test-plan skill)
**Date:** 2026-07-03

---

## Test runner

`node tests/check-arl-s3-admin-credits.js`

Add to `package.json` `scripts.test` chain: append `&& node tests/check-arl-s3-admin-credits.js` after `check-arl-s2-admin-middleware.js`. File location: `tests/check-arl-s3-admin-credits.js`.

Pattern: plain Node.js, CommonJS, `require('assert')`, same harness pattern as existing `check-*.js` files.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | GET /admin/credits renders HTML with all tenants and balances | 1 | 1 | — | — | — | 🟢 |
| AC2 | Page includes form per tenant with correct action and fields | 1 | — | — | — | — | 🟢 |
| AC3 | POST valid top-up: balance updated, 302 redirect to /admin/credits | 1 | 1 | — | — | — | 🟢 |
| AC4 | POST invalid amount: 400 returned, no balance change | 3 | — | — | — | — | 🟢 |
| AC5 | Non-admin GET /admin/credits: 403 | 1 | — | — | — | — | 🟢 |
| AC6 | Non-admin POST /api/admin/credits/adjust: 403 | 1 | — | — | — | — | 🟢 |
| AC7 | Keyboard navigation of credits page | — | — | — | 1 | CSS-layout-dependent | 🔴 |
| AC8 | tenantId not in credits table: 400, no balance change | 1 | — | — | — | — | 🟢 |
| AC9 | HTML escaping: tenantId with special chars escaped in response | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in automated tests | Handling |
|-----|----|----------|--------------------------------------|---------|
| Keyboard navigation and visual layout | AC7 | CSS-layout-dependent | Requires real browser to verify Tab/Enter/Space navigation across rendered forms | Manual scenario — see Scenario 7 in verification script 🔴 (RISK-ACCEPT per decisions.md ADR-004) |

---

## Test Data Strategy

**Source:** Synthetic — inline mock functions and in-memory state. No real DB.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock getAllTenantBalances returning [{tenantId:'t1',balance:10},{tenantId:'t2',balance:0}] | Synthetic | None | |
| AC2 | Same mock as AC1 | Synthetic | None | Check HTML structure |
| AC3 | Mock adjustBalance spy; mock getTenantIds returning ['t1']; amount=5; tenantId='t1' | Synthetic | None | |
| AC4 | Mock getTenantIds returning ['t1']; amount values: 0, -1, 'abc', '' | Synthetic | None | Four edge cases |
| AC5 | req.session with role='user' and userId=1 | Synthetic | None | requireAdmin tested separately in arl-s2 |
| AC6 | Same as AC5 | Synthetic | None | |
| AC7 | Deployed server in browser | Post-deploy | None | Manual only |
| AC8 | Mock getTenantIds returning ['t1']; POST body tenantId='unknown' | Synthetic | None | |
| AC9 | Mock getAllTenantBalances returning [{tenantId:'a<b>c',balance:5}] | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC7 requires a real browser. Handled as RISK-ACCEPT + manual smoke test (see decisions.md ADR-004 and Scenario 7 in verification script).

---

## Unit Tests

### GET /admin/credits renders HTML with tenant list

- **Verifies:** AC1
- **Precondition:** Injectable `getAllTenantBalances` wired to return `[{ tenantId: 'tenant-a', balance: 10 }, { tenantId: 'tenant-b', balance: 0 }]`. Admin session: `req.session = { userId: 1, role: 'admin' }`.
- **Action:** Call the GET `/admin/credits` handler with mock req/res. Read `res._body`.
- **Expected result:** `res._status === 200`. `res._body` contains the string `'tenant-a'` and `'tenant-b'` and `'10'` and `'0'`.
- **Edge case:** No.

### GET /admin/credits HTML includes form with correct action and field names

- **Verifies:** AC2
- **Precondition:** Same as AC1 setup.
- **Action:** Call the GET handler. Read `res._body`.
- **Expected result:** `res._body` contains `action="/api/admin/credits/adjust"` or `action="/api/admin/credits/adjust"`, `name="tenantId"`, `name="amount"`, and a submit button (`type="submit"` or `<button>`).
- **Edge case:** No.

### POST /api/admin/credits/adjust with valid data updates balance and redirects

- **Verifies:** AC3
- **Precondition:** `setGetTenantIds` (allowlist adapter) wired to return `['tenant-a']`. `setAdjustBalance` spy. `req.body = { tenantId: 'tenant-a', amount: '5' }`. Admin session.
- **Action:** Call the POST `/api/admin/credits/adjust` handler.
- **Expected result:** `adjustBalance` spy called with `('tenant-a', 5)`. `res._status === 302`. `res._headers.Location === '/admin/credits'`.
- **Edge case:** No.

### POST /api/admin/credits/adjust with amount=0 returns 400

- **Verifies:** AC4 (edge: zero)
- **Precondition:** `req.body = { tenantId: 'tenant-a', amount: '0' }`. Admin session.
- **Action:** Call the POST handler.
- **Expected result:** `res._status === 400`. `adjustBalance` NOT called.
- **Edge case:** Yes.

### POST /api/admin/credits/adjust with negative amount returns 400

- **Verifies:** AC4 (edge: negative)
- **Precondition:** `req.body = { tenantId: 'tenant-a', amount: '-5' }`. Admin session.
- **Action:** Call the POST handler.
- **Expected result:** `res._status === 400`. `adjustBalance` NOT called.
- **Edge case:** Yes.

### POST /api/admin/credits/adjust with non-numeric amount returns 400

- **Verifies:** AC4 (edge: non-numeric)
- **Precondition:** `req.body = { tenantId: 'tenant-a', amount: 'abc' }`. Admin session.
- **Action:** Call the POST handler.
- **Expected result:** `res._status === 400`. `adjustBalance` NOT called.
- **Edge case:** Yes.

### Non-admin GET /admin/credits returns 403

- **Verifies:** AC5
- **Precondition:** `req.session = { userId: 1, role: 'user' }`.
- **Action:** Call the GET `/admin/credits` handler with requireAdmin in the chain.
- **Expected result:** `res._status === 403`. `res._body` does not contain any tenant data.
- **Edge case:** No.

### Non-admin POST /api/admin/credits/adjust returns 403

- **Verifies:** AC6
- **Precondition:** `req.session = { userId: 1, role: 'user' }`. `req.body = { tenantId: 'tenant-a', amount: '5' }`.
- **Action:** Call the POST handler with requireAdmin in the chain.
- **Expected result:** `res._status === 403`. `adjustBalance` NOT called.
- **Edge case:** No.

### POST with unknown tenantId returns 400

- **Verifies:** AC8
- **Precondition:** `setGetTenantIds` wired to return `['tenant-a']` (allowlist). `req.body = { tenantId: 'unknown-tenant', amount: '5' }`. Admin session.
- **Action:** Call the POST handler.
- **Expected result:** `res._status === 400`. `adjustBalance` NOT called.
- **Edge case:** Yes — covers DB allowlist validation.

### GET /admin/credits HTML-escapes tenantId with special characters

- **Verifies:** AC9
- **Precondition:** `getAllTenantBalances` wired to return `[{ tenantId: 'a<b>c', balance: 5 }]`. Admin session.
- **Action:** Call the GET handler. Read `res._body`.
- **Expected result:** `res._body` contains `'a&lt;b&gt;c'` (HTML-escaped form). `res._body` does NOT contain the literal string `'a<b>c'` as raw HTML (i.e. no unescaped `<b>`).
- **Edge case:** Yes — XSS prevention check.

---

## Integration Tests

### POST handler reads body from req.body and calls adjustBalance with parsed integer

- **Verifies:** AC3 (integration — body parsing and integer coercion)
- **Components involved:** POST handler, adjustBalance adapter, allowlist adapter
- **Precondition:** `req.body = { tenantId: 'tenant-a', amount: '7' }`. Allowlist includes `'tenant-a'`. `adjustBalance` is a spy.
- **Action:** Call the POST handler.
- **Expected result:** `adjustBalance` called with `('tenant-a', 7)` — the integer 7, not the string `'7'`. `res._status === 302`.
- **Edge case:** No.

### GET handler reads from getAllTenantBalances and renders each row

- **Verifies:** AC1 (integration — data fetch to render pipeline)
- **Components involved:** GET handler, getAllTenantBalances adapter, HTML render function
- **Precondition:** `getAllTenantBalances` returns three tenants with varied balances.
- **Action:** Call the GET handler.
- **Expected result:** All three `tenantId` values and their balances appear in `res._body`. Each has its own form block.
- **Edge case:** No.

---

## NFR Tests

### GET /admin/credits returns within acceptable time (structure check)

- **NFR addressed:** Performance (NFR-PERF-1: under 2 seconds for up to 100 rows)
- **Measurement method:** This is enforced at the DB query level — a single SELECT with no N+1. Read `src/web-ui/routes/admin.js` (or equivalent) as a string. Assert that only one DB call is made per GET (no loop over tenants calling the DB per row).
- **Pass threshold:** One `getAllTenantBalances` call per GET request — no iteration calling `getBalance` per tenant.
- **Tool:** Code inspection + unit test (single spy call count assertion)

### POST /api/admin/credits/adjust validates amount server-side before any DB write

- **NFR addressed:** Security (NFR-SEC-2: server-side validation)
- **Measurement method:** Same as AC4 tests — assert that 400 is returned for invalid amounts before `adjustBalance` is called.
- **Pass threshold:** `adjustBalance` NOT called on any invalid input (0, negative, non-integer, empty). Already covered by AC4 unit tests; noted here as an NFR gate.
- **Tool:** Existing AC4 unit tests serve as the NFR evidence

---

## Out of Scope for This Test Plan

- Testing the visual appearance of the credits page (CSS, layout, colours) — not testable without a browser.
- Testing keyboard navigation (AC7) — RISK-ACCEPT, manual smoke test only.
- Testing the full HTTP lifecycle (request routing, session middleware, body parsing) — these are tested in existing server.js integration tests.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC7 — keyboard navigation | CSS-layout-dependent; requires real browser | RISK-ACCEPT (decisions.md ADR-004); manual smoke test in Scenario 7 of verification script marked 🔴 |
