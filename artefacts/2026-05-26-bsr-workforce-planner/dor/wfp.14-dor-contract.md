# DoR Contract — wfp.14 Temporal risk view

**Story:** wfp.14
**Feature:** 2026-05-26-bsr-workforce-planner

---

## Required touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/workforce-ui/server.js` | ADD routes | `GET /api/intelligence/temporal-risk-data` and `GET /intelligence/temporal-risk` |
| `src/workforce-ui/routes/temporal-risk.js` (or inline in server.js) | CREATE or ADD | Handler implementation + `computeTemporalRiskData` export |
| `tests/workforce/check-wfp14-temporal-risk.js` | CREATE | AC verification test file |

---

## Out-of-scope (must not touch)

| File | Reason |
|------|--------|
| `workforce/teams.json` | Read-only data file |
| `workforce/roster.json` | Read-only data file |
| `workforce/initiative-map.json` | Read-only data file |
| `portfolio/*.json` | Read-only data files |
| Any existing route handlers for other stories | Separate story scope |
| `package.json` runtime dependencies | No new npm runtime deps allowed |

---

## Schema dependencies

`schemaDepends: []` — no upstream pipeline-state schema fields required.

---

## Prerequisite conditions

- Intelligence server (wfp.11) is DoD-complete.
- wfp.12 `computeHeatMapData` DoD-complete (story prerequisite — temporal risk HTML links to heat-map for drill-down).

---

## Special constraints

- `_nowOverride` query parameter accepted ONLY when `NODE_ENV=test`. Must be explicitly rejected/ignored in production.
- All tests pin `_nowOverride = 2026-01-01` for determinism.
- Retired members (`status: "retired"`) must be excluded at data read time before any calculation.

---

## CSS-layout-dependent ACs

| AC | Item | Classification |
|----|------|----------------|
| AC3 expand rows | Quarter row expand animations | RISK-ACCEPT in decisions.md + manual scenario |
| NFR-COMPAT | 1280px viewport | RISK-ACCEPT in decisions.md + manual scenario |
