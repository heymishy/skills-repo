## Test Plan: Consolidate product view features section with tabs and filters

**Story reference:** artefacts/2026-07-22-product-view-consolidation/stories/pvc-s1-consolidate-and-tab-features-view.md
**Epic reference:** None — short-track
**Test plan author:** Claude (autonomous, short-track)
**Date:** 2026-07-22
**Test runner confirmed from package.json:** `node scripts/run-all-tests.js` (per-file `node tests/check-*.js`)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No duplicate module sections | — | 1 test | — | — | — | 🟢 |
| AC2 | Merge precedence (taxonomy over journeys for overlapping slug) | 1 test | — | — | — | — | 🟢 |
| AC3 | Journeys-only items surface | 1 test | — | — | — | — | 🟢 |
| AC4 | By Module tab, default, empty buckets shown | 1 test | 1 test | — | — | — | 🟢 |
| AC5 | By Phase tab | 1 test | — | — | — | — | 🟢 |
| AC6 | All tab, count parity | 1 test | — | — | — | — | 🟢 |
| AC7 | Health filter chips + data attributes | — | 1 test | — | — | — | 🟢 |
| AC8 | Search filter input + data attributes | — | 1 test | — | — | — | 🟢 |
| AC9 | Zero-module fallback preserved | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

The actual client-side filter *interaction* (typing in the search box, clicking a chip, seeing rows hide/show live in a real browser) is not covered by an automated E2E test in this plan — no CSS-layout-dependent AC exists here (this is JS behaviour, not layout), but real interactive behaviour still benefits from a manual browser check. Recorded as a manual verification step, not a RISK-ACCEPT gap (no H-E2E block applies — the ACs are about markup/attribute presence, which automated tests verify; the live interactivity is a manual smoke-test item).

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, mirrors tmc-s1's own fixture conventions.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Notes |
|----|-------------|--------|-------|
| AC1 | A product with modules, taxonomy items, and journeys items all present | Synthetic | Confirms only one section renders |
| AC2 | One feature_slug present in both taxonomy and journeys | Synthetic | Precedence check |
| AC3 | One feature_slug present only in journeys | Synthetic | Mirrors real `new-feature-*` placeholder rows |
| AC4-AC6 | A ~15-item merged fixture across 3 modules + unclassified + 2 phases | Synthetic | Enough to exercise all three tabs meaningfully |
| AC7 | Items with each of the 4 health values | Synthetic | Filter chip coverage |
| AC8 | Items with distinguishable slugs/names for search matching | Synthetic | |
| AC9 | Zero modules | Synthetic | Regression check |

### Gaps

None — all test data is available now and self-contained.

---

## Unit Tests

### U1 — mergeFeatureSources: overlapping slug uses taxonomy metadata, keeps journey stage (AC2)

- **Verifies:** AC2
- **Precondition:** A taxonomy item `{slug: 'shared-1', name: 'Shared Feature', epicName: 'Epic X'}` and a journeys feature `{featureSlug: 'shared-1', stage: 'implementation', journey_id: 'j1'}`.
- **Action:** Call `mergeFeatureSources(taxonomy, journeysFeatures)`.
- **Expected result:** Exactly one merged item for `shared-1`, with `name: 'Shared Feature'`, `epicName: 'Epic X'` (from taxonomy) AND `stage: 'implementation'` (from the journey) — both sources' data present on the one merged item, not two separate items.

### U2 — mergeFeatureSources: journeys-only slug still appears (AC3)

- **Verifies:** AC3
- **Precondition:** A journeys feature `{featureSlug: 'journey-only-1', stage: 'discovery', journey_id: 'j2'}` with no matching taxonomy item.
- **Action:** Call `mergeFeatureSources(taxonomy, journeysFeatures)`.
- **Expected result:** `journey-only-1` appears in the merged list, tagged `source: 'journey'`, `stage: 'discovery'`.

### U3 — groupItemsByModule: By Module bucketing on the merged list (AC4)

- **Verifies:** AC4
- **Precondition:** A ~15-item merged fixture, 3 modules, assignments covering some items.
- **Action:** Call `groupItemsByModule(mergedItems, assignmentMap, modules)`.
- **Expected result:** Every module (even ones with 0 assigned items) appears as a bucket; unassigned items land in Unclassified; total item count across all buckets equals the merged list length.

### U4 — groupItemsByPhase: By Phase bucketing on the merged list (AC5)

- **Verifies:** AC5
- **Precondition:** Same fixture, items with a mix of epicName set/unset.
- **Action:** Call `groupItemsByPhase(mergedItems)`.
- **Expected result:** Items group by epicName; items with no epicName land in an "Other features" bucket; total item count across all buckets equals the merged list length.

### U5 — All tab count parity (AC6)

- **Verifies:** AC6
- **Precondition:** Same fixture.
- **Action:** Compare the merged list's length to the sum of `groupItemsByModule`'s bucket totals and separately to `groupItemsByPhase`'s bucket totals.
- **Expected result:** All three counts are equal — no item dropped or double-counted across any grouping mode.

---

## Integration Tests

### IT1 — handleGetProductView renders exactly one features section, not two (AC1)

- **Verifies:** AC1
- **Components involved:** `routes/products.js`, `modules-adapter.js`, `product-rollup.js`.
- **Precondition:** A product with modules, a taxonomy with several items, and journeys rows including one placeholder-style entry.
- **Action:** Call `handleGetProductView` end-to-end.
- **Expected result:** Each module name appears exactly once as a tab-related section heading in the rendered HTML (not once in an a4-style section AND again in a tmc-s1-style section) — count each module name's occurrence as a heading/button label specifically, not as a substring anywhere on the page.

### IT2 — By Module tab is selected by default and renders empty buckets (AC4)

- **Verifies:** AC4
- **Components involved:** `routes/products.js`.
- **Precondition:** A product with 2 modules, 0 items assigned to one of them.
- **Action:** Render the product view.
- **Expected result:** The "By Module" tab panel is marked active by default (`pvc-tab-panel--active` present on it, not on By Phase/All); the empty module still renders its own (empty) section.

### IT3 — health filter chips and data-health attributes are present (AC7)

- **Verifies:** AC7
- **Components involved:** `routes/products.js`.
- **Precondition:** A merged item list with at least one item of each health value.
- **Action:** Render the product view.
- **Expected result:** 5 filter chip buttons (All/Healthy/Warning/Blocked/Unknown) present; every item row carries a `data-health` attribute with the correct value.

### IT4 — search input and data-search attributes are present (AC8)

- **Verifies:** AC8
- **Components involved:** `routes/products.js`.
- **Precondition:** Same fixture.
- **Action:** Render the product view.
- **Expected result:** A search `<input>` is present; every item row carries a `data-search` attribute containing its lowercased slug and name.

### IT5 — zero-module product renders the pre-existing simple fallback, no tabs (AC9)

- **Verifies:** AC9
- **Components involved:** `routes/products.js`.
- **Precondition:** A product with zero modules, some taxonomy items, some journeys items.
- **Action:** Render the product view.
- **Expected result:** No tab bar, no filter chips — the flat/simple rendering already established by a4/tmc-s1 for the zero-modules case is unchanged.

---

## NFR Tests

### NFR1 — scale: 100+ merged items render without a query-count or structural regression

- **Verifies:** Scale NFR
- Covered by U3/U4/U5 using a fixture sized at 100+ items (not just the 15-item readability fixture) as a dedicated scale variant.

### NFR2 — accessibility: tabs use the established role/aria convention

- **Verifies:** Accessibility NFR
- **Action:** Assert `role="tablist"`, `role="tab"`, `aria-selected` attributes are present on the rendered tab markup, matching `settings.js`'s exact convention.

---

## Out of Scope for This Test Plan

- Real browser interaction testing (typing in the search box and observing live DOM filtering) — no CSS-layout-dependent AC exists; flagged as a manual smoke-test item instead, not an automated E2E gap.
- Any test of `_renderGroupedCoverageBreakdown`'s own "Epics" heading — untouched, out of story scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Live client-side filter interaction not automated | No headless-browser test infra exists in this repo's own test suite for this class of interaction (existing E2E specs are Playwright, reserved for CSS-layout-dependent ACs per this repo's own H-E2E convention) | Manual verification step in `pvc-s1-verification.md`; markup/attribute presence (which the filter script depends on) is fully covered by automated tests |
