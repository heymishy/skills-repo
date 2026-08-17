# Definition of Done: Audit trail for admin credit adjustments

**PR:** https://github.com/heymishy/skills-repo/pull/473 | **Merged:** 2026-07-14 (commit 75a66871). Note: the task brief for this backlog-pass entry cited PR #556, but git log confirms #556 is `cuf-s1` (2026-07-23) — a later, unrelated fix that converted `adjustBalance`/`adjustBalanceWithAudit` to an atomic upsert. arl-s5 itself merged via #473.
**Story:** artefacts/2026-07-03-admin-role-panel/stories/arl-s5.md
**Test plan:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s5-test-plan.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (one audit row written with tenant_id/admin_id/delta/balance_before/balance_after/created_at) | ✅ | T1 "adminCreditsPost: writes one credit_audit_log row with tenant_id/admin_id/delta/balance_before/balance_after"; T10 "adminCreditsPost -> adjustBalanceWithAudit integration: one UPDATE...RETURNING + one INSERT per request" | Automated unit + integration test, re-run fresh 2026-08-17 | None |
| AC2 (balance_after - balance_before === delta) | ✅ | T2 "adjustBalanceWithAudit: balance_after - balance_before === delta for deltas 5, 50, 1" (table-driven) | Automated unit test | None |
| AC3 (two admins, two tenants -- correct per-actor attribution, no cross-contamination) | ✅ | T3 "adjustBalanceWithAudit + getAuditLog: per-actor correctness across two admins/tenants" -- asserts `logA[0].admin_id === 'alice'`, `logB[0].admin_id === 'bob'`, and `notStrictEqual` between the two | Automated test (D37-style behavioural wiring check, not just "an insert happened") | None |
| AC4 (invalid amount or unknown tenantId -> HTTP 400, no audit row) | ✅ | T4 "adminCreditsPost: invalid amounts never write to credit_audit_log" (0/-5/abc/empty); T5 "adminCreditsPost: unknown tenantId never writes to credit_audit_log" | Automated test | None |
| AC5 (credit_audit_log created idempotently in server.js migration block) | ✅ | T6 "server.js: CREATE TABLE IF NOT EXISTS credit_audit_log present with required columns" -- asserts presence of `tenant_id`, `admin_id`, `delta`, `balance_before`, `balance_after`, `created_at` | Code inspection test | None |
| AC6 (wiring correctness -- retrieved row matches actual adjustment per admin/tenant) | ✅ | T3 (see above); T7 "adjustBalanceWithAudit + getAuditLog: retrieved row matches actual adjustment" -- round trip via the real `setCreditsAdapter`-wired path | Automated test | None |
| AC7 (admin_id is req.session.login/userId, never raw accessToken) | ✅ | T8 "adminCreditsPost: accessToken never appears in admin_id or any audit INSERT param" (negative assertion against a live secret-shaped token value); T9 "adminCreditsPost: admin_id falls back to stringified userId when login is missing" | Automated test | None |

---

## Scope Deviations

None. The story's own Out of Scope section names five explicitly deferred items (audit-log viewer UI/route, auditing `GET /admin/credits`, retention/archival/pagination, auditing non-credit admin actions, alerting) -- none of these were built, consistent with the story text; these are accepted exclusions, not gaps.

---

## Test Plan Coverage

**`check-arl-s5-credit-audit-log.js`: 12 passed, 0 failed** (freshly re-run 2026-08-17). All 12 tests (T1-T12) map 1:1 to the test plan's Unit/Integration/NFR sections; T12 additionally guards against regression to arl-s3's existing `adjustBalance`/`getAllTenantBalances`/`getValidTenantIds` exports. No coverage gaps -- the test plan itself records "None. All ACs are testable via mock DB adapter... no CSS-layout-dependent or browser-only ACs in this story."

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|-----------|---------|
| Immutability (no UPDATE/DELETE against `credit_audit_log`) | ✅ | Targeted grep of `credits.js`/`admin-credits.js`/`server.js` for `UPDATE credit_audit_log` / `DELETE FROM credit_audit_log` returned zero matches (re-verified 2026-08-17) |
| Integrity (balance_before/balance_after captured atomically via `RETURNING`, not read-then-write) | ✅ | T11 "credits.js source: adjustBalanceWithAudit query includes RETURNING balance" |
| Security (no credential leakage -- admin_id never the raw accessToken) | ✅ | T8, T9 (see AC7 above) |
| Performance (single additional INSERT per adjustment, no N+1) | ✅ | T10 asserts exactly one UPDATE...RETURNING call and one INSERT call per request |

---

## Metric Signal

The story's own Benefit Linkage section states this explicitly is "Not tied to a numeric M-metric target (M1-M3 in `pipeline-state.json` cover admin bypass and top-up UI speed, not audit coverage)" and defines success as binary (every successful adjustment produces exactly one retrievable, correctly-attributed audit row). No benefit-metric artefact is referenced by this story for audit coverage specifically, and none was found covering it -- this is expected per the story's own text, not a gap.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None.

---

## DoD Observations

`cuf-s1` (PR #556, 2026-07-23) later changed `adjustBalance`/`adjustBalanceWithAudit` from a plain `UPDATE...RETURNING` to an atomic upsert (`INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING`) to fix a separate first-time-tenant provisioning defect; all 12 arl-s5 tests still pass against the current code, confirming no regression to the audit trail from that later change. ~5 weeks live as of this assessment, no incidents reported.
