# Test Plan: Skill coverage heat map — intelligence server

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.12.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | heat-map-data JSON — tags, initiatives, cells, coverageByInitiative, coverageByProductGroup | 4 tests | 1 test | — | — | — | 🟢 |
| AC2 | heat-map HTML — colour-coded grid, product-group rows, missing-portfolio visual distinction | 2 tests | — | — | 1 scenario (visual colour rendering) | CSS-layout-dependent | 🟡 |
| AC3 | cell drill-down panel — covered vs uncovered states | 2 tests | — | — | — | — | 🟢 |
| AC4 | initiative filter — product-group filter updates column set; row set unchanged | 2 tests | — | — | — | — | 🟢 |
| AC5 | missing initiative-map graceful fallback — 200 HTML with message | — | 1 test | — | — | — | 🟢 |
| AC6 | missing portfolio file — vacuous coverage, missingPortfolioFile: true | 2 tests | — | — | — | — | 🟢 |
| NFR-PERF | GET /api/intelligence/heat-map-data responds within 500ms at scale | — | 1 test | — | — | — | 🟢 |
| NFR-SEC | Both routes require authGuard; portfolio slug allowlist enforced | 2 tests | — | — | — | — | 🟢 |
| NFR-COMPAT | 1280px viewport — no horizontal scroll for ≤20 initiatives | — | — | — | 1 scenario | CSS-layout-dependent | 🔴 RISK-ACCEPT |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest/Node | Handling |
|-----|----|----------|---------------------------------|---------|
| Cell colour saturation (green vs grey vs striped) | AC2 | CSS-layout-dependent | CSS rendering not computed in jsdom/Node assertions | Manual scenario in verification script — see Scenario 2b 🟡 |
| Horizontal scroll at 1280px for >20 initiatives | NFR-COMPAT | CSS-layout-dependent | CSS layout not computed in Node | Manual scenario — RISK-ACCEPT in decisions; post-deploy smoke step |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity in scope:** No — fixture uses fake names (Alice Smith, Bob Jones), fake team IDs (team-alpha, team-beta), fake initiative slugs (initiative-x, initiative-y)
**Availability:** Available now — all data generated inline in test setup
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | teams.json (2 teams), roster.json (4 members with skills), initiative-map.json (2 initiatives), portfolio/*.json (requiredTags) | Synthetic | None | In-memory fixture objects passed to compute function |
| AC2 | Same as AC1 | Synthetic | None | HTML string assertion on response body |
| AC3 | AC1 fixture + cell coordinate | Synthetic | None | Trigger onclick logic; assert panel HTML content |
| AC4 | AC1 fixture + product group assignment | Synthetic | None | Two product groups in fixture |
| AC5 | No initiative-map.json | Synthetic (omit file) | None | Use temp dir or mock fs.readFileSync |
| AC6 | initiative-map.json with slug that has no portfolio file | Synthetic | None | Missing portfolio file for one initiative slug |
| NFR-PERF | 200-person roster, 40 teams, 40 initiatives | Synthetic (generated in test) | None | Scale fixture; assert timing |
| NFR-SEC | Fixture with slug containing `../` and valid slug | Synthetic | None | Assert 400 or omit for invalid slug |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### computeHeatMapData — tags union is alphabetically sorted

- **Verifies:** AC1
- **Precondition:** Roster has members with skills `["java", "kafka"]` and `["python", "java"]`
- **Action:** Call `computeHeatMapData(teams, roster, initiativeMap, portfolioFiles)` with the fixture
- **Expected result:** `tags` array is `["java", "kafka", "python"]` (sorted alphabetically, deduplicated)
- **Edge case:** No — baseline behaviour

### computeHeatMapData — cell coverage: covered when allocated team member holds tag

- **Verifies:** AC1
- **Precondition:** team-alpha allocated to initiative-x; Alice (team-alpha) has skill `"java"`; initiative-x requiredTags includes `"java"`
- **Action:** Call `computeHeatMapData` with fixture
- **Expected result:** `cells["java|initiative-x"].covered === true` and `cells["java|initiative-x"].coveringTeams[0].teamId === "team-alpha"`
- **Edge case:** No

### computeHeatMapData — cell uncovered when no allocated team member holds tag

- **Verifies:** AC1
- **Precondition:** initiative-x requires tag `"golang"`; no member in allocated team has `"golang"` in skills
- **Action:** Call `computeHeatMapData` with fixture
- **Expected result:** `cells["golang|initiative-x"].covered === false` and `coveringTeams` is `[]`
- **Edge case:** No

### computeHeatMapData — coverageByInitiative pct calculation

- **Verifies:** AC1
- **Precondition:** initiative-x requiredTags `["java", "golang"]`; 1 of 2 required tags covered
- **Action:** Call `computeHeatMapData`
- **Expected result:** `coverageByInitiative["initiative-x"].coveredCount === 1`, `requiredCount === 2`, `coveragePct === 50`
- **Edge case:** No

### heat-map HTML contains grid structure with required elements

- **Verifies:** AC2
- **Precondition:** Server running with fixture data
- **Action:** GET /intelligence/heat-map (authenticated session); parse HTML response
- **Expected result:** HTML contains: `<table` or grid container; row headers with tag strings from `tags` array; column headers with initiative slugs; no external CSS/JS hrefs (inline only); no `<script src=` tags pointing to external CDN
- **Edge case:** No

### heat-map HTML marks missing-portfolio initiatives distinctly

- **Verifies:** AC2
- **Precondition:** One initiative in fixture has `missingPortfolioFile: true`
- **Action:** GET /intelligence/heat-map
- **Expected result:** HTML contains a striped or hatched indicator on that initiative's column header AND a tooltip text matching "No portfolio file"
- **Edge case:** No

### drill-down panel — covered cell shows team members with skills

- **Verifies:** AC3
- **Precondition:** `cells["java|initiative-x"].covered === true`; coveringTeams has Alice (skills: `["java", "kafka"]`)
- **Action:** Trigger the onclick handler for cell `java|initiative-x` (call the inline JS function with cell data)
- **Expected result:** Detail panel HTML contains "Alice", contains `["java", "kafka"]`, does NOT contain "No allocated team member holds this tag"
- **Edge case:** No

### drill-down panel — uncovered cell shows no-coverage message and team summary

- **Verifies:** AC3
- **Precondition:** `cells["golang|initiative-x"].covered === false`; initiative-x has team-alpha allocated with 2 members
- **Action:** Trigger onclick handler for cell `golang|initiative-x`
- **Expected result:** Detail panel HTML contains "No allocated team member holds this tag"; also contains team-alpha name and its members' skill summaries
- **Edge case:** No

### initiative filter — column set changes to selected product group only

- **Verifies:** AC4
- **Precondition:** Fixture has initiatives from "Product Group A" (initiative-x) and "Product Group B" (initiative-y)
- **Action:** Trigger product-group filter for "Product Group A" (call inline filter function)
- **Expected result:** Only `initiative-x` column is visible (not hidden/removed); `initiative-y` column hidden. Tag row labels (row count) unchanged.
- **Edge case:** No

### initiative filter — row set unchanged after filtering

- **Verifies:** AC4
- **Precondition:** Fixture has 4 unique tags
- **Action:** Apply product-group filter then check rows
- **Expected result:** Row count remains 4 (all tags still rendered)
- **Edge case:** No

### missingPortfolioFile: true included in coverageByInitiative when portfolio absent

- **Verifies:** AC6
- **Precondition:** initiative-map.json has slug `orphan-initiative`; no `portfolio/orphan-initiative.json` exists
- **Action:** Call `computeHeatMapData`
- **Expected result:** `coverageByInitiative["orphan-initiative"].missingPortfolioFile === true`, `requiredCount === 0`, `coveragePct === 100`
- **Edge case:** No

### vacuous 100% coverage when portfolio file missing

- **Verifies:** AC6
- **Precondition:** Same as above
- **Action:** Same as above
- **Expected result:** `coveredCount === 0`, `coveragePct === 100` (vacuously), `missingPortfolioFile === true`
- **Edge case:** Yes — vacuous 100% is a specific semantic; must not be confused with real 100%

### authGuard blocks unauthenticated request to heat-map-data endpoint

- **Verifies:** NFR-SEC
- **Precondition:** Request with no session / expired session
- **Action:** GET /api/intelligence/heat-map-data without session cookie
- **Expected result:** Response is 302 redirect to auth page (or 401) — not 200
- **Edge case:** No

### slug allowlist rejects path traversal attempt in portfolio file read

- **Verifies:** NFR-SEC
- **Precondition:** initiative-map.json contains slug `../secrets`
- **Action:** Call `computeHeatMapData` or make GET /api/intelligence/heat-map-data
- **Expected result:** No file read attempted for `../secrets`; warning emitted to stderr; initiative treated as if portfolio file absent (`missingPortfolioFile: true`)
- **Edge case:** Yes — security boundary

---

## Integration Tests

### GET /api/intelligence/heat-map-data returns 200 with full shape at 40-initiative scale

- **Verifies:** AC1, NFR-PERF
- **Components involved:** HTTP server, computeHeatMapData, fs.readFileSync
- **Precondition:** Fixture files: teams.json (40 teams), roster.json (200 members), initiative-map.json (40 initiatives), portfolio/*.json (40 files with requiredTags)
- **Action:** GET /api/intelligence/heat-map-data; record elapsed time
- **Expected result:** Status 200; response body has `tags`, `initiatives`, `cells`, `coverageByInitiative`, `coverageByProductGroup`; elapsed time < 500ms

### GET /intelligence/heat-map returns 200 HTML with graceful fallback when initiative-map.json absent

- **Verifies:** AC5
- **Components involved:** HTTP server, fs.readFileSync (file-not-found path)
- **Precondition:** Temp directory with teams.json and roster.json but NO initiative-map.json
- **Action:** GET /intelligence/heat-map (authenticated)
- **Expected result:** Status 200; response body HTML contains "No allocation map found" and "workforce-map"

---

## NFR Tests

### NFR-PERF — heat-map-data endpoint returns within 500ms at scale

- **Verifies:** NFR-PERF
- **Precondition:** 200-person roster, 40 teams, 40 initiatives (generated in-memory; written to temp dir)
- **Action:** GET /api/intelligence/heat-map-data; measure response time
- **Expected result:** Elapsed ≤ 500ms. Test is annotated as `@scale` — skip in fast CI with `SKIP_SCALE_TESTS=1`.

### NFR-SEC — authGuard applied to both routes

- **Verifies:** NFR-SEC
- **Precondition:** Unauthenticated session (no cookie / no `req.session.userId`)
- **Action:** GET /api/intelligence/heat-map-data; GET /intelligence/heat-map (both without auth)
- **Expected result:** Both return non-200 (redirect or 401); no data leaked in response body
