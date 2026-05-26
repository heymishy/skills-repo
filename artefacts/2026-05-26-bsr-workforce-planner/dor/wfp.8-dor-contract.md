# DoR Contract — wfp.8 Multi-team initiative scope decomposition and rollup view (Tab 5)

**Story:** wfp.8
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- Extensions to `src/workforce/map.js`:
  - `groupByParentSlug(entries)` — groups allocation entries by `parentSlug` value; entries without `parentSlug` returned in a standalone list unchanged
  - `processRollupGroup(parentSlug, scopeItems, portfolio)` — produces one rollup parent entry: `slug=parentSlug`, `allocationMode: "rollup"`, `scopeItems` array, `totalComputedFTE`, `totalComputedCostPerQuarterNZD`, `claimedFTE` / `claimedCostNZD` (from portfolio file or null), `fteDelta`
  - `run()` updated: call `groupByParentSlug` before writing initiative-map.json; write one parent entry per rollup group; do NOT write child scope items as separate top-level entries
- Extensions to `dashboards/wfp-functions.js`:
  - `renderRollupParentRow(rollupEntry)` — renders parent heading row: slug, totalComputedFTE, fteDelta (signed; delta-negative / delta-ok / "no claim"), totalComputedCostPerQuarterNZD in NZD format
  - `renderRollupChildRow(scopeItem)` — renders indented child row: scopeLabel (or slug fallback), productGroup, computedFTE, computedCostPerQuarterNZD in NZD format
  - `renderRollupTab(initiativeMap)` — renders full Tab 5 body; empty state when no rollup entries
- `dashboards/workforce.html` Tab 5 (Initiative Rollup) rendered

## What will NOT be built

- Nested rollup / grandparent hierarchy (Phase 1: one level only)
- Editing scope items from the browser (read-only)
- Drag-and-drop reordering of scope items
- Export of rollup view

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — two entries with same parentSlug → single rollup parent with scopeItems/totals/claimedFTE/fteDelta | Unit: `processRollupGroup` | wfp8-T1 |
| AC2 — entries without parentSlug → unchanged (backwards compat) | Unit: `groupByParentSlug` standalone; Integration: `run` | wfp8-T2, wfp8-T3 (integration) |
| AC3 — single scope item → rollup with scopeItems.length === 1 | Unit: `processRollupGroup` single-item | wfp8-T4 |
| AC4 — Tab 5 parent heading row + indented child rows; scopeLabel fallback | Unit: `renderRollupParentRow` + `renderRollupChildRow` | wfp8-T5, wfp8-T6 |
| AC5 — delta-negative / delta-ok / null → "no claim" | Unit: `renderRollupParentRow` delta tests | wfp8-T7, wfp8-T8, wfp8-T9 |
| AC6 — empty state when no rollup entries | Unit: `renderRollupTab` empty; E2E: Tab 5 empty state | wfp8-T10, wfp8-E2E-T1 |

## Assumptions

- wfp.3 and wfp.4 are DoD-complete before `map.js` extension work starts
- wfp.7 is DoD-complete before `workforce.html` Tab 5 work starts
- `delta-negative` and `delta-ok` CSS classes already exist from wfp.6

## Required touchpoints (MUST NOT be in out-of-scope list)

- `src/workforce/map.js` — extend
- `dashboards/wfp-functions.js` — extend
- `dashboards/workforce.html` — extend Tab 5
- `tests/check-wfp8-rollup.js` — new file
- `tests/e2e/wfp8-rollup-tab.spec.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/intake.js` — wfp.1 scope
- `src/workforce/update.js` — wfp.2 scope
- `tests/check-wfp3-map-core.js`, `tests/check-wfp4-map-extended.js` — must not be modified
- `tests/check-wfp5-roster-view.js`, `tests/check-wfp6-allocation-matrix.js`, `tests/check-wfp7-hiring-gap.js` — must not be modified

## Schema dependencies

Upstream: wfp.3, wfp.4, wfp.7. No pipeline-state schema field dependency.
