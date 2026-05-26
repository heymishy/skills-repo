## Story wfp.13: Cross-portfolio bottleneck analysis — intelligence server

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Phase:** 2 (Intelligence Layer)
**Prerequisite:** wfp.12 DoD-complete (introduces `src/workforce-ui/server.js`).

## User Story

As a **Head of Engineering**,
I want a browser view that surfaces teams allocated to too many initiatives and skill tags concentrated in only one team across the whole portfolio,
So that I can identify single points of failure and over-stretched teams before a capacity crisis emerges, and prioritise reallocation or hiring decisions proactively.

## Benefit Linkage

**Metric moved:** M3 (Skill-Gap Identification Lead Time)
**How:** Bottleneck analysis answers a question the raw allocation map cannot: "which teams are at the centre of too many initiatives at once, and which skills would be lost portfolio-wide if a single team left?" Today this requires the operator to manually scan `initiative-map.json` across all initiatives, mentally tracking team appearance frequency and skill distribution. This story makes both signals visible in one view, reducing the time to identify a structural capacity risk from hours of cross-reference to a single page load.

## Architecture Constraints

- Delivered in the existing standalone intelligence server at `src/workforce-ui/server.js` introduced in wfp.12. No new server file.
- Single route: `GET /intelligence/bottlenecks` (returns HTML). Requires `authGuard`.
- A companion JSON endpoint `GET /api/intelligence/bottlenecks-data` returns the raw bottleneck signals for testing and future machine-readable consumption.
- `TEAM_BOTTLENECK_THRESHOLD` is a top-level constant in the route handler (default: `3`). It is not exposed as a UI control or environment variable in Phase 2.
- The route reads `workforce/teams.json`, `workforce/roster.json`, and `workforce/initiative-map.json` at request time using `fs.readFileSync`.
- Inline single-file HTML response, vanilla JS, no CDN, no framework.
- `src/web-ui/server.js` and `src/web-ui/routes/workforce.js` are not modified.

## Dependencies

- `src/workforce-ui/server.js` must exist (introduced by wfp.12).
- `workforce/teams.json`, `workforce/roster.json`, and `workforce/initiative-map.json` must exist. If `initiative-map.json` is absent, the page renders a "No allocation map found" message (same pattern as wfp.12 AC5).
- No dependency on the heat-map view itself — the bottleneck view is standalone within the same server.

## Acceptance Criteria

**AC1 (bottlenecks-data JSON — team bottlenecks):** Given `workforce/initiative-map.json` exists and at least one team entry appears as an `allocatedTeam` in 3 or more initiative entries, when I call `GET /api/intelligence/bottlenecks-data`, then the response includes a `teamBottlenecks` array. Each entry contains: `teamId`, `teamName`, `allocationCount` (number of initiatives the team is allocated to), `initiatives` (array of initiative slugs), and `members` (array of `{ name, skills }` from the roster for all non-retired team members). Only teams whose `allocationCount` is greater than or equal to `TEAM_BOTTLENECK_THRESHOLD` appear in this array. The array is sorted by `allocationCount` descending.

**AC2 (bottlenecks-data JSON — skill bottlenecks):** Given `workforce/initiative-map.json` exists, when I call `GET /api/intelligence/bottlenecks-data`, then the response includes a `skillBottlenecks` array. Each entry contains: `tag` (the skill tag string), `teamCount` (number of distinct teams in the portfolio allocation that have at least one member holding this tag), and `teams` (array of `{ teamId, teamName, memberCount }` for those teams). Only tags where `teamCount` is less than or equal to 1 (i.e. the tag exists in at most one team's collective skills across all allocated teams) appear in this array. Tags with `teamCount: 0` (no allocated team covers this tag) are included with `teams: []`. The array is sorted by `teamCount` ascending, then alphabetically by `tag`.

**AC3 (bottlenecks HTML — team bottleneck panel):** Given `GET /intelligence/bottlenecks` is called, then the response HTML contains a "Team Bottlenecks" section listing all entries from `teamBottlenecks` in the JSON response. Each entry shows the team name, the allocation count (highlighted in a warning colour when at or above threshold), and the list of initiative slugs it is allocated to. Clicking a team entry expands a drill-down panel listing the team's individual members with their skill tags.

**AC4 (bottlenecks HTML — skill bottleneck panel):** Given `GET /intelligence/bottlenecks` is called, then the response HTML contains a "Skill Bottlenecks" section listing all entries from `skillBottlenecks`. Each entry shows the tag name, the team count, and the teams that hold it (or "No allocated team holds this tag" when `teamCount: 0`). Tags with `teamCount: 0` are shown in a more prominent warning style than tags with `teamCount: 1`.

**AC5 (threshold constant):** Given `TEAM_BOTTLENECK_THRESHOLD` is set to `2` in the source code, when the server processes an allocation map where a team appears in exactly 2 initiatives, then that team appears in the `teamBottlenecks` array. When the team appears in exactly 1 initiative, it does not appear. The threshold comparison is `allocationCount >= TEAM_BOTTLENECK_THRESHOLD`.

**AC6 (graceful fallback — missing map):** Given `workforce/initiative-map.json` does not exist, when I call `GET /intelligence/bottlenecks`, then the response is `200 text/html` with a message: "No allocation map found. Run `workforce-map` first." No error or stack trace is visible.

**AC7 (only allocated teams considered):** Skill bottleneck analysis considers only the skill coverage of teams that appear in `initiative-map.json` as `allocatedTeam` entries. Teams present in `workforce/teams.json` that are not allocated to any initiative are excluded from the skill concentration calculation. This prevents unallocated teams from masking real bottlenecks.

## Out of Scope

- Writing to any `workforce/` or `portfolio/` file.
- Bottleneck analysis for individuals (person-level over-allocation is in wfp.11a/wfp.11b; this story is team and skill level only).
- Configuring `TEAM_BOTTLENECK_THRESHOLD` via environment variable, query parameter, or UI control.
- Suggestions or recommendations for how to resolve a bottleneck — this is an observability view only.
- Modifying `src/web-ui/server.js` or any file under `src/web-ui/`.

## NFRs

- **Scale:** The bottleneck analysis must complete and the HTML must render for 40 teams, 40 initiatives, and 200 roster entries within 2 seconds in Chrome on a modern laptop.
- **Performance:** `GET /api/intelligence/bottlenecks-data` must return within 300 ms for 40 teams / 40 initiatives / 200 roster entries reading from local disk.
- **Security:** Both routes require `authGuard`. Portfolio slug values from `initiative-map.json` must pass a `/^[a-z0-9-]+$/` allowlist before file path construction. Raw file system paths must not appear in client-visible responses.
- **Observability:** Stderr warning printed for each initiative slug in `initiative-map.json` that has no corresponding `portfolio/[slug].json` file.

## Complexity Rating

**Rating:** 2
**Rationale:** Two distinct bottleneck computations (team frequency count and tag concentration) against already-parsed JSON. The set operations are simple. No new server scaffolding (server exists from wfp.12). The main risk is edge-case handling (unallocated teams, missing portfolio files, empty roster skills arrays).
**Scope stability:** Stable. Data contracts established by Phase 1. No new file writes.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
