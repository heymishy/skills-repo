# DoR Contract — wfp.12 Heat map view

**Story:** wfp.12
**Feature:** 2026-05-26-bsr-workforce-planner

---

## Required touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/workforce-ui/server.js` | ADD routes | `GET /api/intelligence/heat-map-data` and `GET /intelligence/heat-map` |
| `src/workforce-ui/routes/heat-map.js` (or inline in server.js) | CREATE or ADD | Handler implementation + `computeHeatMapData` export |
| `tests/workforce/check-wfp12-heat-map.js` | CREATE | AC verification test file |

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
| Any CDN or external resource URLs | Inline only |

---

## Schema dependencies

`schemaDepends: []` — no upstream pipeline-state schema fields required.

---

## Prerequisite conditions

- Intelligence server (wfp.11) is DoD-complete.
- `computeHeatMapData` export declared and available before PR merge (can be co-implemented in this story).

---

## CSS-layout-dependent ACs

| AC | Item | Classification |
|----|------|----------------|
| AC2 visual colour | Heat map green/amber/red rendering | RISK-ACCEPT in decisions.md + manual verification Scenario 2b |
| NFR-COMPAT | 1280px viewport | RISK-ACCEPT in decisions.md + manual verification Scenario 11 |
