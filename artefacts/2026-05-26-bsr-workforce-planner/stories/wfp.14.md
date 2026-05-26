## Story wfp.14: Temporal coverage risk — intelligence server

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Phase:** 2 (Intelligence Layer)
**Prerequisite:** wfp.12 DoD-complete (introduces `src/workforce-ui/server.js`).

## User Story

As a **Head of Engineering**,
I want to see a rolling 4-quarter view of which teams will lose members to contract rolloff and whether the remaining team membership will still cover their allocated initiatives,
So that I can anticipate capability gaps before they materialise and trigger backfill or reallocation planning with enough lead time to act.

## Benefit Linkage

**Metric moved:** M1 (Workforce and Initiative Reconciliation Time)
**How:** Currently, identifying "which teams shrink significantly next quarter" requires the operator to manually scan `endDate` fields in the roster, group by team, and mentally test whether the post-rolloff team still covers the initiative's `requiredTags`. This is manual cross-reference that inflates M1 (the reconciliation cycle includes checking future capacity, not just current state). The temporal risk view automates this projection, reducing the time to identify a quarter-ahead gap from a manual task (currently estimated at 30+ minutes per reconciliation cycle) to a single page load.

## Architecture Constraints

- Delivered in the existing standalone intelligence server at `src/workforce-ui/server.js` introduced in wfp.12. No new server file.
- Two routes: `GET /intelligence/temporal-risk` (HTML) and `GET /api/intelligence/temporal-risk-data` (JSON). Both require `authGuard`.
- Quarter windows are computed relative to the server's current date at request time using `new Date()`. Quarter boundaries follow standard calendar quarters: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec. The 4-quarter window is the current quarter plus the next 3 quarters.
- `POST_ROLLOFF_COVERAGE_THRESHOLD` is a top-level constant in the route handler (default: `0.5` — a team whose non-retired, non-rolled-off membership falls below 50% of its current count triggers a risk flag). Not exposed as a UI control in Phase 2.
- Reads `workforce/teams.json`, `workforce/roster.json`, and `workforce/initiative-map.json` at request time.
- Inline single-file HTML response, vanilla JS, no CDN, no framework.
- `endDate` field in roster entries is interpreted as an ISO 8601 date string (`YYYY-MM-DD` or `YYYY-MM`). Entries without an `endDate` field are treated as permanent (no rolloff). Entries with `retired: true` are excluded from all rolloff calculations.

## Dependencies

- `src/workforce-ui/server.js` must exist (wfp.12).
- `workforce/teams.json`, `workforce/roster.json` must exist.
- `workforce/initiative-map.json` is read to identify which initiatives each team is allocated to, enabling post-rolloff coverage assessment. If absent, the temporal risk view shows rolloff counts per team without the coverage impact column and includes an inline note: "Coverage impact not available — run `workforce-map` first."

## Acceptance Criteria

**AC1 (temporal-risk-data JSON):** Given `workforce/teams.json` and `workforce/roster.json` exist, when I call `GET /api/intelligence/temporal-risk-data`, then the response is `200 application/json` containing: `quarters` (array of 4 strings in `"YYYY Qn"` format starting from the current calendar quarter), `teams` (array of team entries), and for each team: `teamId`, `teamName`, `currentMemberCount` (count of non-retired roster members in the team), and `quarters` (array of 4 objects, one per quarter window). Each quarter object contains: `rolloffCount` (number of team members whose `endDate` falls within that quarter window), `remainingCount` (currentMemberCount minus cumulative rolloffs through and including this quarter), `coverageRiskFlag` (boolean: true if `remainingCount / currentMemberCount < POST_ROLLOFF_COVERAGE_THRESHOLD`), and `rollingOffMembers` (array of `{ name }` for members rolling off in this specific quarter).

**AC2 (temporal-risk HTML — 4-quarter grid):** Given `GET /intelligence/temporal-risk` is called, then the HTML response contains a grid with rows for each team and columns for each of the 4 quarters. Each cell shows the rolloff count for that team/quarter and a risk indicator (e.g. a coloured badge) when `coverageRiskFlag` is true. The current quarter column is visually distinguished (e.g. bold header or highlight). Clicking a cell expands a panel showing the `rollingOffMembers` names for that team and quarter.

**AC3 (secondary breakdown panel):** Given the temporal-risk view is rendered, then a secondary "By Team" section below the grid lists each team with its current member count, a quarter-by-quarter rolloff summary (e.g. "Q2: 2 rolloffs, Q3: 1 rolloff"), and a post-rolloff coverage flag per quarter where risk is detected. This panel is always visible (not hidden behind a click).

**AC4 (coverage impact column):** Given `workforce/initiative-map.json` exists, when the temporal risk data is computed, then each team's quarter object also includes `allocatedInitiatives` (array of initiative slugs from `initiative-map.json` where this team appears as `allocatedTeam`) and `postRolloffCoveragePct` (for each allocated initiative: the estimated coverage percentage if the rolling-off members were removed from the team's skill pool — recomputed using the same coverage formula as wfp.12 but against the reduced post-rolloff member set). The `coverageRiskFlag` is set to true if `postRolloffCoveragePct` for any allocated initiative falls below 50% for any tag that was previously covered.

**AC5 (no endDate — treated as permanent):** Given a roster entry for a team member has no `endDate` field, when temporal risk is computed, then that member is not included in any quarter's `rolloffCount` or `rollingOffMembers`. They are counted in `currentMemberCount` and `remainingCount` for all quarters.

**AC6 (retired members excluded):** Given a roster entry has `retired: true`, when temporal risk is computed, then that member is excluded from `currentMemberCount`, `rolloffCount`, and `remainingCount` entirely — as if they do not exist in the team.

**AC7 (graceful fallback — no roster endDates):** Given no roster entry has an `endDate` field, when the temporal risk data is computed, then all `rolloffCount` values are 0, all `coverageRiskFlag` values are false, and the view renders a note: "No rolloff dates found in roster. Add `endDate` fields to roster entries to enable temporal risk analysis."

**AC8 (missing initiative-map):** Given `workforce/initiative-map.json` does not exist, then `postRolloffCoveragePct` and `allocatedInitiatives` are omitted from all team quarter objects. An informational message appears in the HTML: "Coverage impact not available — run `workforce-map` first."

## Out of Scope

- Writing to any `workforce/` or `portfolio/` file.
- Modelling hiring (adding new members) — this is a temporal observation of existing members only; hiring scenarios are in wfp.15.
- Rolling windows other than calendar quarters.
- Configuring `POST_ROLLOFF_COVERAGE_THRESHOLD` via UI or environment variable in Phase 2.
- Person-level temporal risk (this view is team-level; individual rolloff is surfaced as a secondary drill-down within a team cell).
- Modifying `src/web-ui/server.js` or any file under `src/web-ui/`.

## NFRs

- **Scale:** Must render and remain interactive for 200 roster entries, 40 teams, and 4 quarters without browser freeze. Rendering must complete within 3 seconds in Chrome.
- **Performance:** `GET /api/intelligence/temporal-risk-data` must return within 500 ms for 200 roster entries / 40 teams reading from local disk.
- **Security:** Both routes require `authGuard`. File path construction for portfolio slugs (if any) must pass the `/^[a-z0-9-]+$/` allowlist. Raw file paths must not appear in client-visible responses.
- **Date handling:** Quarter boundary computation uses the server's local date. The computation must be deterministic for a fixed input date (testable by injecting the current date via a `_nowOverride` parameter in the JSON endpoint, accepted only in `NODE_ENV === 'test'` mode).

## Complexity Rating

**Rating:** 2
**Rationale:** Quarter window computation, cumulative rolloff counting, and conditional coverage impact are straightforward date arithmetic and set operations on already-parsed JSON. No new server scaffolding. The `_nowOverride` test hook is the most careful implementation detail. Coverage impact (AC4) requires rerunning the coverage formula from wfp.12 against a reduced member set — this is a reuse of established logic, not new computation.
**Scope stability:** Stable. No new file writes. Data contracts established by Phase 1.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
