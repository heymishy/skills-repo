# DoR Contract — wfp.7 Hiring gap analysis and leadership coverage views (Tabs 3 and 4)

**Story:** wfp.7
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- Extensions to `dashboards/wfp-functions.js`:
  - `LEADERSHIP_ROLES` constant: `["Product Owner", "Engineering Chapter Lead", "People Leader"]`
  - `filterHiringGaps(initiativeMap)` — returns entries where computedFTE === 0 or allocationMode === "net-new"; entries without productGroup always included regardless of filter
  - `renderHiringGapRow(entry)` — renders slug, requiredRole, requiredTags (joined), mode, "No current capacity" FTE text
  - `renderHiringGapTable(entries)` — full table with `<th>` headers; empty state delegate
  - `assessLeadershipCoverage(group, rosterRecords)` — returns `{ fte, hasLeader }` counting FTE from direct+profile-match only for LEADERSHIP_ROLES members; FTE >= 3 with a LEADERSHIP_ROLES member = hasLeader true
  - `renderLeadershipCoverage(groups)` — renders per-group leadership status; "Leadership gap" badge (colour+text) when hasLeader is false
- `dashboards/workforce.html` Tabs 3 (Hiring Gap Analysis) and 4 (Leadership Coverage) extended

## What will NOT be built

- Tab 5 Initiative Rollup (wfp.8 scope)
- Suggested hire or headcount recommendations
- Editing entries from the browser (read-only)

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — gap row: slug/requiredRole/requiredTags/mode/"No current capacity" | Unit: `renderHiringGapRow` | wfp7-T1 |
| AC2 — no-productGroup entries always visible | Unit: `filterHiringGaps` no-group test | wfp7-T2 |
| AC3 — leadership FTE >= 3 direct+profile-match only | Unit: `assessLeadershipCoverage` FTE3 | wfp7-T3 |
| AC4 — no leader: "Leadership gap" badge colour+text | Unit: `assessLeadershipCoverage` + `renderLeadershipCoverage` | wfp7-T4 |
| AC5 — FTE < 3 + has leader: no badge | Unit: FTE < 3 test | wfp7-T5 |
| AC6 — empty state both tabs | Unit: `renderHiringGapTable` empty; E2E: Tab 3 empty | wfp7-T6, wfp7-E2E-T1 |

## Assumptions

- wfp.6 is DoD-complete (`dashboards/wfp-functions.js` and Tabs 1–2 exist)
- wfp.4 is DoD-complete (profile-match entries in initiative-map.json)

## Required touchpoints (MUST NOT be in out-of-scope list)

- `dashboards/wfp-functions.js` — extend
- `dashboards/workforce.html` — extend Tabs 3 and 4
- `tests/check-wfp7-hiring-gap.js` — new file
- `tests/e2e/wfp7-hiring-gap.spec.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/` — wfp.1–wfp.4 scope
- `tests/check-wfp5-roster-view.js` and `tests/check-wfp6-allocation-matrix.js` — must not be modified

## Schema dependencies

Upstream: wfp.6, wfp.4. No pipeline-state schema field dependency.
