# Test Plan: Roster view — filterable and searchable workforce table

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.5.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Non-retired records shown in table with correct columns | 2 tests | — | 1 test | — | — | 🟢 |
| AC2 | Group filter and type filter work independently and combined | 4 tests | — | 1 test | — | — | 🟢 |
| AC3 | Date filter: endDate ≤ entered date; null excluded | 2 tests | — | — | — | — | 🟢 |
| AC4 | Search field filters by name and role case-insensitively in real time | 2 tests | — | 1 test | — | — | 🟢 |
| AC5 | Error message shown when fetch fails; no silent empty table | 1 test | — | 1 test | — | — | 🟢 |
| NFR-PERF | 500-record render under 2 seconds | 1 test | — | — | — | — | 🟢 |
| NFR-A11Y | Filter labels visible; table headers are `<th>`; colour contrast (manual) | 2 tests | — | — | 1 manual | Untestable-by-nature (contrast ratio) | 🟡 |
| NFR-SEC | No external network calls in rendered HTML | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Minimum colour contrast ratio 4.5:1 | NFR-A11Y | Untestable-by-nature | Actual computed contrast ratio requires real browser render + colour-contrast API — not deterministic in a string/DOM check | Manual scenario in AC verification script; CSS custom property values documented in HTML for human review 🟡 |

---

## Test Data Strategy

All test data is synthetic. No real PII. Fixtures generated inline.

- **Roster fixture:** 8-person JSON array containing: 2 persons retired, 2 with non-null endDate (one before a test date, one after), persons from 2 different productGroups, 2 different employmentTypes.
- **Rendering functions** are extracted to `dashboards/wfp-functions.js` (consistent with `viz-functions.js` architecture) and tested directly. Unit tests do not load a browser.
- **E2E tests** use Playwright; test spec at `tests/e2e/wfp5-roster-view.spec.js`; serve the repo root with a static file server started in `beforeAll`; use a synthetic `workforce/roster.json` pre-written before the server starts.

---

## Unit tests

Test file: `tests/check-wfp5-roster-view.js`
Run command: `node tests/check-wfp5-roster-view.js`
Source under test: `dashboards/wfp-functions.js` (exports `filterRoster`, `renderRosterRow`, `buildRosterTable`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `render-roster-table-excludes-retired` | AC1 | 8-person fixture with 2 retired persons | `buildRosterTable` returns HTML with 6 rows (not 8) |
| 2 | `render-roster-table-all-columns-present` | AC1 | Standard fixture | Rendered HTML contains `<th>` elements for name, team, squad, product group, role, employment type, end date, skills |
| 3 | `filter-roster-by-product-group` | AC2 | Fixture with 3 in "Platform", 2 in "Data"; filter by "Platform" | `filterRoster` returns 3 records |
| 4 | `filter-roster-clear-returns-all` | AC2 | Filter applied then cleared (empty string) | All non-retired records returned |
| 5 | `filter-roster-by-employment-type` | AC2 | Filter by "contractor" | Only contractor records returned |
| 6 | `filter-roster-combined-group-and-type` | AC2 | Filter by productGroup "Platform" AND employmentType "permanent" | Only records matching both |
| 7 | `filter-roster-date-before-shows-expiring` | AC3 | Fixture has endDate "2026-06-01" and "2026-12-01"; filter endingBefore "2026-07-01" | Only "2026-06-01" record returned |
| 8 | `filter-roster-date-null-excluded` | AC3 | Fixture has record with endDate null; date filter active | Null-endDate record excluded from results |
| 9 | `search-filters-by-name-case-insensitive` | AC4 | Search term "alex"; fixture has "Alex Rahi" | Record returned (case-insensitive match) |
| 10 | `search-filters-by-role` | AC4 | Search term "engineer"; fixture has role "Senior Engineer" | Record returned |
| 11 | `render-error-message-on-fetch-failure` | AC5 | `renderErrorState()` function | Returns HTML string containing "Roster data not found — run workforce-intake to generate workforce/roster.json" |
| 12 | `nfr-perf-500-records-render-under-2s` | NFR-PERF | `buildRosterTable` called with 500-record synthetic fixture | Wall time under 2,000 ms |
| 13 | `nfr-a11y-filter-labels-present` | NFR-A11Y | HTML source inspection | Rendered filter section contains `<label>` elements associated with each filter control |
| 14 | `nfr-a11y-table-headers-are-th` | NFR-A11Y | HTML source inspection | Column headers are `<th>` elements, not `<td>` |
| 15 | `nfr-sec-no-external-fetch-in-html` | NFR-SEC | Static analysis of `dashboards/workforce.html` source | No `fetch()` call with an absolute URL (http:// or https://); no `<script src="https://...">` |

---

## E2E tests

Test file: `tests/e2e/wfp5-roster-view.spec.js`
Run command: `npm run test:e2e -- --grep "wfp5"`
Prerequisite: `workforce/roster.json` fixture pre-written by test beforeAll hook; static file server started on localhost.

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| E1 | `e2e-roster-tab-renders-table` | AC1 | Navigate to workforce.html via localhost; click Tab 1 | Table is visible; at least 1 data row rendered |
| E2 | `e2e-group-filter-updates-rows` | AC2 | Select product group from dropdown | Only matching-group rows visible; other rows hidden |
| E3 | `e2e-search-filters-real-time` | AC4 | Type into search field without pressing Enter | Table rows update immediately; no search button pressed |
| E4 | `e2e-error-state-no-roster-file` | AC5 | Load page with roster.json absent from serve path | Error message text is visible; no empty table |

---

## Manual scenarios (NFR-A11Y contrast gap)

Verify in browser devtools:
- All text on the roster tab achieves at least 4.5:1 contrast ratio against background (use Chrome Accessibility → Computed → Contrast).
- Filter labels are visible in the rendered UI.

---

## Total test count

**15 unit + 4 E2E + 1 manual = 20 tests**
All automated tests are expected to FAIL before implementation (RED phase of TDD).
