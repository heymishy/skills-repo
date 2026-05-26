# Test Plan: Initiative allocation matrix and FTE delta view

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.6.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Initiative rows rendered with all required columns; null shown as "—" | 3 tests | — | 1 test | — | — | 🟢 |
| AC2 | Negative fteDelta → red class on delta cell + visual row indicator; ≥0 or null → no red | 3 tests | — | 1 test | — | — | 🟢 |
| AC3 | gap:true → "Gap" badge displayed alongside red delta | 2 tests | — | — | — | — | 🟢 |
| AC4 | Fetch error → visible error message; no silent empty table | 1 test | — | 1 test | — | — | 🟢 |
| NFR-A11Y | Colour supplemented by text label; `<th>` headers | 2 tests | — | — | — | — | 🟢 |
| NFR-SEC | No external network calls | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — colour checks are verified by CSS class name presence, not actual rendering. All ACs are automatable.

---

## Test Data Strategy

All test data is synthetic. No real PII.

- **Initiative-map fixture:** 4 entries — one with negative fteDelta, one with positive, one with null fteDelta, one with `gap: true`.
- Rendering functions extracted to `dashboards/wfp-functions.js` (shared with wfp.5).
- E2E tests: Playwright; `tests/e2e/wfp6-allocation-matrix.spec.js`; pre-written `workforce/initiative-map.json` fixture in test beforeAll.

---

## Unit tests

Test file: `tests/check-wfp6-allocation-matrix.js`
Run command: `node tests/check-wfp6-allocation-matrix.js`
Source under test: `dashboards/wfp-functions.js` (exports `renderAllocationRow`, `renderAllocationTable`, `renderAllocationErrorState`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `render-allocation-row-all-columns` | AC1 | Entry with all fields populated | Row HTML contains initiative slug, allocation mode, people count, computedFTE, claimedFTE, fteDelta, computedCostPerQuarterNZD, claimedCostNZD |
| 2 | `render-null-claimed-fte-as-dash` | AC1 | Entry with `claimedFTE: null` | Cell value rendered as "—" |
| 3 | `render-null-claimed-cost-as-dash` | AC1 | Entry with `claimedCostNZD: null` | Cell value rendered as "—" |
| 4 | `render-negative-delta-adds-red-css-class` | AC2 | Entry with `fteDelta: -2` | Delta cell HTML contains CSS class matching `--color-gap-red` custom property (e.g. class `delta-negative`) |
| 5 | `render-zero-delta-no-red-class` | AC2 | Entry with `fteDelta: 0` | Delta cell does NOT contain the negative-delta CSS class |
| 6 | `render-null-delta-no-red-class` | AC2 | Entry with `fteDelta: null` | Delta cell does NOT contain the negative-delta CSS class; value shown as "—" |
| 7 | `render-gap-badge-for-gap-true` | AC3 | Entry with `gap: true` | Row HTML contains "Gap" text badge |
| 8 | `render-no-gap-badge-for-gap-false` | AC3 | Entry with `gap: false` or `gap` absent | Row HTML does NOT contain gap badge element |
| 9 | `render-allocation-error-state` | AC4 | `renderAllocationErrorState()` function | Returns HTML string containing "Initiative map not found — run workforce-map to generate workforce/initiative-map.json" |
| 10 | `nfr-a11y-delta-supplemented-with-text-label` | NFR-A11Y | Negative delta entry | Row has text label "Gap" or "↓ [value]" in addition to colour class — not colour only |
| 11 | `nfr-a11y-table-headers-are-th` | NFR-A11Y | Rendered table | Column headers use `<th>` elements |
| 12 | `nfr-sec-no-external-fetch-in-html` | NFR-SEC | Static analysis of `dashboards/workforce.html` | No `fetch()` with absolute URL; no CDN script tags |

---

## E2E tests

Test file: `tests/e2e/wfp6-allocation-matrix.spec.js`
Run command: `npm run test:e2e -- --grep "wfp6"`

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| E1 | `e2e-allocation-tab-renders-rows` | AC1 | Navigate to Allocation Matrix tab | At least 1 row rendered with initiative slug visible |
| E2 | `e2e-negative-delta-row-has-visual-class` | AC2 | Load fixture with one negative-delta entry | That row has visual indicator (class or background) distinguishing it from others |
| E3 | `e2e-error-state-no-map-file` | AC4 | Load page without initiative-map.json | Error message text visible; no empty table |

---

## Total test count

**12 unit + 3 E2E = 15 tests**
All automated tests are expected to FAIL before implementation (RED phase of TDD).
