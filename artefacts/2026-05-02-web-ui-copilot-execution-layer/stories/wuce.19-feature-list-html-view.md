## Story: Feature list HTML view

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e5-html-shell-core-views.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **programme manager**,
I want to navigate to `/features` and see all configured features rendered as a readable HTML list,
So that I can immediately understand what is in the pipeline and click through to any feature's artefact index without reading JSON.

## Benefit Linkage

**Metric moved:** P4 — Status self-service rate
**How:** When a programme manager asks "what phase is feature X in?", the HTML feature list answers that question directly in a browser tab — moving the self-service rate toward the ≥9/10 target by eliminating the need to ask an engineer to share or parse the API response.

## Architecture Constraints

- ADR-012: `handleGetFeatures()` in `src/web-ui/routes/features.js` must not call the GitHub API inline — it already calls `listFeatures(token)` from the feature-list adapter; that contract must not change
- `renderFeatureList(features)` is already implemented in `src/web-ui/routes/features.js` — call it for the HTML path; do not duplicate or rewrite its rendering logic
- Content-type negotiation: if the request `Accept` header includes `text/html`, return the HTML response; otherwise return the existing JSON response unchanged — backward-compatibility with API consumers is a hard constraint
- `renderShell()` from `src/web-ui/utils/html-shell.js` (wuce.18) wraps the `renderFeatureList()` output — import it here
- `escHtml()` from `src/web-ui/utils/html-shell.js` must be used on all user-controlled values in the HTML output (feature slugs, stage names, dates)
- WCAG 2.1 AA: feature list is a `<ul>` with a visible heading; each item has a descriptive `<a>` link whose text is the feature slug (not "click here")

## Dependencies

- **Upstream:** wuce.6 (feature list JSON route — the handler being extended), wuce.18 (HTML shell — must be merged first so `renderShell()` is available)
- **Downstream:** wuce.20 (artefact index HTML, links from this view)

## Acceptance Criteria

**AC1:** Given an authenticated user sends `GET /features` with `Accept: text/html`, When the response is returned, Then the `Content-Type` is `text/html; charset=utf-8`, the response body is a complete HTML page produced by `renderShell()`, and the page contains an `<ul>` with one `<li>` per feature showing: the feature slug, the current pipeline stage, the last-updated date, and a link to `/features/:slug`.

**AC2:** Given an existing consumer sends `GET /features` with `Accept: application/json` (or no Accept header), When the response is returned, Then the response is identical to the pre-wuce.19 behaviour — JSON content-type and the feature array as JSON — with no change to the status code, response shape, or latency.

**AC3:** Given the configured repositories contain zero features, When an authenticated user requests `GET /features` with `Accept: text/html`, Then the page renders with the HTML shell, an empty-state message visible in the `<main>` area (e.g. "No features found"), and no JavaScript errors or empty `<ul>` with no children.

**AC4:** Given a feature's `stage` value contains characters that are valid HTML special characters (e.g. `<`, `>`), When the feature list is rendered as HTML, Then those characters are escaped using `escHtml()` and do not form HTML tags in the output.

**AC5:** Given an unauthenticated request to `GET /features` with `Accept: text/html`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github` (existing `authGuard` behaviour — must not regress for the HTML path).

## Out of Scope

- Sorting or filtering the feature list — post-MVP progressive enhancement
- Pagination of features beyond the configured repository set — post-MVP
- Adding new features from this view — read-only in Phase 1
- Per-feature metric sparklines or trend indicators — post-MVP data visualisation
- Any change to the JSON response format of `GET /features` — backward-compatibility is a hard constraint

## NFRs

- **Security:** Feature slugs and stage values from external API data must be escaped with `escHtml()` before injection into HTML.
- **Performance:** HTML render path must not introduce an additional API round-trip beyond what the JSON path already makes.
- **Accessibility:** Feature list uses `<ul>` with `<li>` items and descriptive link text; heading hierarchy continues from the shell `<h1>`.
- **Audit:** Feature list view access is logged (userId, route `/features`, timestamp) via the existing route-level audit pattern established in wuce.5–7.

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
