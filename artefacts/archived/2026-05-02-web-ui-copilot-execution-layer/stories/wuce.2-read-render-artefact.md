## Story: Read and render a single pipeline artefact in plain prose

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e1-walking-skeleton.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **business lead or programme manager**,
I want to open a link to a specific pipeline artefact and read it in plain, formatted prose,
So that I can understand what was decided or agreed in the governance record without needing git, VS Code, or knowledge of markdown syntax.

## Benefit Linkage

**Metric moved:** P4 — Status self-service rate
**How:** A stakeholder who can read a discovery or benefit-metric artefact from a URL is one step away from self-service status — reading is the pre-condition for every subsequent Phase 1 action.

## Architecture Constraints

- Mandatory security constraint: artefact markdown content must be sanitised before rendering into HTML — no raw innerHTML injection; use a server-side markdown renderer (e.g. `marked` with sanitisation) or a CSP-protected client-side renderer
- ADR-003: if any new `pipeline-state.json` fields are needed to resolve artefact paths, they must be added to `pipeline-state.schema.json` in the same commit
- ADR-012: the artefact-fetching layer must be an adapter module — resolves artefact path via GitHub Contents API; the fetching logic must not be inlined in route handlers
- No external CDN dependencies at runtime — consistent with ADR-001 principle applied to the web app layer

## Dependencies

- **Upstream:** wuce.1 (authenticated session required — artefact API calls use the user's OAuth token)
- **Downstream:** wuce.3 (sign-off story renders into the same artefact view), wuce.5 (action queue links to artefact views from this story)

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `/artefact/[feature-slug]/discovery`, When the page loads, Then the discovery artefact for that feature is fetched from the repository via the GitHub Contents API using the user's OAuth token and rendered as formatted HTML prose (headings, paragraphs, lists, tables) — not raw markdown.

**AC2:** Given an artefact contains a markdown table, When it is rendered, Then the table is displayed as an HTML table with visible borders and column headers — not as pipe-delimited raw text.

**AC3:** Given an authenticated user requests an artefact for a feature slug that does not exist in the repository, When the request is processed, Then a clear "artefact not found" message is displayed — no raw GitHub API error is surfaced to the user.

**AC4:** Given the GitHub API returns a rate-limit or network error, When the artefact page is requested, Then the user sees a human-readable error message ("Unable to load artefact — please try again") and the server logs the technical error detail without exposing it in the browser.

**AC5:** Given an authenticated user views a discovery artefact, When the page loads, Then the artefact's `Status`, `Approved by`, and `Created` fields are displayed as a visible metadata bar above the prose content.

## Out of Scope

- Rendering artefacts from non-GitHub repos (Bitbucket, Azure DevOps) — deferred
- Editing artefact content via the web UI — read-only in this story
- Listing or browsing multiple artefacts — that is wuce.6
- Rendering diff or history views of an artefact — post-MVP
- Syntax highlighting for code blocks embedded in artefacts — acceptable as plain text for v1

## NFRs

- **Performance:** Artefact renders in under 3 seconds on a standard broadband connection (GitHub API call + render).
- **Security:** All artefact HTML output is sanitised — no script injection, no iframe injection, no raw innerHTML from untrusted content.
- **Accessibility:** Rendered artefact HTML meets WCAG 2.1 AA — heading hierarchy preserved, tables have `<caption>` or `aria-label`, sufficient colour contrast.
- **Audit:** Artefact read events are logged with user ID, feature slug, artefact type, and timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
