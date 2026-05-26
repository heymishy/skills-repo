# DoR Contract — wfp.6 Allocation matrix view (Tab 2 — Planning Dashboard)

**Story:** wfp.6
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- Extensions to `dashboards/wfp-functions.js`:
  - `renderAllocationRow(entry)` — returns HTML string for one initiative row; renders FTE, cost (NZD), fteDelta with `delta-negative` or `delta-ok` class; renders "no claim" when fteDelta is null
  - `renderAllocationTable(entries)` — returns HTML string for allocation table with `<th>` headers; calls renderAllocationRow per entry
  - `renderAllocationErrorState(message)` — returns HTML string for empty/error state
  - CSS classes `delta-negative` and `delta-ok` added to `dashboards/workforce.html` style block
- `dashboards/workforce.html` Tab 2 (Allocation Matrix) extended — reads from `workforce/initiative-map.json` and renders allocation table

## What will NOT be built

- Tab 3 Gap Analysis (separate story or out of scope)
- Tab 4 Leadership Coverage (wfp.7 scope)
- Tab 5 Initiative Rollup (wfp.8 scope)
- Editing entries from the browser (read-only)

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — row renders FTE, cost, delta fields | Unit: `renderAllocationRow` fields test | wfp6-T1 |
| AC2 — negative delta: delta-negative class | Unit: `renderAllocationRow` negative | wfp6-T2 |
| AC3 — zero/positive delta: delta-ok class | Unit: `renderAllocationRow` positive | wfp6-T3 |
| AC4 — null delta: "no claim" text; no class | Unit: `renderAllocationRow` null | wfp6-T4 |
| AC5 — empty state | Unit: `renderAllocationErrorState`; E2E: empty state | wfp6-T5, wfp6-E2E-T1 |

## Assumptions

- wfp.5 is DoD-complete (`dashboards/wfp-functions.js` and `dashboards/workforce.html` exist)
- wfp.3 is DoD-complete (`workforce/initiative-map.json` format established)

## Required touchpoints (MUST NOT be in out-of-scope list)

- `dashboards/wfp-functions.js` — extend
- `dashboards/workforce.html` — extend Tab 2
- `tests/check-wfp6-allocation-matrix.js` — new file
- `tests/e2e/wfp6-allocation-matrix.spec.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/` — wfp.1–wfp.4 scope
- `tests/check-wfp5-roster-view.js` — wfp.5 test, must not be modified

## Schema dependencies

Upstream: wfp.5, wfp.3. No pipeline-state schema field dependency.
