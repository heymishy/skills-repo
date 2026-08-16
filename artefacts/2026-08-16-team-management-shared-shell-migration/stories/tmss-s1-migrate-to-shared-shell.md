# Story: Migrate team-management admin pages onto the shared HTML shell (renderShell/escHtml)

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the `/improve`-surfaced gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As a **tenant admin**,
I want **the team-members page (`/team/members`) and the invite-creation page (`/team/invites/new`) to render using the app's shared page shell (nav, header, styling) instead of bare, unstyled HTML**,
So that **these admin pages look and behave consistently with the rest of the app, instead of appearing broken or out of place next to every other page I use**.

## Benefit Linkage

**Metric moved:** No formal benefit-metric artefact — short-track. Operational/quality metric: standards-compliance debt and visual inconsistency, both directly observed rather than theoretical.
**How:** A live Chrome review of the real staging deployment (during `wuce-self-serve-invites`'s `/improve` pass, 2026-08-16) surfaced that `/team/invites/new` renders as plain, unstyled browser-default HTML — visually inconsistent with every other page in the app. Tracing it found the root cause: both this page and its precedent (`/team/members`, from `team-identity-roles`'s `tir-s3`) violate an existing, already-written standard (`.github/standards/web-ui/web-ui-patterns.md`'s "Shared shell module" rule — every HTML route view must use `html-shell.js`'s `renderShell()`/`escHtml()`). Fixing both closes a real, user-visible inconsistency and a standards violation that had gone undetected through two separate stories' `/review` and `/definition-of-ready` passes.

## Architecture Constraints

`.github/standards/web-ui/web-ui-patterns.md`, "Shared shell module — canonical source for renderShell() and escHtml()": every HTML route view MUST import both functions from `src/web-ui/utils/html-shell.js`; never re-implement or duplicate either function in a route module. This story brings the two existing violating handlers (`handleGetTeamMembers`, `handleGetCreateInviteForm` in `routes/team-management.js`) into compliance with this pre-existing rule — it is not introducing a new constraint, it is fixing a violation of one that already exists.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `handleGetTeamMembers` in `src/web-ui/routes/team-management.js` currently builds its own HTML string with a locally duplicated `_escapeHtml` function and no page shell, When the handler is refactored to call `html-shell.js`'s `renderShell()` for the page wrapper, Then a GET request to `/team/members` returns 200 with a response body containing the shared shell's wrapper markup (the same top-level nav/header structure used by `/dashboard` or `/settings`) plus the existing add-teammate form's fields (`identity` input, `role` select, submit button) present, unchanged in `id`/`name`/`type`.

**AC2:** Given `handleGetCreateInviteForm` currently builds its own HTML string the same way, When it is refactored to call `renderShell()` the same way as AC1, Then a GET request to `/team/invites/new` returns 200 with the shared shell wrapper present and the existing invite form's fields (`email` input, `role` select, submit button) present, unchanged in `id`/`name`/`type`, and the form still POSTs to `/api/team/invites` unchanged.

**AC3:** Given both handlers previously escaped user- or model-supplied strings via a locally duplicated `_escapeHtml` function, When the refactor is complete, Then `_escapeHtml` is removed entirely from `team-management.js`, every call site is replaced with `html-shell.js`'s `escHtml()`, and a role or identity value containing `<`, `>`, `&`, or `"` still renders HTML-escaped in the response body (verified by test — no escaping regression).

**AC4:** Given the CSRF token embedding pattern (`csrf.generateCsrfToken`/`csrf.csrfField`) is unrelated to the shell/escaping change, When the refactor is complete, Then both forms' rendered output still contains a hidden `_csrf` input with a non-empty value, functionally unchanged from before the refactor.

## Out of Scope

- Any change to either route's POST handler (`/api/team/members`, `/api/team/invites`) — only the GET/render handlers are touched.
- Any new nav entry or shell layout change — this story reuses `renderShell()` exactly as existing callers (`dashboard.js`, `settings.js`, `admin-credits.js`) already do.
- Any change to either handler's underlying business logic (role validation, DB writes, invite creation) — this is a rendering/escaping refactor only.

## NFRs

- **Performance:** No measurable change expected — same synchronous string-building, now routed through `renderShell()` instead of a hand-built wrapper.
- **Security:** Escaping behaviour must not regress (AC3). Net risk reduction expected — removes a duplicated, locally-maintained escaping implementation in favour of the app's single canonical, already-reviewed `escHtml()`.
- **Accessibility:** Unchanged. Both forms already use native, labelled controls (existing AC coverage from `tir-s3` and `wsi-s6`, the latter independently verified via a live Chrome keyboard-navigation check on staging, 2026-08-16). `renderShell()` is already used across every other page in the app without a known accessibility regression.
- **Audit:** None identified — no change to logging behaviour.

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
