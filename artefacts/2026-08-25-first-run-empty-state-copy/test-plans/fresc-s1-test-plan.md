## Test Plan: fresc-s1 — Add orientation copy to two first-run empty states, and gate the Modules card on feature count

**Story reference:** `artefacts/2026-08-25-first-run-empty-state-copy/stories/fresc-s1-product-and-modules-clarity-copy.md`
**Epic reference:** none (short-track)
**Test plan author:** Claude (agent)
**Date:** 2026-08-25
**Test file:** `tests/check-fresc-s1-empty-state-clarity-copy.js`
**Test runner:** confirmed from `package.json` — `"test": "node scripts/run-all-tests.js"`; individual files run standalone via `node tests/check-fresc-s1-empty-state-clarity-copy.js`, matching every other `check-*.js` file in this repo.

---

## ⚠️ Pre-existing test repair required before this story is green

`_renderProductView(productName, productId, features, ...)` is called directly by 43 test call sites across 9 files. Only one file asserts on Modules-card markup and is affected by AC1's new visibility gate: **`tests/check-a1-modules-taxonomy-crud.js`**. Four existing tests there pass `features=[]` (0 features) and assert the Modules card (`a1-create-form`) **is** present — the exact opposite of AC1's new behaviour (hidden at ≤1 feature). Once AC1 ships, these will fail — correctly, since they're now testing stale behaviour, not because the fix is wrong:

- Line 467 — `_renderProductView: renders an "Add module" form with a CSRF field matching the session token (fix-forward)`
- Line 475 — `_renderProductView: renders a rename form and a delete control for each existing module...`
- Line 486 — `_renderProductView: a module name containing HTML/script content is escaped...`
- Line 494 — `_renderProductView: zero modules renders the create form but no rename/delete controls...`
- Line 502 — `handleGetProductView: the real HTML response includes a CSRF token generated from the live session (fix-forward, integration)` — its mock pool returns 0 journeys, which resolves to 0 features via the same path.

**Required repair:** change each of these 5 tests' `features` argument (or, for the integration test, its mock `journeys` rows) from empty/zero to a 2-element fixture, so they continue to exercise the Modules-card markup they're actually testing, under the new visibility precondition. This is not new test-writing — it's a mechanical fixture update to keep pre-existing, still-valid assertions running under the new gate. Budget this as part of Task 1, not a surprise found during `/verify-completion` (same pattern flagged in `workspace/capture-log.md`, 2026-08-24, rcfc-s1).

The other 38 call sites (across `check-a4-module-grouped-rendering.js`, `check-a5-roadmap-tab.js`, `check-bmau-s1-bulk-assign-checkbox-ui.js`, `check-fps-s1-progress-proxy.js`, `check-mtrr-s2-repo-connection-picker.js`, `check-pvc-s1-consolidate-and-tab-features-view.js`, `check-rpc-s1-connect-repo.js`, `check-shb-s1-story-health-badge-fix.js`) assert on unrelated markup (roadmap, bulk-assign, repo picker, etc.), never on Modules-card presence — confirmed via a targeted grep for `a1-create-form`/`a1-rename-form`/`a1-delete-btn`/`>Modules<` across `tests/`, which returned matches only in `check-a1-modules-taxonomy-crud.js`. No repair expected there, but the full suite run (T-INT2 below) is the actual proof, not this static read.

`tests/check-bvnd-s1-board-view-products-nav.js`'s existing assertions (substring `.includes()` checks only, e.g. `.includes('first product')`, `!.includes('no products yet')`) are unaffected by AC3's added line — confirmed by reading that file directly; no repair needed there.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Modules card hidden at 0 or 1 features | 2 | 1 | — | — | — | 🟢 |
| AC2 | Modules card + explanatory line shown at >1 features, CRUD unchanged | 2 | — | — | — | — | 🟢 |
| AC3 | Product empty-state explanatory line, list view and board view | 2 | 1 | — | — | — | 🟢 |
| AC4 | No regression to existing CRUD / empty-state CTA behaviour | — | — | — | — | — | 🟢 (covered by the repaired pre-existing suite + T4/T7 below) |

---

## Coverage gaps

None. All four ACs are pure server-side HTML-string rendering (no CSS layout, no DOM measurement, no external service) — fully testable with direct function calls and string assertions, no E2E tooling required.

---

## Test Data Strategy

**Source:** Synthetic — every target function (`_renderProductView`, `_renderModulesManagement`, `_renderProductDashboard`, `handleGetProductView`, `handleGetDashboard`) takes plain JS objects/arrays as parameters or a mock `pool.query`, matching the existing pattern in `check-a1-modules-taxonomy-crud.js` and `check-bvnd-s1-board-view-products-nav.js`. No real database, no fixtures committed to disk.
**PCI/sensitivity in scope:** No — product names, module names, and feature counts only.
**Availability:** Available now — all test data is constructed inline in the test file.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A `features` array of length 0 and length 1 | Synthetic, inline | None | Boundary-tests the ">1" threshold at both ends |
| AC2 | A `features` array of length 2, a `modules` array with ≥1 entry | Synthetic, inline | None | Reuses `check-a1-modules-taxonomy-crud.js`'s existing module-fixture shape (`{id, name}`) |
| AC3 | Zero-product tenant fixture (mirrors `bvnd-s1`'s T3 mock pool: empty products, zero no-product journeys) | Synthetic, inline | None | Shared between the list-view and board-view assertions |

### PCI / sensitivity constraints

None.

### Gaps

None — test data is fully available and self-contained.

---

## Unit Tests

### modulesCardHiddenWithZeroFeatures

- **Verifies:** AC1
- **Precondition:** `_renderProductView` called with `features = []`, `modules = [{id: 'mod-1', name: 'Billing'}]` (a non-empty modules array, to prove the gate is keyed on feature count, not module count)
- **Action:** Call `_renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [{id:'mod-1',name:'Billing'}], TEST_CSRF)`
- **Expected result:** Returned HTML does not contain `a1-create-form`, `a1-rename-form`, `a1-delete-btn`, or the "Modules" section heading
- **Edge case:** No

### modulesCardHiddenWithExactlyOneFeature

- **Verifies:** AC1 (boundary)
- **Precondition:** `features` array of length 1
- **Action:** Call `_renderProductView` with a single-element `features` array, same modules fixture as above
- **Expected result:** Modules card still absent — confirms the threshold is `> 1`, not `>= 1` or `> 0`
- **Edge case:** Yes — exact boundary value

### modulesCardVisibleWithTwoFeatures

- **Verifies:** AC2
- **Precondition:** `features` array of length 2, `modules = []`
- **Action:** Call `_renderProductView` with the 2-feature fixture
- **Expected result:** Returned HTML contains `a1-create-form` (the card renders), and contains a new, stable, testable marker for the explanatory line — implementer should wrap it in an identifiable element (e.g. `id="a1-modules-hint"`) so this test and future ones can assert presence without pinning exact copy wording (copy is confirmed separately via the AC verification script, not asserted verbatim here — avoids a brittle test on future copy edits)
- **Edge case:** No

### moduleCrudMarkupUnchangedWhenCardVisible

- **Verifies:** AC2, AC4 (non-regression)
- **Precondition:** `features` array of length 2, `modules = [{id: 'mod-1', name: 'Billing'}]`
- **Action:** Call `_renderProductView` with the same fixture
- **Expected result:** Rename form (`data-module-id="mod-1"`), delete control (`a1-delete-btn`), and CSRF fields are present and unchanged from current behaviour — the new visibility gate and hint line do not alter existing CRUD markup
- **Edge case:** No

### productEmptyStateIncludesExplanatoryLine

- **Verifies:** AC3
- **Precondition:** `_renderProductDashboard` called with `products = []`
- **Action:** Call `_renderProductDashboard([], 'login', [], null, 0, false)`
- **Expected result:** Returned HTML still contains "No products yet" and "Create your first product" (unchanged existing copy), plus a new stable marker for the explanatory line (e.g. `id="sw-products-empty-hint"`)
- **Edge case:** No

### productListNonEmptyStateUnaffected

- **Verifies:** AC3 (non-regression, scoping check)
- **Precondition:** `_renderProductDashboard` called with `products.length >= 1`
- **Action:** Call `_renderProductDashboard` with one product
- **Expected result:** Returned HTML does not contain "No products yet" or the new hint marker — confirms the added line is scoped to the empty state only
- **Edge case:** No

---

## Integration Tests

### handleGetProductViewReflectsVisibilityGateEndToEnd

- **Verifies:** AC1, AC2
- **Components involved:** `handleGetProductView` route handler, mock `pool.query` (products, journeys/features, rollup)
- **Precondition:** Mirrors the existing integration test at `check-a1-modules-taxonomy-crud.js:502` — mock pool returning product row + rollup row, varied journey-row counts
- **Action:** Call `handleGetProductView` twice: once with a mock pool returning 0 journey rows, once returning 2
- **Expected result:** The 0-journey response does not contain `a1-create-form`; the 2-journey response does — confirms the gate works through the full route handler, not just the isolated render function
- **Edge case:** No

### boardViewEmptyStateAlsoIncludesExplanatoryLine

- **Verifies:** AC3 (shared-function regression check)
- **Components involved:** `handleGetDashboard` route handler, mock `pool.query` (zero products, zero no-product journeys)
- **Precondition:** Zero-product, zero-no-product-journey tenant mock pool, mirroring `check-bvnd-s1-board-view-products-nav.js`'s existing T3 fixture
- **Action:** Call `handleGetDashboard` with `query: { view: 'board' }`
- **Expected result:** Response body contains the same hint marker/text as `productEmptyStateIncludesExplanatoryLine` — proves the single shared `_renderProductDashboard` code path change reaches the board view too, not just the list view
- **Edge case:** No

---

## NFR Tests

None — confirmed with story owner. Story's NFR section states "None beyond existing rendering-correctness expectations."

---

## Out of Scope for This Test Plan

- Exact wording of either explanatory line — asserted only via presence of a stable marker element in unit tests, to avoid brittleness against future copy edits. Wording is confirmed by a human via the AC verification script (Output 2) instead.
- `a3`/`a4`'s module-distribution strip and grouped-features rendering — untouched by this story, not retested here.
- Visual styling/positioning of the new lines — no CSS-layout-dependent AC exists in this story.
- The 38 unaffected `_renderProductView` call sites outside `check-a1-modules-taxonomy-crud.js` — not individually retested here; covered collectively by the full-suite regression run required at `/verify-completion`.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Exact copy wording of both explanatory lines | Not asserted verbatim in automated tests, to avoid a brittle test that breaks on future copy-only edits | Verified via the AC verification script's manual scenario before/after implementation; final wording is a small human sign-off step, not an automated gate |
