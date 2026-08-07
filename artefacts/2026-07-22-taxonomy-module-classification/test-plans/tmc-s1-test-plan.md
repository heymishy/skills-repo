## Test Plan: Persist a feature-to-module join for taxonomy-sourced features

**Story reference:** artefacts/2026-07-22-taxonomy-module-classification/stories/tmc-s1-persist-feature-module-classification.md
**Epic reference:** None — short-track
**Test plan author:** Claude (autonomous, short-track)
**Date:** 2026-07-22
**Test runner confirmed from package.json:** `node scripts/run-all-tests.js` (per-file `node tests/check-*.js`, matching every other test file in this repo)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Assignment survives a second `/product-sync` re-run | — | 1 test | — | — | — | 🟢 |
| AC2 | Single query fetches all assignments for a product (no N+1) | 1 test | — | — | — | — | 🟢 |
| AC3 | Bulk-assign is one round-trip regardless of list length | 2 tests | — | — | — | — | 🟢 |
| AC4 | Cross-tenant isolation on read and bulk-assign | — | 2 tests | — | — | — | 🟢 |
| AC5 | Module-grouped taxonomy rendering + zero-assignment fallback is byte-identical to today | 2 tests | 1 test | — | — | — | 🟢 |
| AC6 | Deleting a module reassigns (not orphans) existing feature assignments | 1 test | — | — | — | — | 🟢 |
| AC7 | Bulk-assign route rejects a missing/invalid CSRF token | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC is a mechanical server-side/DB-behaviour check — no CSS layout or browser-only concern in this story (the bulk-assign UI is a form + checkboxes, same rendering pattern already covered by a1's own test suite; no new E2E spec required beyond what a1/a4 already established for that class of UI).

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real user/tenant data involved.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — all test data (mock `pipeline-state.json` fixtures, synthetic feature slugs, a stub pg-Pool-shaped test double) is generated in setup/teardown, matching the existing `modules-adapter.js` test double pattern already used in `check-a1-modules-taxonomy-crud.js`.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two successive mock `pipeline-state.json` payloads (same feature slugs, different unrelated field values) fed to `syncProductRollup` | Synthetic | None | Proves the assignment table is untouched by the taxonomy JSONB overwrite |
| AC2 | A mock pool exposing a call-counter; 300 synthetic `feature_slug` values | Synthetic | None | Counter asserts exactly 1 `query()` call for the fetch path |
| AC3 | Same mock pool/counter pattern; slug lists of length 2 and 250 | Synthetic | None | Proves the bulk path doesn't degrade to N calls at realistic scale |
| AC4 | Two distinct `(product_id, tenant_id)` pairs, one with existing assignments | Synthetic | None | Mirrors `tests/check-bri-s3.4-cross-tenant-isolation.js`'s existing fixture shape |
| AC5 | A taxonomy fixture (groups/ungrouped, ~10 items) with 0 and then partial module assignments | Synthetic | None | Zero-assignment case must byte-match today's existing render exactly |
| AC6 | A module with 2+ existing `feature_module_assignments` rows, then deleted | Synthetic | None | Mirrors the existing `deleteModule`/journeys reassignment test already in `check-a1-modules-taxonomy-crud.js` |
| AC7 | A bulk-assign request with a wrong/missing `_csrf` field | Synthetic | None | Mirrors this session's own a1 CSRF-rejection test pattern |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is available now and self-contained.

---

## Unit Tests

### U1 — `getFeatureModuleAssignments` issues exactly one query regardless of feature count

- **Verifies:** AC2
- **Precondition:** Mock pool with a query-call counter; 300 synthetic feature slugs pre-seeded in the mock's in-memory table.
- **Action:** Call `modulesAdapter.getFeatureModuleAssignments(productId, tenantId)`.
- **Expected result:** Returns a `{feature_slug: module_id}` map with all 300 entries; the mock pool's query counter shows exactly 1 call.
- **Edge case:** Zero assignments exist — returns `{}`, still exactly 1 query (not skipped/short-circuited in a way that would hide a future N+1 regression).

### U2 — `bulkAssignFeaturesToModule` issues exactly one query at 2 slugs and at 250 slugs

- **Verifies:** AC3
- **Precondition:** Mock pool with a query-call counter.
- **Action:** Call `modulesAdapter.bulkAssignFeaturesToModule(productId, tenantId, [2 slugs], moduleId)`, then again with 250 slugs.
- **Expected result:** Both calls show exactly 1 query issued to the mock pool (a single multi-row upsert), not one query per slug.
- **Edge case:** Empty slug list — rejects with a clear error, issues zero queries.

### U3 — `bulkAssignFeaturesToModule` rejects a target module belonging to a different product

- **Verifies:** AC4 (module-scoping half)
- **Precondition:** A module row that belongs to `productId: B`; a bulk-assign call scoped to `productId: A`.
- **Action:** Call `bulkAssignFeaturesToModule(productIdA, tenantIdA, slugs, moduleIdBelongingToB)`.
- **Expected result:** Throws `MODULE_NOT_FOUND` (mirrors `reassignEpic`'s existing cross-product check); zero rows written.
- **Edge case:** No.

### U4 — `deleteModule` sets `feature_module_assignments.module_id` to NULL before deleting the module row

- **Verifies:** AC6
- **Precondition:** A module with 2 existing `feature_module_assignments` rows pointing at it.
- **Action:** Call `modulesAdapter.deleteModule(productId, tenantId, moduleId)`.
- **Expected result:** Both rows still exist afterward with `module_id: null`; the module row itself is gone. The mock pool records the `UPDATE ... SET module_id = NULL` call happening before the `DELETE FROM product_modules` call (ordering assertion, matching the existing `journeys` reassignment test's ordering check).
- **Edge case:** A module with zero assignments — delete proceeds with no-op UPDATE affecting 0 rows.

### U5 — computeTaxonomyRollup's output, joined against an assignment map, groups items by module and buckets unassigned items separately

- **Verifies:** AC5 (data-shape half)
- **Precondition:** A taxonomy fixture with 2 groups (4 items total) + 2 ungrouped items; an assignment map covering 3 of the 6 total feature slugs across 2 modules.
- **Action:** Call the new render-layer join helper (e.g. `groupTaxonomyByModule(taxonomy, assignmentMap, modules)`).
- **Expected result:** Returns per-module buckets (module name + its assigned items) plus an "Unclassified" bucket with the remaining 3 items; total item count across all buckets equals 6 (no item dropped or duplicated).
- **Edge case:** Empty assignment map (`{}`) — every item lands in "Unclassified", proving the join degrades safely to "nothing classified yet" rather than erroring.

### U6 — zero assignments renders byte-identical to today's existing taxonomy HTML

- **Verifies:** AC5 (regression-safety half)
- **Precondition:** Same taxonomy fixture as U5; empty assignment map.
- **Action:** Render the taxonomy section through the product-view render path, with and without the new module-grouping code path active (feature-detected by "any assignment rows exist for this product").
- **Expected result:** HTML output is byte-identical to the pre-existing (pre-this-story) render for a product with zero assignments — proving no visual regression for every product that hasn't adopted module classification yet.
- **Edge case:** No.

### U7 — bulk-assign route rejects a request with a missing or mismatched CSRF token

- **Verifies:** AC7
- **Precondition:** A valid session with a known CSRF token; a request body with either no `_csrf` field or a wrong one.
- **Action:** Call the bulk-assign handler directly with each malformed request.
- **Expected result:** 403 response in both cases; zero rows written to `feature_module_assignments` (mock pool records zero mutating queries).
- **Edge case:** A valid, matching CSRF token — request proceeds normally (control case, proving the guard isn't over-rejecting).

---

## Integration Tests

### IT1 — a feature's module assignment survives a second `/product-sync` run

- **Verifies:** AC1
- **Components involved:** `modules-adapter.js`, `product-rollup.js`'s `syncProductRollup`, mock pool.
- **Precondition:** A mock `pipeline-state.json` fixture with feature slug `"tmc-fixture-a"`; that slug assigned to a module via `assignFeatureToModule`.
- **Action:** Call `syncProductRollup` once (writes `product_rollups.taxonomy` fresh), then call `getFeatureModuleAssignments` and confirm the assignment is intact. Call `syncProductRollup` a second time with a *different* mock `pipeline-state.json` (same feature slugs, changed unrelated fields e.g. `health`), then re-read the assignment.
- **Expected result:** The assignment for `"tmc-fixture-a"` is identical before and after both sync runs — proving persistence lives outside the overwritten JSONB blob.

### IT2 — cross-tenant isolation on read

- **Verifies:** AC4
- **Components involved:** `modules-adapter.js`, mock pool with two tenants' data.
- **Precondition:** Tenant A's product has 5 assignment rows; Tenant B's session attempts to read them via Tenant A's `product_id` but Tenant B's own `tenant_id`.
- **Action:** Call `getFeatureModuleAssignments(productIdA, tenantIdB)`.
- **Expected result:** Returns `{}` (or throws NOT_FOUND, matching this repo's existing product-scoping convention) — never Tenant A's real 5 assignments.

### IT3 — cross-tenant isolation on bulk-assign

- **Verifies:** AC4
- **Components involved:** Same as IT2, mutating path.
- **Precondition:** Same two-tenant fixture.
- **Action:** Call `bulkAssignFeaturesToModule(productIdA, tenantIdB, slugs, moduleId)`.
- **Expected result:** Rejected (matching AC4's product/tenant scoping check); zero rows written for Tenant A's product; Tenant A's pre-existing 5 rows unchanged (read back and diffed before/after).

### IT4 — real `handleGetProductView`-level render of a product with partial module classification

- **Verifies:** AC5
- **Components involved:** `routes/products.js`, `modules-adapter.js`, `product-rollup.js`, mock pool.
- **Precondition:** A product with a 10-item taxonomy fixture, 2 real modules, 4 of the 10 items assigned across those 2 modules.
- **Action:** Call `handleGetProductView` end-to-end (same direct-invocation pattern already used by this session's own `check-render.js`/`check-render2.js` staging scripts, adapted into a committed test).
- **Expected result:** Rendered HTML contains both module names as headings with their 4 assigned items correctly grouped under them, plus an "Unclassified" heading with the remaining 6 items — all 10 slugs appear exactly once across the whole render.

---

## NFR Tests

### NFR1 — scale: 300-feature product renders without a query-count regression

- **Verifies:** AC2, NFR (Scale)
- Covered by U1 above at the adapter layer; IT4's fixture is deliberately kept small (10 items) for readability of the HTML assertion, so U1 is the dedicated scale check — noted here so the split isn't mistaken for a gap.

### NFR2 — multi-tenancy: isolation holds under both read and write

- **Verifies:** AC4, NFR (Multi-tenancy)
- Covered by IT2/IT3 above.

### NFR3 — security: CSRF guard on the new mutating route

- **Verifies:** AC7, NFR (Security)
- Covered by U7 above.

---

## Out of Scope for This Test Plan

- Any Playwright/E2E spec for the bulk-assign UI's visual layout — no new CSS-layout-dependent AC exists in this story (checkbox list + select + submit button, same rendering class as a1's existing forms, already covered by that story's own E2E baseline).
- Pagination behaviour at 1000+ features — explicitly out of scope per the story's own Out of Scope section.
- Retroactive classification of `skills-framework`'s real feature set — a one-off operator data action, not test-plan scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The exact SQL shape of the bulk-assign single-round-trip upsert (multi-row `VALUES` vs `unnest()` array parameters) is left to the coding agent | Both are valid Postgres patterns satisfying "exactly one query"; the AC/test only asserts call count, not SQL syntax, so the implementation is free to pick whichever this repo's existing `pg` usage style favours | U2 asserts the observable property (1 query) that actually matters for the scale NFR, not a specific SQL string |
