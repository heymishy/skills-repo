## Story: Skill launcher landing and session start

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e6-skill-launcher-html-form.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **BA/facilitator or business lead**,
I want to navigate to `/skills`, see the list of available skills, and click a skill to start a new guided session,
So that I can initiate a pipeline skill execution from the browser without knowing the API endpoint structure or needing a terminal.

## Benefit Linkage

**Metric moved:** P2 — Unassisted /discovery completion rate
**How:** A non-technical user who has no way to discover and start a skill session from the browser cannot contribute to the P2 metric at all; this landing page and start-session form is the prerequisite entry point that makes P2 measurable and starts moving it toward the ≥50% target.

## Architecture Constraints

- ADR-012: the skills list page calls `handleGetSkills()` from `src/web-ui/routes/skills.js` for its data — the existing handler (wuce.13) is reused; the HTML route either content-negotiates within the same handler or the HTML route calls the same underlying adapter; no inline API calls
- ADR-009: the HTML form route handler `handleGetSkillsHtml()` is added in `src/web-ui/routes/skills.js` alongside the existing JSON handler — the session-start form POST action points to `POST /api/skills/:name/sessions` (already implemented in wuce.13)
- The session start form is a plain `<form method="POST" action="/api/skills/:name/sessions">` — no JavaScript required for the baseline flow; the POST handler already exists and returns a session ID as JSON; the HTML form must redirect the browser to `/skills/:name/sessions/:id` (wuce.24) after the POST using a server-side redirect (303 See Other) rather than a client-side JSON parse
- `renderShell()` from `src/web-ui/utils/html-shell.js` (wuce.18) wraps all pages produced by this story
- `escHtml()` from `src/web-ui/utils/html-shell.js` must be applied to all skill names and descriptions before HTML injection
- WCAG 2.1 AA: skill cards/links must have descriptive text; the launch button must be a `<button type="submit">` within the form, not an `<a>` tag acting as a button

## Dependencies

- **Upstream:** wuce.13 (skill launcher JSON API — session start), wuce.11 (skill discovery), wuce.18 (HTML shell)
- **Downstream:** wuce.24 (guided question form — user is redirected here after session start)

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `GET /skills`, When the page loads, Then the `Content-Type` is `text/html; charset=utf-8`, the page is produced by `renderShell()`, and it lists all available skills returned by `handleGetSkills()` — each showing the skill name, a brief description, and a "Start" button or link.

**AC2:** Given a user clicks the "Start" button for a named skill, When the browser submits the form, Then a `POST /api/skills/:name/sessions` request is sent, and on success the browser is redirected with HTTP 303 to `/skills/:name/sessions/:id` where `:id` is the newly created session ID.

**AC3:** Given `POST /api/skills/:name/sessions` returns a non-2xx status (e.g. skill not found, quota exceeded), When the redirect would be attempted, Then the user is shown an HTML error page (via `renderShell()`) with a human-readable error message and a link back to `/skills` — the browser does not show a raw JSON error body.

**AC4:** Given a skill name or description contains HTML-special characters, When the skills landing page renders, Then those values are escaped by `escHtml()` and do not form tags in the output.

**AC5:** Given an unauthenticated request to `GET /skills`, When the response is returned, Then the status code is 302 and the `Location` header redirects to `/auth/github`.

**AC6:** Given the dashboard navigation shell renders its `<nav>`, When a user navigates to `/dashboard`, Then the "Run a Skill" nav link points to `/skills`, confirming this route is reachable from the main navigation.

## Out of Scope

- Skill management (adding, editing, disabling skills from the browser) — operator/admin function
- Filtering or searching skills by category — post-MVP (number of skills is small)
- Resuming a previous session from this landing page — that is wuce.25 (session state view) and wuce.16 (session persistence)
- Any skill beyond those returned by `handleGetSkills()` — the set is determined by the repo's `.github/skills/` directory (wuce.11); no manual curation in this story
- JavaScript-enhanced skill card interactions — plain HTML form only in this story

## NFRs

- **Security:** Skill names and descriptions from the API response must be escaped with `escHtml()` before HTML injection; the form action URL must be constructed from a validated skill name, not injected directly from user input.
- **Performance:** Skills landing page requires one API call (same as the JSON path); no additional round-trips.
- **Accessibility:** Each skill is presented as a form with a `<button type="submit">` so keyboard users can activate it with Enter; the button has descriptive text ("Start [skill name]") not just "Go".
- **Audit:** Skills landing page access is logged (userId, route `/skills`, timestamp); session start is already logged by the existing `POST /api/skills/:name/sessions` handler (wuce.13).

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
