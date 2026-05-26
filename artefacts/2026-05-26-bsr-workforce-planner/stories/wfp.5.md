## Story: Roster view — filterable and searchable workforce table

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md

## User Story

As a **Head of Engineering**,
I want to view and filter the full workforce roster in a browser-based dashboard without opening any xlsx file,
So that I can quickly answer headcount and availability questions during planning sessions — for example, who is a contractor ending before Q3, or which squad has a chapter lead.

## Benefit Linkage

**Metric moved:** M1 — Workforce + Initiative Reconciliation Time
**How:** The roster view replaces the step of opening and cross-referencing xlsx files to answer "who do we have." It contributes to keeping the total end-to-end answer time below 10 minutes — specifically the data discovery portion that today takes the longest.

## Architecture Constraints

- Static HTML only — `dashboards/workforce.html` must be served by a local static file server (`npx serve .` from the repo root, or `python -m http.server`, or equivalent). Direct `file://` loading is not supported: modern browsers (Chrome, Edge, Firefox) block `fetch()` from `file://` origins due to CORS restrictions, which silently prevents roster data from loading. No build step or backend is required — any static file server running locally is sufficient. Consistent with existing `dashboards/` convention (architecture-guardrails.md).
- No external CSS or JS libraries (Bootstrap, React, Vue, etc.) — all styles and scripts inline in the single HTML file.
- CSS custom properties for all colours and spacing values — consistent with `dashboards/pipeline-viz.html` style guide.
- The dashboard reads `workforce/roster.json` using `fetch()` from a relative path. It does not call any external API or backend service.

## Dependencies

- **Upstream:** wfp.1 (workforce-intake) must be DoD-complete — the dashboard reads `workforce/roster.json`. Without a valid roster file, the dashboard has no data to display.
- **Downstream:** wfp.6 and wfp.7 share the same HTML file; the roster view is the first tab/view in `dashboards/workforce.html`.

## Acceptance Criteria

**AC1:** Given `workforce/roster.json` exists at the expected relative path, when I open `dashboards/workforce.html` via a local static server (e.g. `npx serve .` from the repo root; navigate to `http://localhost:[port]/dashboards/workforce.html`), then all non-retired person records are displayed in a table with columns: name, team, squad, product group, role, employment type, end date, and a skills tag list.

**AC2:** Given the dashboard is open, when I select a product group from the group filter dropdown, then only records whose `productGroup` matches the selection are shown; when I clear the filter, all records are shown again. When I select an employment type from the type filter, then only records of that type are shown. Both filters can be active simultaneously.

**AC3:** Given the dashboard is open, when I enter a date into the "ending before" filter, then only records with a non-null `endDate` that is on or before the entered date are shown. Records with `endDate: null` are excluded from date-range filtered results.

**AC4:** Given the dashboard is open, when I type text into the search field, then records are filtered in real time (no submit button required) to show only rows where the `name` or `role` field contains the search text, case-insensitively.

**AC5:** Given `workforce/roster.json` cannot be fetched (file not found or invalid JSON), when I open the dashboard, then a visible error message is displayed in the page body: "Roster data not found — run workforce-intake to generate workforce/roster.json". The page does not silently show an empty table.

## Out of Scope

- Editing or creating roster records from the browser — the dashboard is read-only; updates go through the `workforce-update` skill (wfp.2).
- Displaying retired records by default — retired people (where `retired: true`) are hidden in the default view. A "Show retired" toggle is a Phase 2 consideration.
- Pagination — for up to ~500 records, all rows are rendered. Pagination is a Phase 2 consideration.
- Initiative allocation matrix, FTE delta, hiring gap, and leadership coverage views — covered in wfp.6 and wfp.7.
- Exporting or downloading the roster from the browser.

## NFRs

- **Performance:** The roster view renders up to 500 records with no visible lag on a modern browser (Chrome/Edge/Firefox latest stable).
- **Accessibility:** Filter controls and the search field have visible labels. Table headers are `<th>` elements. Minimum colour contrast ratio 4.5:1 for all text.
- **Security:** The dashboard makes no network calls to external origins. It reads only local relative-path JSON files.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
