# DoR Contract: Fix admin credits top-up rejecting a genuinely brand-new tenant via a circular "known tenant" definition

**Story reference:** artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/stories/catc-s1.md
**Test plan reference:** artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/test-plans/catc-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. Change `getValidTenantIds()` in `src/web-ui/modules/credits.js` to query `users.email`, `team_memberships.tenant_id`, and `credits.tenant_id` concurrently (via `Promise.all` against the same adapter wired by `setCreditsAdapter`), and return the de-duplicated union of all three as an array of strings.
2. New test file `tests/check-catc-s1-admin-topup-tenant-check-fix.js` — a fake-DB test proving RED against the current code and GREEN against the fix for: `users`-only tenant admission (AC1), rejection of a tenantId in none of the 3 tables (AC2), no regression for an existing `credits`-only tenant (AC3), `team_memberships`-only tenant admission (AC4), and de-duplicated union correctness (AC5).
3. Attempt a real deploy to `wuce-staging` via `flyctl deploy` and verify the actual admin top-up flow; report honestly whether `a3`/`a4`/`b1`'s previously-skipping ACs now run for real.

**What will NOT be built:**
- No change to `adjustBalance`, `adjustBalanceWithAudit`, `getAllTenantBalances`, or `getAuditLog`.
- No change to `adminCreditsPost`'s validation order, CSRF guard, or `requireAdmin`.
- No change to `users` or `team_memberships` table schema (both already exist).
- No change to `tests/e2e/fixtures/admin-credits-topup.js` or the `a3`/`a4`/`b1` spec files themselves.
- No weakening of the allowlist to accept any syntactically-valid string.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1 | unit |
| AC2 | UT2 | unit |
| AC3 | UT3 | unit |
| AC4 | UT4 | unit |
| AC5 | UT5 | unit |
| AC6 | IT1 (full regression pass) | integration |

**Assumptions:**
- `users` and `team_memberships` tables are already migrated (`CREATE TABLE IF NOT EXISTS`) unconditionally at server startup whenever `DATABASE_URL` is set (confirmed: `src/web-ui/server.js`), so no environment exists where `credits` is present but `users`/`team_memberships` are absent.
- `flyctl` is available and authenticated in this environment (confirmed at verification time: `flyctl auth whoami` succeeded, most recent `wuce-staging` release was several hours old with no sign of concurrent activity). A deploy is attempted; if it fails or cannot complete within this session, this is reported as a pending follow-up, not a false success.
- The e2e-test-admin identity's own admin-role provisioning on `wuce-staging` (a separate, already-documented human-operator action per `tests/e2e/fixtures/admin-credits-topup.js`'s header comment) is outside this story's control; E2E1's real-world result is reported honestly regardless of whether that precondition happens to already be satisfied.

**Estimated touch points:**
Files: `src/web-ui/modules/credits.js`, `tests/check-catc-s1-admin-topup-tenant-check-fix.js` (new)
Services: `wuce-staging` (Fly.io) — deploy only, no schema/config change
APIs: None

---

## Contract Review

Reviewed against all 6 story ACs and the test plan's AC Coverage table:

- AC1 ↔ verified by UT1 — ✅ aligned.
- AC2 ↔ verified by UT2 — ✅ aligned.
- AC3 ↔ verified by UT3 — ✅ aligned.
- AC4 ↔ verified by UT4 — ✅ aligned.
- AC5 ↔ verified by UT5 — ✅ aligned.
- AC6 ↔ verified by IT1 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

(See `catc-s1-dor.md` for the full table — duplicated here per template convention.)

**All hard blocks pass**, with H-NFR/H-NFR-profile and H-GOV recorded as RISK-ACCEPTs, consistent with this repo's established short-track precedent (`cuf-s1`).

---

## Sign-off

**Oversight level:** High.
**Scope confirmation:** This fix is scoped narrowly to `getValidTenantIds()`'s query source in `src/web-ui/modules/credits.js` only — it is explicitly not a broader tenant/account model rewrite, does not introduce a new unified tenants table, and does not touch `adjustBalance`/`adjustBalanceWithAudit` (already fixed by `cuf-s1`) or any other validation logic in `admin-credits.js`.
**Sign-off required:** No — matches this repo's established short-track precedent.
**Signed off by:** Claude (agent, autonomous, short-track), 2026-07-23 — root cause independently confirmed by reading `admin-credits.js`, `credits.js`, `migrate-schema-users.js`, `migrate-schema-credits.js`, `user-roles.js`, `auth-email.js`, `auth.js`, `billing.js`, `server.js`'s startup migration wiring, and `artefacts/2026-07-23-credits-upsert-fix/decisions.md`'s GAP entry.
