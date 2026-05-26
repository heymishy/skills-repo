# DoR Contract — wfp.13 Bottleneck analysis view

**Story:** wfp.13
**Feature:** 2026-05-26-bsr-workforce-planner

---

## Required touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/workforce-ui/server.js` | ADD routes | `GET /api/intelligence/bottlenecks-data` and `GET /intelligence/bottlenecks` |
| `src/workforce-ui/routes/bottlenecks.js` (or inline in server.js) | CREATE or ADD | Handler implementation + `computeBottlenecksData` export |
| `tests/workforce/check-wfp13-bottlenecks.js` | CREATE | AC verification test file |

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
- wfp.12 `computeHeatMapData` must be DoD-complete (listed as prerequisite in story — bottlenecks view links to heat-map).

---

## CSS-layout-dependent ACs

| AC | Item | Classification |
|----|------|----------------|
| AC4 expand animations | Expand/collapse visual transition | RISK-ACCEPT in decisions.md + manual scenario 4b |
| NFR-COMPAT | 1280px viewport | RISK-ACCEPT in decisions.md + manual scenario 10 |
