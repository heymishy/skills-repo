## Story: Interactive allocation assignment UI — Story B: person-centric and squad-centric views

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Formally split from:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.11.md
**Prerequisite story:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.11a.md

## User Story

As a **Head of Engineering**,
I want to view and edit workforce assignments grouped by person and by squad within the existing assignment UI,
So that I can identify over-allocated individuals, assign whole squads to initiatives in a single action, and keep all three views in sync without losing staged changes when navigating between them.

## Benefit Linkage

**Metric moved:** M1 (Workforce + Initiative Reconciliation Time) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** wfp.11a delivers the initiative-centric view, which is sufficient for a basic assignment loop. But many reconciliation cycles start from a people or squad perspective — "who is Alex assigned to?" or "can the Platform squad absorb Initiative X?". Without person and squad views, the operator must mentally cross-reference the initiative list or open the static workforce.html tab. This story adds those views to the same assignment UI, sharing the same in-memory state established in wfp.11a. The over-allocation flag surfaces capacity risk early in the planning cycle, directly reducing the rework loop that inflates M1. Full three-view coverage means M2 cross-check coverage can be achieved without leaving the browser at all.

## Architecture Constraints

- No new routes are introduced. All four routes (`GET /workforce`, `GET /workforce/data`, `POST /workforce/allocations`, `POST /workforce/run-map`) are established by wfp.11a. This story extends the HTML served by `handleGetWorkforceHtml` only.
- The person-centric and squad-centric views are added to the same single-file HTML as the initiative-centric view (wfp.11a). All CSS and JavaScript remain inline — no external files, no build step, no CDN requests.
- The three views share a single in-memory state object (the staged allocation map) in the inline script. Mutations in any view update the shared state. Navigation between views does not reinitialise or reload the data from the server.
- Vanilla JS only. No framework, no CDN, no npm runtime dependencies. The `OVER_ALLOCATION_THRESHOLD` constant is defined once at the top of the inline script and used by both the person-centric view and any initiative-centric over-allocation indicator added in this story.
- The existing static `dashboards/workforce.html` remains unchanged.
- The four route handlers in `src/web-ui/routes/workforce.js` must not be modified unless a bug fix in wfp.11a requires it. If a modification is required, it must be explicitly justified and scoped.

## Dependencies

- **Upstream:** wfp.11a must be DoD-complete. The route layer, data loading, save/run-map flow, initiative-centric view, and `OVER_ALLOCATION_THRESHOLD` constant scaffold are all in scope for wfp.11a. This story builds on top of that delivered HTML/JS.
- **Upstream:** wfp.9 and wfp.10 (same as wfp.11a) — the roster and scoring exports are used in both stories. No additional exports are required beyond those confirmed for wfp.11a.
- **Server context:** `src/web-ui/routes/workforce.js` and the HTML served by `handleGetWorkforceHtml` must be read before making any changes. The inline JS state management pattern established in wfp.11a must be extended, not replaced.

## Acceptance Criteria

**AC6 (person-centric view):** Given the operator navigates to the person-centric view tab, when the view renders, then it lists all people from `roster` filterable by product group, employment type, squad, and skill tag. Selecting a person shows: all initiatives they are currently assigned to (from both saved `allocationInput` and in-memory staged changes); their total FTE commitment count across all assignments; and their skill tags. The operator can add or remove initiative assignments from this view. A person whose total assignment count exceeds `OVER_ALLOCATION_THRESHOLD` is visually flagged in both the list and the detail panel (e.g. a warning colour on the FTE commitment count). Staged changes made in the person-centric view are consistent with changes made in the initiative-centric view — they share the same in-memory state.

**AC7 (squad-centric view):** Given the operator navigates to the squad-centric view tab, when the view renders, then it lists all squads (derived from distinct `squad` values in `roster`) filterable by product group. Selecting a squad shows: all initiatives any squad member is assigned to; aggregate FTE commitment count across the squad; and the union of skill tags across all squad members. The operator can assign the entire squad to an initiative, or remove the entire squad from an initiative, in a single action. "Assign squad to initiative" shows a picker of all initiatives. The action stages all squad members as individual person entries in the in-memory allocation for that initiative.

**AC11 (cross-view navigation and unsaved changes consistency):** Given the operator has staged one or more changes in any view, when the operator navigates to any other view, then the staged changes are preserved in the shared in-memory state and are reflected in the newly rendered view immediately. The "You have unsaved changes" banner (established in wfp.11a) remains visible across all three views until the changes are saved. The total staged-changes count is consistent regardless of which view is active. On page reload all unsaved changes are lost across all views equally (no localStorage persistence required for Phase 1).

## Out of Scope

- New server routes — all routes are established by wfp.11a.
- Changes to `GET /workforce/data`, `POST /workforce/allocations`, or `POST /workforce/run-map` handler logic — route handlers are frozen after wfp.11a unless a bug fix is required.
- Modifying `dashboards/workforce.html`.
- LocalStorage or session persistence of unsaved changes.
- Exposing `OVER_ALLOCATION_THRESHOLD` via a UI control or server configuration — Phase 1 is a constant in the inline script only.
- Real-time multi-user collaboration.
- Streaming `workforce-map` output — already handled in wfp.11a.

## NFRs

- **Scale:** The person-centric view must render and remain interactive with 200 roster entries. The squad-centric view must handle 40 squads. Filtering in both views must update the displayed list synchronously on every keystroke.
- **Performance:** Navigating between views must not trigger additional `GET /workforce/data` requests after the initial page load. All three views use the data already loaded into memory.
- **Compatibility:** The UI must be navigable at 1280px width in Chrome and Firefox without horizontal scrolling across all three views. No IE or legacy browser support required.
- **Observability:** No new server-side logging is required beyond what wfp.11a establishes. Client-visible error messages must not include raw file paths or stack traces.

## Complexity Rating

**Rating:** 2
**Rationale:** The route layer and data loading are established by wfp.11a. This story is pure UI work — two additional view panels in the same inline HTML/JS, sharing the existing in-memory state object. The person-centric view has the most logic (over-allocation flag, filtering by four dimensions). The squad-centric bulk-assign action requires care with the shared state update. No new route handlers, no new file writes, no child-process execution.
**Scope stability:** Stable. No new server-side contracts. The shared state pattern is defined by wfp.11a; this story extends it.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
