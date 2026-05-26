## Story: Interactive allocation assignment UI — Story A: server routes and initiative-centric view

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Formally split from:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.11.md
**Follow-on story:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.11b.md

## User Story

As a **Head of Engineering**,
I want an interactive browser UI within the existing web UI where I can view all portfolio initiatives, see ranked candidate squads and people for each, and author or update `workforce/allocation-input.json` without hand-editing JSON or running terminal commands,
So that I can complete a full assignment-to-reconciliation loop (author allocations, save, run workforce-map, review the gap report) within a single browser session.

## Benefit Linkage

**Metric moved:** M1 (Workforce + Initiative Reconciliation Time) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** The existing static `dashboards/workforce.html` is read-only — it surfaces reconciliation output but provides no path for authoring the `allocation-input.json` that feeds `workforce-map`. Today an operator must hand-author that JSON in a terminal, which is the largest single friction point before M1 can be measured at all. This story removes that friction: the assignment UI lets the operator view initiatives, select candidates ranked by skill-tag match score (wfp.10), stage changes, and save with a single button. The "Run workforce-map" button returns the gap report directly in the browser. Story A alone is sufficient to complete the first GM session workflow end-to-end. Story B (wfp.11b) extends it with person and squad views.

## Architecture Constraints

- No new npm runtime dependencies. Use only what is already in `package.json` or Node built-ins (`node:http`, `node:fs`, `node:child_process`, `node:path`).
- Four new route handlers are added to `src/web-ui/server.js` following its existing `if/else if` chain on `pathname + req.method`. Each handler must follow the established pattern — `authGuard(req, res, async () => { await handleXxx(req, res); })` for protected routes. Do not create a separate server file; do not bypass `authGuard`.
- Route handler implementations live in a new file `src/web-ui/routes/workforce.js`, exported as named functions and imported at the top of `server.js` alongside existing route imports. The four routes and their handlers are: `GET /workforce` → `handleGetWorkforceHtml`; `GET /workforce/data` → `handleGetWorkforceData`; `POST /workforce/allocations` → `handlePostWorkforceAllocations`; `POST /workforce/run-map` → `handlePostWorkforceRunMap`.
- The workforce assignment UI HTML is a single file served inline by `handleGetWorkforceHtml`. All CSS and JavaScript are inline — no external files, no build step, no CDN requests. CSS custom properties for all colours and spacing, consistent with the existing web UI conventions in the repo.
- Vanilla JS only — no React, Vue, Angular, or any framework. The UI must be navigable at 1280px laptop width without horizontal scrolling.
- The existing static `dashboards/workforce.html` read-only tabs (roster, allocation matrix, FTE delta, hiring gaps, initiative rollup) remain unchanged. This story does not modify `dashboards/workforce.html`.
- `workforce-map` is triggered server-side via `child_process.spawn`, not a direct `require`. Stdout and stderr from the child process are collected and returned as a JSON response body — not streamed via SSE. The response is sent after the process exits.
- Path traversal protection on `GET /workforce/data`: portfolio slug filenames are sanitised before constructing file paths. Any slug that does not match `/^[a-z0-9-]+$/` is rejected and omitted from the response with a warning logged to stderr. No dynamic path construction from unsanitised request input.
- `POST /workforce/allocations` writes `workforce/allocation-input.json` atomically: write to `workforce/allocation-input.json.tmp`, validate the written content is parseable JSON, then rename over the target. If the rename fails the tmp file is removed and a 500 response is returned.
- The UX is designed for: ~200 people in the roster, ~40 squads across 5 product groups, ~40 initiatives in the portfolio.
- Story A delivers the initiative-centric view only. Navigation tabs for the person-centric and squad-centric views are present in the HTML (to avoid a breaking layout change in wfp.11b) but are rendered as disabled or marked "coming in Phase 2". Do not implement person-centric or squad-centric view logic — that is wfp.11b.

## Dependencies

- **Upstream:** wfp.9 (workforce-assign) must be DoD-complete — `allocation-input.json` format is established there; this UI reads and writes the same schema.
- **Upstream:** wfp.10 (skill-tag match scoring) must be DoD-complete — the UI reuses the same scoring logic to rank candidate people and squads per initiative. The wfp.10 DoR contract (`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.10-dor-contract.md`) confirms that `scoreSquadForSlug(squad, requiredTags)` is exported from `src/workforce/assign.js` as a named function. The `src/web-ui/routes/workforce.js` handler must `require` and call `scoreSquadForSlug` directly — do not reimplement the scoring formula inline. This dependency is resolved; no extraction task is needed.
- **Upstream:** wfp.3 and wfp.4 (workforce-map script) must be DoD-complete — the "Run workforce-map" button triggers this as a child process; the script path must exist at the time wfp.11a is implemented.
- **Non-blocking:** wfp.5–wfp.8 (static dashboard tabs) are independent; this story does not modify them.
- **Server context:** `src/web-ui/server.js` must be read before writing any implementation. The new route registrations must follow the exact `if/else if` + `authGuard` pattern already established in that file.

## Acceptance Criteria

**AC1 (route registration — GET /workforce):** Given `src/web-ui/server.js` is running and the operator is authenticated, when a `GET /workforce` request is received, then `authGuard` is applied and `handleGetWorkforceHtml` is called, which returns a `200 text/html; charset=utf-8` response containing the single-file assignment UI. The route is registered in `server.js` using the same `else if (pathname === '/workforce' && req.method === 'GET')` pattern as existing routes such as `/skills`, `/journey`, and `/actions`.

**AC2 (route registration — GET /workforce/data):** Given the operator is authenticated, when `GET /workforce/data` is called, then `authGuard` is applied and `handleGetWorkforceData` returns a `200 application/json` response containing a single object with the following keys: `roster` (parsed contents of `workforce/roster.json`), `initiativeMap` (parsed contents of `workforce/initiative-map.json` if it exists, else `null`), `portfolioSlugs` (array of objects `{ slug, data }` for each `portfolio/[slug].json` file where `slug` passes the `/^[a-z0-9-]+$/` allowlist), and `allocationInput` (parsed contents of `workforce/allocation-input.json` if it exists, else `null`). Files that do not exist are returned as `null` — the route does not return a 404 for missing optional files. Portfolio slugs that fail the allowlist check are omitted and a warning is logged to stderr.

**AC3 (route registration — POST /workforce/allocations):** Given the operator is authenticated and the request body is valid JSON, when `POST /workforce/allocations` is received, then `authGuard` is applied and `handlePostWorkforceAllocations` writes the request body to `workforce/allocation-input.json` atomically (write to `.tmp`, validate JSON parses, rename over target). On success the handler returns `200 application/json` with `{ "ok": true, "path": "workforce/allocation-input.json" }`. On write failure it returns `500` with `{ "ok": false, "error": "<message>" }`. On invalid JSON body it returns `400` with `{ "ok": false, "error": "Invalid JSON body" }`.

**AC4 (initiative-centric view — default on load):** Given the assignment UI has loaded and `GET /workforce/data` returns non-empty `portfolioSlugs`, when the page renders, then the initiative-centric view is displayed by default. The left panel lists all portfolio initiatives, each showing its slug, product group, and allocation status derived from `allocationInput`: "unassigned" if no entry exists for the slug; "partially assigned" if an entry exists with an empty or missing `people` array; "fully assigned" otherwise. Initiatives are filterable by product group and by allocation status using controls above the list. Selecting an initiative shows: its `requiredTags` and `people.fte_demand` from the portfolio slug data; current assignees from `allocationInput`; a ranked candidate list (see AC8); and a coverage indicator showing the percentage of `requiredTags` covered collectively by current assignees.

**AC5 (initiative-centric view — add/remove and allocation mode):** Given the initiative-centric view is active and an initiative is selected, when the operator adds a person or squad as an assignee, then the change is staged in memory and reflected immediately in the UI without writing to disk. A per-initiative allocation mode selector supports "direct", "profile-match", and "net-new". Selecting "net-new" reveals `requiredRole` and `requiredTags` input fields. The operator can remove any existing assignee from the initiative. The staged allocation entry also exposes `parentSlug` and `scopeLabel` fields (for wfp.8 rollup decomposition). No data is written to disk until the operator clicks "Save assignments".

**AC8 (candidate ranking by skill-tag match score):** Given the initiative-centric view is showing an initiative that has a non-empty `requiredTags` array, when the candidate list is rendered, then people and squads are ranked by their skill-tag match score against `requiredTags`, computed using the same coverage formula as wfp.10 (`coveredTags.length / requiredTags.length` where `coveredTags` is the intersection of `requiredTags` with the person's `skills` array, or the union of all member `skills` arrays for a squad). The match score is displayed as a percentage alongside each candidate (e.g. "84% match"). Candidates with a score of 0 are shown below a "No tag match" separator and are not hidden.

**AC9 (save assignments):** Given the operator has staged one or more changes and clicks "Save assignments", when the button is clicked, then the UI posts the full current in-memory allocation state as JSON to `POST /workforce/allocations`. On a `200 ok` response the "unsaved changes" banner is dismissed and the saved state replaces the staged state as the new baseline. On a non-200 response an error message is shown inline and the staged changes are preserved. The "Save assignments" button is disabled while a save request is in flight.

**AC10 (run workforce-map):** Given the operator has saved assignments and clicks "Run workforce-map", when the button is clicked, then the UI sends a `POST /workforce/run-map` request. The server handler calls `child_process.spawn` to execute the workforce-map script (wfp.3/wfp.4), collects stdout and stderr, and on process exit returns `{ "ok": true, "exitCode": <n>, "output": "<combined stdout+stderr>" }`. The UI displays the output in a pre-formatted block below the button. If `exitCode` is non-zero the block is rendered with an error style.

**AC11 (unsaved changes indicator):** Given the operator has made at least one staged change that has not yet been saved, then a "You have unsaved changes" banner is visible at the top of the page. The banner is dismissed only on a successful save (AC9). On page reload all unsaved changes are lost (no localStorage persistence required for Phase 1). Note: AC11 in wfp.11b extends this to cover cross-view navigation consistency once the person-centric and squad-centric views are added.

**AC12 (auto-derived draft flag):** Given `allocationInput` loaded from disk has `_autoderived: true` at the root (output of `workforce-assign --mode auto` from wfp.9), or any entry has `_reviewRequired: true`, then those entries are visually distinguished in the initiative list (e.g. a "Draft — needs review" badge). The badge is removed for an entry when the operator explicitly edits that entry's assignees and saves.

**AC13 (load existing allocation-input.json as starting state):** Given `GET /workforce/data` returns a non-null `allocationInput`, when the assignment UI loads, then the current assignments are pre-populated from `allocationInput` as the starting state. The operator is editing an existing file, not starting from scratch. The initiative-centric view shows "fully assigned" or "partially assigned" status reflecting the loaded data immediately on first render.

**AC14 (path traversal protection):** Given a `GET /workforce/data` request is processed, when the server constructs file paths for `portfolio/[slug].json` files, then each slug is validated against the allowlist `/^[a-z0-9-]+$/` before path construction. Any slug that fails validation is omitted from the response and a warning is logged to stderr: `[workforce/data] rejected slug: <value>`. No path outside the `portfolio/` directory can be accessed via this route. A dedicated test asserts that a slug containing `../` or an absolute path segment returns no entry and logs the warning.

**AC15 (route registration — POST /workforce/run-map):** Given `src/web-ui/server.js` is running and the operator is authenticated, when a `POST /workforce/run-map` request is received, then the route is matched by the `else if (pathname === '/workforce/run-map' && req.method === 'POST')` branch in the `router` function, `authGuard` is applied, and `handlePostWorkforceRunMap` (imported from `src/web-ui/routes/workforce.js`) is called. The route must appear in `server.js` as a first-class `else if` branch in the same `if/else if` chain as the other workforce routes — not as a conditional inside `handlePostWorkforceAllocations` or any other handler. A unit test confirms that a `POST /workforce/run-map` request with a seeded test session reaches the handler and receives a JSON response.

## Out of Scope

- Person-centric and squad-centric views — delivered in wfp.11b. Navigation tabs may be present in the HTML but are disabled or marked "coming in Phase 2".
- Modifying `dashboards/workforce.html` — the static read-only dashboard remains unchanged.
- Authentication or access control beyond the existing `authGuard` already in `server.js` — role-based access is out of scope for Phase 1.
- Exporting or downloading `allocation-input.json` from the browser — the operator reads the file directly from disk.
- Real-time multi-user collaboration — one operator session at a time; no concurrency control beyond the atomic file write in AC3.
- Streaming `workforce-map` output via SSE — stdout/stderr is buffered and returned after process exit (AC10). Live streaming is a Phase 2 consideration.
- LocalStorage or session persistence of unsaved changes — changes are lost on page reload (AC11).
- Exposing `OVER_ALLOCATION_THRESHOLD` via a UI control or server configuration — Phase 1 is a constant in the inline script only.
- Modifying `portfolio/[slug].json` files — these are read-only inputs throughout the wfp feature.
- Fuzzy or partial skill-tag matching — exact string match only, consistent with wfp.10.

## NFRs

- **Performance:** `GET /workforce/data` must read and return all required JSON files (roster + initiative-map + all portfolio slugs + allocation-input) within 2 seconds on a machine where the repo is on a local disk. No caching layer is required for Phase 1.
- **Scale:** The UI must render and remain interactive with 200 roster entries, 40 squads, and 40 portfolio initiatives without visible jank on a mid-range laptop (2020-era hardware). Filtering in the initiative-centric view must update the displayed list synchronously on every keystroke.
- **Security:** Path traversal protection (AC14) is mandatory. No user-supplied slug or filename may be used in a file path without allowlist validation. The `POST /workforce/allocations` body size is limited to 1 MB; requests exceeding this are rejected with 413.
- **Compatibility:** The UI must be navigable at 1280px width in Chrome and Firefox without horizontal scrolling. No IE or legacy browser support required.
- **Observability:** All server-side errors in workforce route handlers are logged to stderr with a `[workforce]` prefix and the request method + pathname. Client-visible error messages must not include raw file paths or stack traces.

## Complexity Rating

**Rating:** 3
**Rationale:** Most of the structural complexity of the full wfp.11 story — four route handlers, atomic file writes, child-process execution, path traversal protection, candidate ranking via `scoreSquadForSlug`, and the initiative-centric view with staged in-memory state. Vanilla JS single-file HTML requires careful coordination between the route module and the inline script. Story B (wfp.11b) is lower risk because the route layer is already established.
**Scope stability:** Stable. The `scoreSquadForSlug` export is confirmed in the wfp.10 DoR contract. Four routes and their handler names are defined and agreed. Initiative-centric view spec is complete.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
