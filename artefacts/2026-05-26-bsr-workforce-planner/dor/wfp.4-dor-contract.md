# DoR Contract — wfp.4 Extended allocation modes: profile-match and net-new

**Story:** wfp.4
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- Extensions to `src/workforce/map.js`:
  - `processProfileMatch(entry, roster, costModel)` — counts FTE from roster matching `requiredSkills` and/or `requiredRole`; computes cost; builds gap report entries for unmatched roles
  - `processNetNew(entry, costModel)` — sets computedFTE to `entry.requiredCount`; computes cost from cost model
  - `buildGapReport(results)` — collects all entries where profile-match returned 0 FTE
  - `run()` dispatcher extended to route `allocationMode: "profile-match"` and `"net-new"` through new functions

## What will NOT be built

- Dashboard rendering for profile-match or net-new (wfp.5/wfp.6 scope)
- Multi-team rollup entries (wfp.8 scope)
- Cost-model editing

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — profile-match: FTE counted from roster by skills/role | Unit: `processProfileMatch` | wfp4-T1 |
| AC2 — net-new: FTE = requiredCount; cost from model | Unit: `processNetNew` | wfp4-T2 |
| AC3 — gap report: 0-FTE roles listed | Unit: `buildGapReport` | wfp4-T3 |
| AC4 — mixed mode input: all 3 modes processed | Integration: `run` with fixture | wfp4-T4 (integration) |
| AC5 — partial-skills match threshold satisfied | Unit: partial-match test | wfp4-T5 |

## Assumptions

- wfp.3 is DoD-complete before implementation begins
- `src/workforce/map.js` already exports wfp.3 functions and is not restructured

## Required touchpoints (MUST NOT be in out-of-scope list)

- `src/workforce/map.js` — extend (not replace)
- `tests/check-wfp4-map-extended.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/intake.js` — wfp.1 scope
- `src/workforce/update.js` — wfp.2 scope
- `dashboards/workforce.html` — wfp.5–wfp.8 scope
- `tests/check-wfp3-map-core.js` — wfp.3 test, must not be modified

## Schema dependencies

Upstream: wfp.3. No pipeline-state schema field dependency.
