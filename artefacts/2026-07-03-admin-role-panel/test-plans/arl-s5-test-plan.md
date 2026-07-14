## Test Plan: arl-s5 — Audit trail for admin credit adjustments

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s5.md
**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Test plan author:** Claude Sonnet 5 (/test-plan skill)
**Date:** 2026-07-11

---

## Test runner

`node tests/check-arl-s5-credit-audit-log.js`

Auto-discovered by `scripts/run-all-tests.js` (glob of `tests/check-*.js` — no `package.json` edit required per pcr-s1's dynamic-discovery mechanism).

Pattern: plain Node.js, CommonJS, `require('assert')`, same harness pattern as `tests/check-arl-s3-admin-credits.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Valid POST writes exactly one audit row with tenant_id/admin_id/delta/balance_before/balance_after/created_at | 1 | 1 | — | — | — | 🟢 |
| AC2 | balance_after - balance_before === delta | 1 | — | — | — | — | 🟢 |
| AC3 | Two different admins on two different tenants: audit rows correctly attributed, no cross-contamination | 1 | — | — | — | — | 🟢 |
| AC4 | Invalid amount or unknown tenantId: no audit row written | 2 | — | — | — | — | 🟢 |
| AC5 | credit_audit_log created idempotently in server.js migration block | 1 | — | — | — | Code inspection | 🟢 |
| AC6 | Wiring correctness: retrieved row matches actual adjustment per admin/tenant | 1 | 1 | — | — | — | 🟢 |
| AC7 | admin_id is login/userId, never raw accessToken | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs are testable via mock DB adapter injected through the existing `setCreditsAdapter` — no CSS-layout-dependent or browser-only ACs in this story (no UI is built).

---

## Test Data Strategy

**Source:** Synthetic — inline mock functions and in-memory state. No real DB.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock adapter: UPDATE...RETURNING balance returns {balance: N}; INSERT spy captures params | Synthetic | None | |
| AC2 | Same mock; assert balance_after - balance_before === delta across multiple deltas | Synthetic | None | Table-driven: delta 5, 50, 1 |
| AC3 | Mock adapter with per-tenant state map; two sequential adjustBalanceWithAudit calls with different adminId | Synthetic | None | |
| AC4 | req.session admin; body with amount=0/-1/'abc'/'' and tenantId='unknown' | Synthetic | None | Reuses arl-s3 validation paths |
| AC5 | server.js source read as string | Synthetic (code inspection) | None | |
| AC6 | Mock adapter simulating real UPDATE...RETURNING + SELECT round trip | Synthetic | None | |
| AC7 | req.session = { login: 'alice', accessToken: 'ghp_secret123', userId: 1 } | Synthetic | accessToken must never appear in admin_id | |

### PCI / sensitivity constraints

None. The one sensitivity check (AC7) is a negative assertion — the OAuth token must NOT appear in the persisted audit row.

### Gaps

None.

---

## Unit Tests

### Valid POST writes one audit row with correct fields

- **Verifies:** AC1
- **Precondition:** Admin session `{ userId: 1, login: 'alice', role: 'admin' }`. Mock DB: `SELECT tenant_id FROM` returns `['tenant-a']` (allowlist); `UPDATE credits ... RETURNING balance` returns `{ rows: [{ balance: 60 }] }`; `INSERT INTO credit_audit_log` spy captures params.
- **Action:** POST `tenantId=tenant-a&amount=10` to the adjust handler.
- **Expected result:** Exactly one INSERT into `credit_audit_log`. Captured params: `tenant_id='tenant-a'`, `admin_id='alice'`, `delta=10`, `balance_before=50`, `balance_after=60`. Response 302.
- **Edge case:** No.

### balance_after - balance_before equals delta across multiple amounts

- **Verifies:** AC2
- **Precondition:** Mock `UPDATE ... RETURNING balance` returns a controllable post-adjustment balance per test iteration.
- **Action:** Run three POSTs with `amount` = 5, 50, 1 against a mock that returns balances 15, 100, 3 respectively.
- **Expected result:** For each: `balance_after - balance_before === delta` (i.e. `balance_before` is derived as `balance_after - delta`, matching the atomic `RETURNING` design).
- **Edge case:** Yes — table-driven over 3 values.

### Two different admins on two different tenants produce correctly attributed audit rows

- **Verifies:** AC3, AC6
- **Precondition:** Mock adapter tracks per-tenant balance state and an in-memory audit log array. Admin A (`login: 'alice'`) adjusts `tenant-a` by +10. Admin B (`login: 'bob'`) adjusts `tenant-b` by +20.
- **Action:** Call `adjustBalanceWithAudit('tenant-a', 10, 'alice')` then `adjustBalanceWithAudit('tenant-b', 20, 'bob')` directly against `credits.js`. Then call `getAuditLog('tenant-a')` and `getAuditLog('tenant-b')`.
- **Expected result:** `getAuditLog('tenant-a')` returns a row with `admin_id === 'alice'` and `delta === 10`. `getAuditLog('tenant-b')` returns a row with `admin_id === 'bob'` and `delta === 20`. Neither log contains the other admin's or tenant's data (no cross-contamination).
- **Edge case:** Yes — this is the D37-style behavioural wiring assertion: two different people resolve to two different, individually-correct audit records, not merely "an insert happened."

### Invalid amount (zero/negative/non-numeric/empty) writes no audit row

- **Verifies:** AC4
- **Precondition:** Admin session. INSERT spy on `credit_audit_log`.
- **Action:** POST with `amount` = `'0'`, `'-5'`, `'abc'`, `''` (four sub-cases).
- **Expected result:** All four return HTTP 400. INSERT spy never called in any sub-case.
- **Edge case:** Yes — 4 sub-cases.

### Unknown tenantId writes no audit row

- **Verifies:** AC4
- **Precondition:** Admin session. Allowlist mock returns `['tenant-a']` only. INSERT spy on `credit_audit_log`.
- **Action:** POST `tenantId=unknown-tenant&amount=10`.
- **Expected result:** HTTP 400. INSERT spy never called.
- **Edge case:** Yes.

### server.js creates credit_audit_log idempotently in the existing migration block

- **Verifies:** AC5
- **Precondition:** Read `src/web-ui/server.js` as a string.
- **Action:** Search for `CREATE TABLE IF NOT EXISTS credit_audit_log` within the same function/block scope as the existing `credits` and `stripe_events` table creation (same `.then()`/`.catch()` auto-migration pattern).
- **Expected result:** String is present; uses `IF NOT EXISTS`; columns include `tenant_id`, `admin_id`, `delta`, `balance_before`, `balance_after`, `created_at`.
- **Edge case:** No.

### admin_id stores login, never the raw accessToken

- **Verifies:** AC7
- **Precondition:** `req.session = { userId: 1, login: 'alice', role: 'admin', accessToken: 'ghp_secretvalue123' }`. Mock DB captures INSERT params.
- **Action:** POST a valid top-up.
- **Expected result:** Captured `admin_id === 'alice'`. Captured `admin_id` does NOT equal `'ghp_secretvalue123'` and the string `'ghp_secretvalue123'` does not appear anywhere in the INSERT params.
- **Edge case:** Yes — negative/security assertion.

### admin_id falls back to userId when login is absent

- **Verifies:** AC7 (fallback path)
- **Precondition:** `req.session = { userId: 42, role: 'admin' }` (no `login` field).
- **Action:** POST a valid top-up.
- **Expected result:** Captured `admin_id === '42'` (stringified userId).
- **Edge case:** Yes.

---

## Integration Tests

### POST handler calls adjustBalanceWithAudit (not the old adjustBalance) with the parsed integer and resolved admin identity

- **Verifies:** AC1 (integration — handler to credits.js wiring)
- **Components involved:** POST handler (`admin-credits.js`), `adjustBalanceWithAudit` in `credits.js`, mock adapter
- **Precondition:** `req.body = { tenantId: 'tenant-a', amount: '7' }`, `req.session = { login: 'alice', role: 'admin' }`. Allowlist includes `'tenant-a'`.
- **Action:** Call the POST handler.
- **Expected result:** `adjustBalanceWithAudit` is invoked (verified via the DB spy: one UPDATE...RETURNING call and one INSERT INTO credit_audit_log call) with `tenantId='tenant-a'`, `delta=7`, `adminId='alice'`. Response 302.
- **Edge case:** No.

### Full round trip: adjust then retrieve via getAuditLog matches actual values

- **Verifies:** AC6
- **Components involved:** `adjustBalanceWithAudit`, `getAuditLog`, mock adapter with realistic UPDATE...RETURNING + SELECT behaviour
- **Precondition:** Mock adapter simulates a stateful `credits` balance of 100 for `tenant-a`.
- **Action:** Call `adjustBalanceWithAudit('tenant-a', 25, 'alice')`. Then call `getAuditLog('tenant-a')`.
- **Expected result:** The returned row has `balance_before === 100`, `balance_after === 125`, `delta === 25`, `admin_id === 'alice'`.
- **Edge case:** No.

---

## NFR Tests

### Audit write is atomic with the balance write (no separate read-then-write race)

- **NFR addressed:** Integrity — `balance_before`/`balance_after` captured via `UPDATE ... RETURNING balance`, not a prior `SELECT`.
- **Measurement method:** Code inspection of `credits.js`'s `adjustBalanceWithAudit`: assert the balance-adjusting query string contains `RETURNING balance` and that no `SELECT balance FROM credits` call precedes it in the same function.
- **Pass threshold:** Single `UPDATE ... RETURNING` statement supplies both the write and the post-write value used to derive `balance_before`.
- **Tool:** Code inspection + unit test (source string assertion)

### No credential values persisted

- **NFR addressed:** Security — `admin_id` never contains `accessToken`.
- **Measurement method:** Same as the AC7 unit test above.
- **Pass threshold:** `accessToken` value never appears in any INSERT param.
- **Tool:** Existing AC7 unit test serves as the NFR evidence

### Immutability — no UPDATE/DELETE against credit_audit_log anywhere in the diff

- **NFR addressed:** Immutability
- **Measurement method:** Code inspection — grep the diff (`credits.js`, `admin-credits.js`, `server.js`) for `UPDATE credit_audit_log` or `DELETE FROM credit_audit_log`.
- **Pass threshold:** Zero matches.
- **Tool:** Code inspection (manual grep at DoR/verification time, not a runtime test)

---

## Out of Scope for This Test Plan

- Testing a UI or route for viewing the audit log — none is built (see story Out of Scope).
- Load/volume testing of unbounded `credit_audit_log` growth — deferred with retention policy (Out of Scope).
- Testing audit of `GET /admin/credits` — only the POST/adjust path is audited.

---

## Test Gaps and Risks

None. No CSS-layout-dependent or browser-only ACs in this story.
