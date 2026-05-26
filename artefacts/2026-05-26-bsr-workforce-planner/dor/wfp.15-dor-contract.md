# DoR Contract — wfp.15 Scenario modelling

**Story:** wfp.15
**Feature:** 2026-05-26-bsr-workforce-planner

---

## Required touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/workforce-ui/server.js` | ADD routes | `GET /intelligence/scenarios` and `POST /api/intelligence/scenario` |
| `src/workforce-ui/routes/scenarios.js` (or inline in server.js) | CREATE or ADD | Handler implementation + overlay engine |
| `tests/workforce/check-wfp15-scenarios.js` | CREATE | AC verification test file |

---

## Out-of-scope (must not touch)

| File | Reason |
|------|--------|
| `workforce/teams.json` | Read-only data file — must not be written by POST endpoint |
| `workforce/roster.json` | Read-only data file — must not be written by POST endpoint |
| `workforce/initiative-map.json` | Read-only data file |
| `portfolio/*.json` | Read-only data files |
| Any existing route handlers for other stories | Separate story scope |
| `package.json` runtime dependencies | No new npm runtime deps allowed |

---

## Schema dependencies

`schemaDepends: []` — no upstream pipeline-state schema fields required.

---

## Prerequisite conditions

- wfp.12, wfp.13, wfp.14 all DoD-complete: `computeHeatMapData`, `computeBottlenecksData`, `computeTemporalRiskData` exports must exist and be importable.
- POST endpoint must call these three functions on the modified (overlay-applied) state to produce the response.

---

## Critical constraint: independent overlays

The POST endpoint with `scenarios[]` array MUST apply each overlay to a FRESH DEEP CLONE of the on-disk data. This is a hard correctness requirement. If overlays are chained (output of overlay 0 becomes input of overlay 1), Scenario 7 in the verification script will fail with `[wfp.15-AC7] FAIL: cascading/chaining detected`.
