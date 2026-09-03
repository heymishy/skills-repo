## Test Plan: Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three

**Story reference:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/stories/ppg-s1-decouple-modules-gate-and-consolidate-health-counts.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Zero-modules products get tabs/filter-bar/search, not a flat list | 1 | — | — | — | — | 🟢 |
| AC2 | Zero-modules "By Module" tab shows one Unclassified group, no bulk-assign bar | 1 | — | — | — | — | 🟢 |
| AC3 | Zero-modules defaults to "By Phase" tab; WITH modules still defaults to "By Module" | 2 | — | — | — | — | 🟢 |
| AC4 | Health counts appear once, on the interactive chip bar, with real counts | 2 | — | — | — | — | 🟢 |
| AC5 | "Overall:" line shows only its single label, no repeated breakdown | 1 | — | — | — | — | 🟢 |
| AC6 (regression) | Products WITH modules: default tab, bulk-assign bar, module sections unchanged | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language (no drag-drop, no `getBoundingClientRect`, no pointer coordinates) — this is presence/shape/markup-structure testing on server-rendered HTML strings, matching this repo's own established convention for `_renderProductView` (e.g. `pdt-s1`, `pdt-s2`, `pvc-s1`'s own test files). N/A.

---

## Coverage gaps

None. All 6 ACs are fully coverable via direct assertions against `_renderProductView`'s own rendered HTML output, reusing the exact fixture patterns already established by `pdt-s1`, `pdt-s2`, and `pvc-s1`'s own pre-existing test files.

---

## Test Data Strategy

**Source:** Synthetic — in-test fixtures passed directly to `_renderProductView`, no real network/DB calls
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses the exact fixture shape already established by `tests/check-pdt-s2-triage-summary-strip.js` and `tests/check-pvc-s1-consolidate-and-tab-features-view.js` (a `rollupRow` with `health_counts`, an items list, and a `modules` array — empty or populated depending on the scenario under test).

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `modules: []`, a non-empty items list with at least one `epicName` set | Synthetic, in-test | None | |
| AC2 | Same as AC1 | Synthetic, in-test | None | |
| AC3 | Two fixture calls: one with `modules: []`, one with `modules: [{id,name}]` | Synthetic, in-test | None | |
| AC4 | A `health_counts` object with distinct non-zero values per status (green/amber/red/unknown) so each count is individually distinguishable in assertions | Synthetic, in-test | None | |
| AC5 | Same `health_counts` fixture as AC4 | Synthetic, in-test | None | |
| AC6 | `modules: [{id,name}]` (non-empty), reusing `pvc-s1`'s/`bmau-s1`'s own existing fixture shape | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Zero-modules product renders the full tabbed/filterable UI, not a flat list
- **Verifies:** AC1
- **Precondition:** `modules: []`, items list with ≥2 items, each carrying a distinct `epicName`.
- **Action:** Call `_renderProductView(...)`.
- **Expected result:** The rendered HTML contains `class="pvc-tabs"`, `id="pvc-tab-phase"`, `id="pvc-tab-module"`, `id="pvc-tab-all"`, the `pvc-search` input, and the `pvc-health-chip` filter bar — none of which rendered at all under the old `modules.length === 0` early-return path. No longer contains a bare, unwrapped flat `<ul>` outside of any `pvc-tab-panel`.
- **Edge case:** No

### Zero-modules "By Module" tab shows exactly one Unclassified group, no bulk-assign bar
- **Verifies:** AC2
- **Precondition:** Same as above.
- **Action:** Call `_renderProductView(...)`, inspect the `pvc-tab-panel-module` panel specifically.
- **Expected result:** Exactly one `a4-module-section` renders inside that panel, titled "Unclassified" with the correct item count (e.g. "Unclassified (2)"). No `bmau-bar` class present anywhere in that panel.
- **Edge case:** No

### Default active tab: "By Phase" for zero modules, "By Module" for ≥1 module (with regression guard)
- **Verifies:** AC3, AC6
- **Precondition:** Two fixture calls — one `modules: []`, one `modules: [{id:'m1',name:'Module 1'}]` (with at least one item assigned to it).
- **Action:** Call `_renderProductView(...)` for each; inspect which tab button carries `pvc-tab--active`/`aria-selected="true"` and which panel carries `pvc-tab-panel--active`.
- **Expected result:** Zero-modules case: `pvc-tab-phase` and `pvc-tab-panel-phase` are active, `pvc-tab-module` is not. ≥1-module case: `pvc-tab-module` and `pvc-tab-panel-module` are active, unchanged from today (regression guard, AC6).
- **Edge case:** No

### Health counts appear once, on the interactive chip bar, with real per-status counts
- **Verifies:** AC4
- **Precondition:** `health_counts: { green: 50, amber: 3, red: 1, unknown: 10 }` (all four values distinct and non-zero).
- **Action:** Call `_renderProductView(...)`.
- **Expected result:** The health-filter chip bar contains `Warning (3)`, `Blocked (1)`, `Healthy (50)`, `Unknown (10)` as clickable `pvc-health-chip` buttons carrying `pvcFilterByHealth(this)`. The old `pdt-triage-strip` class is absent from the entire page. No separate, non-interactive per-status breakdown (e.g. a bare `Warning: 3` span outside the chip bar) appears anywhere else on the page.
- **Edge case:** No

### "Overall:" line shows only its single derived label, no repeated breakdown
- **Verifies:** AC5
- **Precondition:** Same `health_counts` fixture as the previous test.
- **Action:** Call `_renderProductView(...)`, isolate the `Overall:` line's own containing element.
- **Expected result:** That element contains only `Overall: ⚠ Warning` (or the appropriate derived label) — no `Healthy: 50`, `Blocked: 1`, or `Unknown: 10` text within that same element (those now live only in the chip bar, asserted by the previous test).
- **Edge case:** No

### Regression guard — pdt-s3's Overall-line Unknown-state handling is unaffected
- **Verifies:** AC6 (via reuse, not a new test)
- **Precondition:** N/A — this is `tests/check-pdt-s3-deemphasize-unknown-health.js`'s own pre-existing AC3 test, run unmodified.
- **Action:** `node tests/check-pdt-s3-deemphasize-unknown-health.js`
- **Expected result:** All pre-existing assertions (`Overall: Unknown` / no misleading `Overall: ✓ Healthy`) still pass — confirmed these only assert the single derived label, not the removed per-status breakdown, so no source change to that file is needed.

---

## Out of Scope for This Test Plan

- Any test of `groupItemsByModule`/`groupItemsByPhase`/`computeHealthCounts`/`computeOverallHealthSignal` themselves — unchanged by this story, already covered by their own pre-existing tests.
- Any test of the bulk-assign mechanism's own logic (`bmau-s1`) beyond whether its bar renders at all — its own existing test file covers its actual assign/select behaviour, untouched here.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
