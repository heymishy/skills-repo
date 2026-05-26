## Story wfp.12: Skill coverage heat map — intelligence server

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Phase:** 2 (Intelligence Layer)
**Prerequisite:** Phase 1 complete (wfp.11b DoD-complete); `workforce/teams.json`, `workforce/roster.json`, `workforce/initiative-map.json` written by Phase 1 tools.

## User Story

As a **Head of Engineering**,
I want a browser-based skill coverage heat map that shows, at a glance, which skill tags each allocated initiative covers and which are gaps,
So that I can identify under-covered initiatives before the General Manager review and target capability development or reallocation at the specific skills the portfolio most needs.

## Benefit Linkage

**Metric moved:** M2 (Pre-GM Initiative FTE Cross-Check Coverage) and M3 (Skill-Gap Identification Lead Time)
**How:** The heat map converts initiative-map.json (a structured JSON file) into a visual grid where under-coverage is immediately visible by colour saturation rather than requiring the operator to manually cross-reference requiredTags against allocation entries. M2 coverage improves because the operator can confirm skill alignment for all initiatives in a single browser view rather than opening each portfolio slug. M3 is directly addressed — the heat map is the artefact the story is designed to produce; identifying a skill gap drops from minutes of manual cross-reference to seconds of visual scan.

## Architecture Constraints

- Delivered in a standalone server at `src/workforce-ui/server.js`, started via `npm run workforce`.
- Same server conventions as `src/web-ui/server.js`: `authGuard` middleware, `if/else if` route chain, Node built-ins only, zero new npm runtime dependencies.
- Does NOT share route handlers with the main web UI. `src/web-ui/routes/workforce.js` is not modified by this story.
- Two routes: `GET /intelligence/heat-map` (returns HTML) and `GET /api/intelligence/heat-map-data` (returns JSON). Both require `authGuard`.
- The heat-map HTML is served as an inline single-file response (no separate static file). All CSS and JavaScript are inline.
- Cell click drill-down is handled via vanilla JS in the inline script — no framework, no CDN requests.
- The server reads `workforce/teams.json`, `workforce/roster.json`, and `workforce/initiative-map.json` at request time using `fs.readFileSync`. No in-memory caching between requests in Phase 2.

## Dependencies

- `workforce/teams.json` must exist (written by `workforce-ingest`, wfp.1).
- `workforce/roster.json` must exist (written by `workforce-ingest`, wfp.1).
- `workforce/initiative-map.json` must exist (written by `workforce-map`, wfp.3). If absent, the route returns a 200 HTML page with a "No allocation map found — run `workforce-map` first" message.
- `portfolio/[slug].json` files are read to retrieve `requiredTags` per initiative. If a portfolio file is missing for an initiative slug in `initiative-map.json`, the `requiredTags` for that initiative is treated as an empty array and a warning is included in the JSON response.
- `src/workforce-ui/server.js` is introduced by this story. The server must be registered in `package.json` under `scripts.workforce`.

## Acceptance Criteria

**AC1 (heat-map-data JSON endpoint):** Given `workforce/teams.json`, `workforce/roster.json`, and `workforce/initiative-map.json` all exist, when I call `GET /api/intelligence/heat-map-data`, then the response is `200 application/json` containing: `tags` (array of all unique skill tag strings from the union of all `skills` arrays in `roster.json`, sorted alphabetically), `initiatives` (array of initiative slugs from `initiative-map.json`), `cells` (object keyed by `"[tag]|[slug]"` with value `{ covered: boolean, coveringTeams: [{ teamId, teamName, members: [{ name, skills }] }] }` where `covered` is true if at least one member of an allocated team for that initiative has the tag in their `skills` array), `coverageByInitiative` (object keyed by slug with value `{ coveredCount, requiredCount, coveragePct }` where `requiredCount` is the length of the initiative's `requiredTags` array and `coveredCount` is how many of those tags are present in the union of member skills across all teams allocated to that initiative), and `coverageByProductGroup` (object keyed by product group with averaged `coveragePct` across all initiatives in that group).

**AC2 (heat-map HTML view):** Given `GET /intelligence/heat-map` is called with a valid authenticated session, then the response is `200 text/html` containing a colour-coded grid where rows are skill tags and columns are initiatives. Each cell's background saturation represents the coverage status: full coverage = solid filled (e.g. green), no coverage = unfilled (e.g. light grey), partial coverage is not applicable at cell level (a cell is either covered or not by a specific tag). Column headers are initiative slugs (truncated with a tooltip for long names). Row labels are tag strings. A secondary aggregation row at the bottom of each product group section shows the overall coverage percentage for that group across all its initiatives. Initiatives where `missingPortfolioFile: true` (as returned in AC6) must be visually distinguished from fully-covered initiatives — e.g. a hatched or striped column header with a tooltip: "No portfolio file — required tags unknown. Coverage is vacuously 100%." This ensures an operator can distinguish a genuinely well-covered initiative from one where coverage appears complete only because no requirements were defined.

**AC3 (cell drill-down):** Given the heat-map view is rendered, when the operator clicks any cell, then a detail panel appears (e.g. a sidebar or modal) showing: the tag name, the initiative slug, whether it is covered, and — if covered — the list of team members who hold that tag, grouped by team. Each member shows their name and full `skills` array. If not covered, the panel shows: "No allocated team member holds this tag" and lists the teams currently allocated to the initiative with their member skill summaries.

**AC4 (initiative filter):** Given the heat-map view is rendered, when the operator uses the product-group filter control, then the column set is filtered to show only initiatives in the selected product group. The row set (tags) does not change — all tags across all initiatives remain visible for consistent row layout.

**AC5 (missing initiative-map graceful fallback):** Given `workforce/initiative-map.json` does not exist, when I call `GET /intelligence/heat-map`, then the response is a 200 HTML page displaying: "No allocation map found. Run `workforce-map` first to generate `workforce/initiative-map.json`." No error or stack trace is visible in the page.

**AC6 (requiredTags missing for an initiative):** Given an initiative in `initiative-map.json` has no corresponding `portfolio/[slug].json` file, when the heat-map data is computed, then `requiredCount` for that initiative is 0 and `coveragePct` is 100 (vacuously covered). A warning field `missingPortfolioFile: true` is included in the `coverageByInitiative` entry for that slug.

## Out of Scope

- Writing to any `workforce/` or `portfolio/` file.
- Real-time updates (the page is static on load; the operator refreshes to pick up new data).
- Row filtering by tag — all tags are always shown in the row axis.
- Export to CSV or PDF.
- Integration with the Phase 1 assignment UI (wfp.11a/wfp.11b) routes — the intelligence server is separate.
- Modifying `src/web-ui/server.js` or any file under `src/web-ui/`.

## NFRs

- **Scale:** The heat-map HTML must render and remain interactive with 200 roster entries, 40 initiatives, and up to 200 unique tags without browser freeze. Rendering must complete within 3 seconds at this scale in Chrome on a modern laptop.
- **Performance:** `GET /api/intelligence/heat-map-data` must return a response within 500 ms when reading 200 roster entries, 40 initiatives, and 40 teams from local disk. No in-memory caching is required.
- **Security:** Both routes require `authGuard`. Portfolio slug values read from `initiative-map.json` must pass a `/^[a-z0-9-]+$/` allowlist before being used to construct a file path. Raw file paths must not appear in error responses.
- **Observability:** A warning is printed to stderr for each initiative slug where the portfolio file is missing. The client-visible response includes `missingPortfolioFile: true` per initiative but does not include raw file paths.
- **Compatibility:** The heat-map HTML must be navigable at 1280px width in Chrome and Firefox without horizontal scrolling for up to 20 initiatives. At more than 20 initiatives, horizontal scroll on the grid is acceptable.

## Complexity Rating

**Rating:** 2
**Rationale:** New standalone server (first Phase 2 story — introduces `src/workforce-ui/server.js`) plus one analytical view with a data join across three JSON files. The coverage computation is straightforward set intersection. The cell click drill-down is vanilla JS. The main complexity is the server scaffolding (first story in Phase 2) and getting the HTML rendering fast enough for 200×40 cells.
**Scope stability:** Stable. Data contracts are established by Phase 1. No new file writes.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
