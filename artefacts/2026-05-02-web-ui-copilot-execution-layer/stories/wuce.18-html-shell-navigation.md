## Story: HTML shell and navigation

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e5-html-shell-core-views.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **programme manager or business lead**,
I want to land on a properly structured dashboard page with navigation links to every part of the Phase 1 surface,
So that I can orient myself and reach features, actions, and pipeline status without knowing any specific URLs.

## Benefit Linkage

**Metric moved:** M2 — Phase 1 stakeholder activation rate
**How:** A stakeholder who lands on a blank `<h1>Dashboard</h1>` stub cannot discover the rest of the product and will not activate; a coherent HTML shell with labelled navigation links is the prerequisite for any non-engineer to make a first meaningful action and count toward the ≥60% activation target.

## Architecture Constraints

- ADR-012: `renderShell()` in `src/web-ui/utils/html-shell.js` is a pure rendering utility — it must not call any API or access session state directly; callers pass user context as arguments
- Mandatory security constraint: `escHtml()` must be called on every user-supplied value injected into HTML output (login name, nav labels); define `escHtml` in `src/web-ui/utils/html-shell.js` as a shared export — other modules must import from here rather than defining their own copies (this resolves the duplication across `routes/features.js` and any new files)
- WCAG 2.1 AA: `<nav>` must have `aria-label`, all links must have descriptive text (not "click here"), heading hierarchy must start at `<h1>` per page
- Inline styles or a `<style>` block only — no external CSS CDN (ADR-001 pattern); the shell should ship one minimal embedded stylesheet covering the nav, heading, and main content area
- `authGuard` applied at the `/dashboard` route in `server.js` (already present — do not remove it)

## Dependencies

- **Upstream:** wuce.1 (auth), wuce.2 (artefact route — confirms HTML page pattern)
- **Downstream:** wuce.19, wuce.20, wuce.21, wuce.22, wuce.23 all import and call `renderShell()`

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `/dashboard`, When the page loads, Then the response `Content-Type` is `text/html; charset=utf-8`, the page contains a `<nav>` element with links to `/features` (labelled "Features"), `/actions` (labelled "Actions"), `/status` (labelled "Status"), and `/skills` (labelled "Run a Skill"), and the authenticated user's GitHub login is displayed visibly on the page (escaped via `escHtml()` before rendering).

**AC2:** Given an unauthenticated request to `/dashboard`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github` (existing `authGuard` behaviour — must not regress).

**AC3:** Given `renderShell({ title, bodyContent, user })` is called with a title and body string, When the function returns, Then the result is a complete HTML document string containing `<!doctype html>`, a `<title>` element containing the title, a `<nav aria-label="Main navigation">` element with the four named navigation links, the bodyContent injected inside a `<main>` element, and the user login visible in a `<header>` element; the `escHtml` function exported from the same module correctly converts `<`, `>`, `&`, `"`, and `'` to their HTML entities.

**AC4:** Given `renderShell()` is called with a `user` object where `login` contains `<script>alert(1)</script>`, When the page is rendered, Then the raw string `<script>` does not appear in the output — it appears as `&lt;script&gt;`.

**AC5:** Given the dashboard page is rendered, When a keyboard user navigates using Tab, Then the four nav links are reachable in order without requiring a pointing device, and each link has visible focus styling.

## Out of Scope

- Custom nav link ordering per user role — single static nav for all authenticated users in Phase 1
- Active/current-page highlighting on nav links — post-MVP progressive enhancement
- Mobile hamburger menu or responsive nav collapse — basic usable layout only
- Dark mode or theme switching — post-MVP
- Search bar in the header — post-MVP
- Any sign-out link UI beyond the existing `/auth/logout` route — the shell may include a logout link but adding new auth behaviour is not in scope

## NFRs

- **Security:** `escHtml()` exported from `html-shell.js` is the single canonical XSS-prevention function for all server-rendered HTML in this web-ui module.
- **Accessibility:** `<nav aria-label="Main navigation">`, `<main>`, and `<header>` are required structural elements. Heading hierarchy starts at `<h1>` per page, not per component.
- **Audit:** No new audit event required for `/dashboard` GET — it is a navigation page, not a governance action. Existing session middleware audit logging is sufficient.
- **Performance:** `renderShell()` is synchronous — no async work; shell render time must not add measurable latency to any page.

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
