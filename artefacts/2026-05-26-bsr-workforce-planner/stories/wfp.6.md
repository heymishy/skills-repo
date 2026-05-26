## Story: Initiative allocation matrix and FTE delta view

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md

## User Story

As a **Head of Engineering**,
I want to see each initiative's actual allocated FTE and cost alongside what was claimed in the portfolio submission, with a visual delta indicator,
So that I can identify over-claimed or under-resourced initiatives at a glance during a GM review session — without manually cross-referencing portfolio documents and roster data.

## Benefit Linkage

**Metric moved:** M2 — Pre-GM Initiative FTE Cross-Check Coverage
**How:** The allocation matrix view renders `workforce/initiative-map.json` visually. It makes M2 immediately confirmable: an operator can see at a glance whether all GM review pack initiatives have an entry in the map (coverage), and where the FTE delta is negative (over-claim). The view is the human interface to the data that M2 measures.

## Architecture Constraints

- Static HTML only — lives in the same `dashboards/workforce.html` file as the roster view (wfp.5). No separate file.
- No external CSS or JS libraries — inline only, consistent with repo style guide (architecture-guardrails.md).
- Reads `workforce/initiative-map.json` from a relative path using `fetch()`. No backend API call.
- Colour indicators must use CSS custom properties (e.g. `--color-gap-red`, `--color-surplus-green`) not hardcoded hex values.

## Dependencies

- **Upstream:** wfp.3 (workforce-map core) must be DoD-complete — this view reads `initiative-map.json` produced by wfp.3.
- **Upstream:** wfp.5 (roster view) must be implemented first — this view is an additional tab in the same HTML file; shared infrastructure (fetch, file-load error handling) is established in wfp.5.
- **Downstream:** None — this is a terminal view story for Epic 3.

## Acceptance Criteria

**AC1:** Given `workforce/initiative-map.json` exists and contains entries, when I navigate to the "Allocation Matrix" tab in `dashboards/workforce.html`, then each initiative is shown as a row with columns: initiative slug, allocation mode(s), allocated people count, computed FTE, claimed FTE (or "—" if null), FTE delta (or "—" if null), computed cost per quarter (NZD), and claimed cost (or "—" if null).

**AC2:** Given an initiative entry has `fteDelta` < 0 (actual FTE below claimed), when I view the matrix, then the FTE delta cell for that row is rendered in red and the row has a visual indicator (e.g. a border or background tint) distinguishing it from neutral or surplus rows. Given `fteDelta` ≥ 0 or is null, then no red colouring is applied to that row.

**AC3:** Given an initiative entry has `gap: true` (as set by wfp.3), when I view the matrix, then the row displays a "Gap" badge or label in the initiative slug column in addition to the red delta colouring.

**AC4:** Given I click on a person's name in the "allocated people" cell of the allocation matrix, then the dashboard switches to the Roster tab and the clicked person's row is visually highlighted (e.g. background colour change or scroll-into-view with a temporary highlight).

**AC5:** Given `workforce/initiative-map.json` cannot be fetched (file not found or invalid JSON), when I navigate to the Allocation Matrix tab, then a visible error message is shown: "Initiative map not found — run workforce-map to generate workforce/initiative-map.json". The tab does not display an empty table silently.

## Out of Scope

- Editing allocation entries from the browser — the dashboard is read-only; changes go through `workforce-map` (wfp.3/wfp.4).
- Showing the full list of allocated people names inline in the matrix table — only the count is shown in the default view. An expandable detail panel or tooltip showing names is a Phase 2 consideration.
- Sorting or column-reordering — rows are sorted by initiative slug alphabetically; no dynamic sorting for Phase 1.
- Hiring gap view and leadership coverage view — covered in wfp.7.

## NFRs

- **Performance:** The allocation matrix renders up to 50 initiative rows without visible lag on a modern browser.
- **Accessibility:** Table headers are `<th>` elements. Colour indicators are supplemented with text labels (e.g. "Gap") so the view is not colour-only.
- **Security:** No network calls to external origins. Reads only local relative-path JSON.

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
