## Story: Status board HTML view

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e5-html-shell-core-views.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **programme manager or enterprise PM**,
I want to navigate to `/status` and see the full pipeline status board rendered as an HTML page,
So that I can assess programme health at a glance — what features are in which phase, what is blocked, what has merged — without requesting a JSON export or asking an engineer to interpret the API output.

## Benefit Linkage

**Metric moved:** P4 — Status self-service rate
**How:** The status board is the single most common status question answered by an engineer today ("what's the state of everything?"); an HTML view of the board answers that question self-served in a browser, advancing the ≥9/10 self-service rate target for the P4 metric.

## Architecture Constraints

- ADR-009: the HTML view route for `GET /status` with `Accept: text/html` is handled by extending `handleGetStatus()` in `src/web-ui/routes/status.js` using content-type negotiation — do not split into a separate handler for this single-route case; the pattern is consistent with wuce.19 and wuce.20
- ADR-012: `handleGetStatus()` must continue calling `getPipelineStatus(token)` from the status adapter — no inline API calls
- `renderStatusBoard(statusData)` already exists in `src/web-ui/utils/status-board.js`; call it for the HTML body — do not duplicate its rendering logic; if not currently exported, export it as part of this story's scope
- `renderShell()` from `src/web-ui/utils/html-shell.js` (wuce.18) wraps the rendered status board output
- `escHtml()` from `src/web-ui/utils/html-shell.js` must be applied to all feature names, stage labels, and any user-controlled strings before HTML injection
- WCAG 2.1 AA: if the status board uses colour to indicate health (red/amber/green), the same information must also be expressed in text (e.g. "Blocked", "In progress", "Complete") — colour must not be the sole indicator
- The existing `GET /status/export` route must remain unchanged

## Dependencies

- **Upstream:** wuce.7 (status board JSON endpoint and data model), wuce.18 (HTML shell)
- **Downstream:** status items may link to `/features/:slug` (wuce.19–20) for drill-down

## Acceptance Criteria

**AC1:** Given an authenticated user sends `GET /status` with `Accept: text/html`, When the response is returned, Then the `Content-Type` is `text/html; charset=utf-8`, the response body is a complete HTML page via `renderShell()`, and the page renders the status board produced by `renderStatusBoard()` within the `<main>` element showing each feature's slug, current phase, and health/blockers.

**AC2:** Given an existing consumer sends `GET /status` with `Accept: application/json` (or no Accept header), When the response is returned, Then the response is identical to the pre-wuce.22 behaviour — JSON content-type, same data shape, same status code.

**AC3:** Given the status board includes a feature with health indicated by colour, When the HTML page renders, Then a text label (e.g. "Blocked", "In progress", "Complete") accompanies the colour indicator so the status is conveyed without relying on colour alone.

**AC4:** Given a feature name or stage label in the status data contains HTML-special characters, When the HTML page renders, Then those values are escaped by `escHtml()` and do not form tags in the output.

**AC5:** Given an unauthenticated request to `GET /status` with `Accept: text/html`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github`.

**AC6:** Given `GET /status/export` is called after this story is merged, When the response is returned, Then the response is the same as pre-wuce.22 (the export route is not affected by the HTML view change).

## Out of Scope

- Editing feature status or phase from the HTML view — read-only
- Real-time auto-refresh of the status board — manual browser refresh only in Phase 1
- Any change to the `GET /status` JSON response shape — backward-compatibility is a hard constraint
- Drill-down story-level status within each feature from this view — that is the feature artefact index (wuce.20)
- Custom dashboard layouts or widgets — post-MVP

## NFRs

- **Security:** All feature names, stage labels, and health strings from external API responses must be escaped with `escHtml()` before HTML injection.
- **Performance:** HTML render path adds no additional API round-trip; `renderStatusBoard()` is called synchronously over the already-fetched status data.
- **Accessibility:** Status indicators must include text labels alongside any colour coding; heading hierarchy continues from the shell `<h1>`.
- **Audit:** Status board HTML view access is logged (userId, route `/status`, timestamp) consistent with the pattern established in wuce.7.

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
