## Definition of Ready: b3x-s1 — Extend the existing staging-cleanup script's matching pattern and table coverage

**Story:** artefacts/2026-08-09-e2e-cleanup-script-coverage-extension/stories/b3x-s1-cleanup-script-coverage-extension.md
**Review artefact:** artefacts/2026-08-09-e2e-cleanup-script-coverage-extension/review/b3x-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-e2e-cleanup-script-coverage-extension/test-plans/b3x-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `scripts/cleanup-e2e-staging-data.js` — broaden `isTaggedForE2E`; add `findEligibleJourneys`/`deleteJourneyRow`, `findEligibleCreditsRows`/`deleteCreditsRow`, `findEligibleTenantPlanRows`/`deleteTenantPlanRow`, `findEligibleUserRolesRows`/`deleteUserRolesRow`; wire all into `run()`.
- `tests/check-b3-cleanup-script.js` — extend `createMockDb` to seed/handle the new tables and query shapes; add new tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md` — the RISK entry stays as-is; the mechanism decision is not being revisited.
- Any of the 18 `tests/e2e/*.spec.js` files.
- Any `.github/workflows/*.yml` file.
- The CLI wrapper's flag parsing / `DATABASE_URL`/`STRIPE_SECRET_KEY` wiring.

### Architecture Constraints

No new architectural decision — extends the existing D37-injectable `db`/`stripe` adapter pattern already established in this exact script. No ADR required.

**Correctness note for the coding agent:** `credits`, `tenant_plan`, `user_roles` have no `created_at` column and are keyed one-row-per-tenant on `tenant_id` — do not attempt to add an age gate to these three; match by `tenant_id` pattern only, consistent with the story's Architecture Constraints. `journeys` (the new direct path) DOES have `created_at` and must stay age-gated, consistent with `users`/`products`.

### Human oversight

**Medium** — extends a script whose whole purpose is deleting real database rows; the review and test plan both weight the AC2/AC5 regression and false-positive-safety guarantees above typical short-track scrutiny, matching the original `b3-staging-test-data-cleanup` story's own oversight level.

### Coding Agent Instructions

1. In `scripts/cleanup-e2e-staging-data.js`, broaden `isTaggedForE2E`:
   ```javascript
   function isTaggedForE2E(value) {
     if (typeof value !== 'string') return false;
     return value.indexOf(TAG_PREFIX) === 0 || /@example\.test$/.test(value);
   }
   ```
2. Add journey handling (direct by `tenant_id`, not just via a matched product's cascade):
   ```javascript
   async function findEligibleJourneys(db, cutoff) {
     const result = await db.query(
       'SELECT journey_id, tenant_id, created_at FROM journeys WHERE created_at < $1',
       [cutoff]
     );
     return result.rows.filter(function(row) { return isTaggedForE2E(row.tenant_id); });
   }
   async function deleteJourneyRow(db, journey) {
     await db.query('DELETE FROM artefacts WHERE journey_id = $1', [journey.journey_id]);
     await db.query('DELETE FROM journeys WHERE journey_id = $1', [journey.journey_id]);
   }
   ```
3. Add `credits`/`tenant_plan`/`user_roles` handling (no age gate — see DoR correctness note):
   ```javascript
   async function findEligibleCreditsRows(db) {
     const result = await db.query('SELECT tenant_id, updated_at FROM credits', []);
     return result.rows.filter(function(row) { return isTaggedForE2E(row.tenant_id); });
   }
   async function deleteCreditsRow(db, row) {
     await db.query('DELETE FROM credits WHERE tenant_id = $1', [row.tenant_id]);
   }
   async function findEligibleTenantPlanRows(db) {
     const result = await db.query('SELECT tenant_id, updated_at FROM tenant_plan', []);
     return result.rows.filter(function(row) { return isTaggedForE2E(row.tenant_id); });
   }
   async function deleteTenantPlanRow(db, row) {
     await db.query('DELETE FROM tenant_plan WHERE tenant_id = $1', [row.tenant_id]);
   }
   async function findEligibleUserRolesRows(db) {
     const result = await db.query('SELECT tenant_id, role FROM user_roles', []);
     return result.rows.filter(function(row) { return isTaggedForE2E(row.tenant_id); });
   }
   async function deleteUserRolesRow(db, row) {
     await db.query('DELETE FROM user_roles WHERE tenant_id = $1', [row.tenant_id]);
   }
   ```
4. Wire all four into `run()`, following the exact same `eligible*`/`deleted*` collection pattern already used for `users`/`products`/`stripeCustomers`, and extend the returned `summary.eligible`/`summary.deleted` objects with `journeys`, `creditsRows`, `tenantPlanRows`, `userRolesRows` keys. Extend `_logDeletion`'s record-type strings accordingly (`'journey'`, `'creditsRow'`, `'tenantPlanRow'`, `'userRolesRow'`).
5. Extend `tests/check-b3-cleanup-script.js`'s `createMockDb(seed)`:
   - Add `journeys`, `artefacts`, `credits`, `tenant_plan`, `user_roles` to the seedable/trackable `tables` object (note: `journeys` and a `standard_product_optouts`-adjacent handling already exist for the product-cascade path — extend, do not duplicate, the existing `journeys` table entry).
   - Add query-pattern handlers for: `SELECT journey_id, tenant_id, created_at FROM journeys WHERE created_at < $1`, `SELECT tenant_id, updated_at FROM credits`, `SELECT tenant_id, updated_at FROM tenant_plan`, `SELECT tenant_id, role FROM user_roles`, and the four corresponding new `DELETE` shapes (`DELETE FROM artefacts WHERE journey_id = $1`, `DELETE FROM journeys WHERE journey_id = $1`, `DELETE FROM credits WHERE tenant_id = $1`, `DELETE FROM tenant_plan WHERE tenant_id = $1`, `DELETE FROM user_roles WHERE tenant_id = $1`).
6. Write the new tests per the test plan.
7. Re-run `tests/check-b3-cleanup-script.js` in full (all existing + new tests) — zero regression to any existing test's assertions (AC2).

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (none — this is a CLI script, no UI)

**PROCEED: Yes**
