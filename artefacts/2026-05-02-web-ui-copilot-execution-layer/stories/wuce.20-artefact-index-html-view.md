## Story: Feature artefact index HTML view

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e5-html-shell-core-views.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **programme manager or business lead**,
I want to click through from the feature list to any feature's artefact index and see all its artefacts as a readable HTML page,
So that I can navigate to specific artefacts — discovery, stories, test plans, readiness checks — without interpreting JSON or asking an engineer for a direct link.

## Benefit Linkage

**Metric moved:** P4 — Status self-service rate
**How:** A programme manager who can answer "what artefacts exist for feature X and what stage are they in?" directly in a browser — without engineering mediation — advances the ≥9/10 self-service rate target by converting one of the most frequent status-query patterns into a self-served browser action.

## Architecture Constraints

- ADR-012: `handleGetFeatureArtefacts()` in `src/web-ui/routes/features.js` must continue to call `listArtefacts(featureSlug, token)` from the adapter — no inline GitHub API calls
- `renderArtefactItem(artefact)` is already implemented in `src/web-ui/routes/features.js` — call it for each item; do not rewrite or duplicate its output structure
- Content-type negotiation: `Accept: text/html` → HTML page via `renderShell()`; any other Accept header or absent header → existing JSON response unchanged (backward-compatibility is a hard constraint)
- `renderShell()` from `src/web-ui/utils/html-shell.js` (wuce.18) wraps the artefact list output — import it here
- `escHtml()` from `src/web-ui/utils/html-shell.js` must be applied to feature slug and all artefact metadata values before HTML injection
- Artefact type labels must be human-readable in the rendered page: display-label mapping must convert internal identifiers (e.g. `dor`, `benefit-metric`, `test-plan`) to plain labels ("Ready Check", "Benefit Metric", "Test Plan") — this mapping lives in `src/web-ui/utils/artefact-labels.js`

## Dependencies

- **Upstream:** wuce.6 (artefact index JSON route — the handler being extended), wuce.18 (HTML shell), wuce.19 (feature list HTML — user navigates here from there)
- **Downstream:** wuce.2 / existing artefact view route receives clicks from this page's artefact links

## Acceptance Criteria

**AC1:** Given an authenticated user sends `GET /features/:slug` with `Accept: text/html`, When the response is returned, Then the `Content-Type` is `text/html; charset=utf-8`, the response body is a complete HTML page via `renderShell()`, and the page contains a list of artefacts for that feature with each item showing: a human-readable type label (not the raw internal identifier), the creation date, and a link to `/artefact/:slug/:type` for that artefact.

**AC2:** Given an existing consumer sends `GET /features/:slug` with `Accept: application/json` (or no Accept header), When the response is returned, Then the response is identical to the pre-wuce.20 behaviour — JSON content-type, same array shape, same status code — with no change to response format or latency.

**AC3:** Given a feature has artefacts of types `discovery`, `benefit-metric`, `dor`, and `test-plan`, When the HTML artefact index is rendered, Then the page displays the labels "Discovery", "Benefit Metric", "Ready Check", and "Test Plan" respectively — the raw internal type strings do not appear as browser-rendered text.

**AC4:** Given a feature slug or any artefact metadata value returned by `listArtefacts()` contains HTML-special characters, When the HTML page is rendered, Then those characters are escaped by `escHtml()` and do not form tags in the output.

**AC5:** Given a feature with no artefacts is requested with `Accept: text/html`, When the HTML page renders, Then the page contains an empty-state message (e.g. "No artefacts found for this feature") within the `<main>` element, and no empty list element is rendered.

**AC6:** Given an unauthenticated request to `GET /features/:slug` with `Accept: text/html`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github` (existing `authGuard` behaviour — must not regress for the HTML path).

## Out of Scope

- Grouping artefacts by pipeline stage within the HTML view — post-MVP progressive enhancement (the JSON shape does not include stage grouping; adding it would change the adapter contract and is deferred)
- Filtering or searching artefacts within a feature — post-MVP
- Creating or uploading new artefacts from this view — read-only in Phase 1
- Any change to the JSON response shape of `GET /features/:slug` — backward-compatibility is a hard constraint
- Pagination of artefacts — not needed in Phase 1 (features have bounded artefact counts)

## NFRs

- **Security:** Feature slugs and artefact metadata from external API responses must be escaped with `escHtml()` before HTML injection.
- **Performance:** HTML render path must not introduce an additional API round-trip beyond what the JSON path makes; `artefact-labels.js` is a synchronous static mapping with no I/O.
- **Accessibility:** Artefact list uses `<ul>` with `<li>` items and descriptive link text; heading hierarchy continues from the shell.
- **Audit:** Feature artefact index access is logged (userId, route `/features/:slug`, featureSlug, timestamp) consistent with the pattern established in wuce.6.

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
