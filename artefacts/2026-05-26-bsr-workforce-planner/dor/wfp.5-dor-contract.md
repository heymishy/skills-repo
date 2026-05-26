# DoR Contract — wfp.5 Workforce roster view (Tab 1 — Planning Dashboard)

**Story:** wfp.5
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- `dashboards/wfp-functions.js` — exports pure functions:
  - `filterRoster(records, filters)` — applies productGroup, role, name search, retired toggle filters
  - `renderRosterRow(record)` — returns HTML string for a single person row
  - `renderRosterTable(records)` — returns HTML string for full table; calls renderRosterRow per record
  - `renderRosterErrorState(message)` — returns HTML string for empty/error state
- `dashboards/workforce.html` — Tab 1: Roster View. Tab bar with 5 tabs (Tabs 2–5 empty stubs). Reads `workforce/roster.json` via `fetch()` on load. Imports wfp-functions.js.

## What will NOT be built

- Tab 2 (Allocation Matrix) — wfp.6 scope
- Tab 3 (Gap Analysis) — wfp.6 scope
- Tab 4 (Leadership Coverage) — wfp.7 scope
- Tab 5 (Initiative Rollup) — wfp.8 scope
- Editing records from the browser — read-only
- External data sources or network calls beyond local relative-path fetch

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — renders table from roster.json; row per record | E2E: fixture load + row count | wfp5-E2E-T1 |
| AC2 — group/role filter controls | Unit: `filterRoster` + E2E: interaction | wfp5-T2, wfp5-E2E-T2 |
| AC3 — search field filters by name | Unit: `filterRoster` search | wfp5-T3 |
| AC4 — retired toggle | Unit: `filterRoster` retired flag; E2E: toggle | wfp5-T4, wfp5-E2E-T3 |
| AC5 — empty state | Unit: `renderRosterErrorState`; E2E: empty state | wfp5-T5, wfp5-E2E-T4 |

## Coverage gap

- Contrast ratio 4.5:1 — Untestable-by-nature. Manual check in wfp.5-verification.md Scenario 9.

## Assumptions

- wfp.1 is DoD-complete before implementation begins
- Static file server used for E2E tests (no Node server required)
- `dashboards/viz-functions.js` exists as pattern reference

## Required touchpoints (MUST NOT be in out-of-scope list)

- `dashboards/workforce.html` — new file
- `dashboards/wfp-functions.js` — new file
- `tests/check-wfp5-roster-view.js` — new file
- `tests/e2e/wfp5-roster-view.spec.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/` — wfp.1–wfp.4 scope
- Existing dashboard files other than workforce.html and wfp-functions.js
- Any existing test file other than wfp5 test files

## Schema dependencies

Upstream: wfp.1. No pipeline-state schema field dependency.
