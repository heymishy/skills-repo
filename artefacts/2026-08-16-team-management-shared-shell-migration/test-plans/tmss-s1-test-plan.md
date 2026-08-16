## Test Plan: Migrate team-management admin pages onto the shared HTML shell

**Story reference:** artefacts/2026-08-16-team-management-shared-shell-migration/stories/tmss-s1-migrate-to-shared-shell.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `/team/members` renders via `renderShell()`, form fields unchanged | 1 test | — | — | — | — | 🟢 |
| AC2 | `/team/invites/new` renders via `renderShell()`, form fields + POST target unchanged | 1 test | — | — | — | — | 🟢 |
| AC3 | `_escapeHtml` removed, `escHtml()` used, no escaping regression | 1 test | — | — | — | — | 🟢 |
| AC4 | CSRF hidden field unchanged in both forms | 1 test | — | — | — | — | 🟢 |

**E2E / browser-layout detection (Step 3a):** Scanned all 4 ACs for CSS-layout-dependent language (drag-drop, pointer/click coordinates, `getBoundingClientRect`/`offsetTop`/`scrollTop`, on-screen-position checks, `e.target` identity from stacking, visual rendering). None triggered — every AC concerns DOM structure/string-content presence (shell wrapper markup, form field attributes, escaped output, hidden input value), all verifiable via server-rendered HTML string inspection with no real browser or CSS layout computation needed. This mirrors `wsi-s6-invite-creation-ui-test-plan.md`'s own Step 3a conclusion for the same handler. No E2E tooling gap applies to this story. (A live Chrome check against staging remains a good idea post-merge, matching the check that originally surfaced this story, but it is not required for AC verification — the visual styling itself is provided entirely by `renderShell()`'s already-shipped, already-used-elsewhere CSS, not new code this story writes.)

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `req`/`session`, matching `wsi-s6`'s own precedent for these exact two handlers — no database state is read; both handlers render static HTML from `VALID_ROLES`/team-member data already present in the mock)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | Mock admin session (`login`, `tenantId`, `csrfToken`) | Mock req object | None | No pool/DB involved — both handlers' only inputs are `VALID_ROLES` (existing constant) and the CSRF token |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### teamManagement_getTeamMembers_rendersViaSharedShell

- **Verifies:** AC1
- **Precondition:** Mock admin session (`req.session.login`, `req.session.accessToken`, `tenantId`)
- **Action:** Call `handleGetTeamMembers(req, res)` directly, inspect the response HTML
- **Expected result:** Response contains `<div class="sw-app">`, `id="sw-sidebar"`, `<div class="sw-main">`, and `<main>` wrapping the existing add-teammate form's fields — `<label for="identity">` paired with `<input id="identity" name="identity" type="text">`, `<label for="role">` paired with `<select id="role" name="role">` containing the `VALID_ROLES` options, and `<button type="submit">Add teammate</button>` — all field `id`/`name`/`type` values unchanged from the pre-refactor handler. Called with `renderShell({ title: 'Team members', bodyContent, user: req.session, active: 'team-members', crumbs: ['Team members'], isAdmin: true })`, matching `admin-credits.js`'s own call convention exactly (`active: 'team-members'` will not match any current `NAV_ITEMS` entry — no nav entry exists for this page yet, which is unchanged, out-of-scope behaviour per this story's Out of Scope; the id is chosen so a future nav entry can adopt it without a second rename).
- **Edge case:** No

### teamManagement_getCreateInviteForm_rendersViaSharedShell

- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Call `handleGetCreateInviteForm(req, res)` directly, inspect the response HTML
- **Expected result:** Response contains the same shell wrapper markup as AC1 (`class="sw-app"`, `id="sw-sidebar"`, `class="sw-main"`, `<main>`), plus the existing invite form's fields unchanged — `<label for="email">`/`<input id="email" name="email" type="email">`, `<label for="role">`/`<select id="role" name="role">`, `<button type="submit">Send invite</button>` — and `<form method="POST" action="/api/team/invites">` unchanged (no new request shape, matching `wsi-s6-invite-creation-ui-test-plan.md`'s own AC2 assertion). Called with `renderShell({ title: 'Invite a teammate', bodyContent, user: req.session, active: 'team-members', crumbs: ['Team members', 'Invite a teammate'], isAdmin: true })`.
- **Edge case:** No

### teamManagement_escapeHtmlRemoved_escHtmlUsedNoRegressions

- **Verifies:** AC3
- **Precondition:** Mock admin session; a role value or identity string in the render path containing `<`, `>`, `&`, `"` (e.g. a crafted `VALID_ROLES`-shaped test double is not needed — assert directly on the CSRF token and any echoed request-derived string, since `VALID_ROLES` itself is a fixed, safe constant with no user input)
- **Action:** Source-scan `routes/team-management.js` for a locally-defined `_escapeHtml` function; separately, call both handlers with a CSRF token value containing `"` (a legitimate value shape for a signed token is opaque, so this test constructs a session/token double that includes `"` specifically to prove the escaping path is real, not to claim tokens naturally contain quotes) and inspect the rendered CSRF hidden input's `value` attribute for `&quot;` in place of the raw `"`
- **Expected result:** No `_escapeHtml` function definition exists anywhere in `team-management.js` (0 matches); every place either handler injects a dynamic string into HTML uses `html-shell.js`'s exported `escHtml()` instead; the crafted `"`-containing token renders as `&quot;` in the output, not a raw `"` (proves the escaping call path is live, not just present in source)
- **Edge case:** Yes — this is the story's own explicit no-regression guarantee for a security-relevant function swap

### teamManagement_csrfFieldUnchangedInBothForms

- **Verifies:** AC4
- **Precondition:** Mock admin session with a known `csrfToken`
- **Action:** Call both handlers, inspect each response's CSRF field
- **Expected result:** Both responses contain `<input type="hidden" name="_csrf" value="...">` matching `csrf.csrfField`'s existing output shape (`middleware/csrf.js`), with the same non-empty token value passed into the mock session — functionally identical to the pre-refactor output, just now emitted from inside `bodyContent` rather than the old hand-built wrapper
- **Edge case:** No

---

## Integration Tests

None — this story only changes how two existing `GET` handlers build their response HTML (swapping a hand-rolled wrapper for `renderShell()`/`escHtml()`); it introduces no new component handoff. `renderShell()` itself is an existing, already-integration-tested seam used by every other HTML route in the app.

---

## NFR Tests

### teamManagement_noNewNfrTestBeyondAcCoverage

Not applicable as a distinct test — Performance ("no measurable change"), Accessibility ("unchanged, already verified for these two pages via wsi-s6's live Chrome check"), and Audit ("none identified") are stated in the story as unaffected by this refactor, and Security (no escaping regression) is already covered by AC3 above. No separate NFR test exists beyond the 4 unit tests — matching the story's own NFR section, which names no NFR beyond what the ACs already cover.

---

## Out of Scope for This Test Plan

- Testing either handler's POST counterpart (`handleAddTeammate`, `handleCreateInvite`) — unchanged by this story, already covered by their own existing test suites.
- Testing a new nav entry for `/team/members` or `/team/invites/new` — no nav entry exists today and this story does not add one (see story's Out of Scope); `active: 'team-members'` in the `renderShell()` calls is forward-compatible naming only, not a claim that a nav entry exists.
- A live Chrome/staging visual re-check post-merge — recommended as a good practice (it is what surfaced this story in the first place) but not a blocking AC verification step, since the styling itself comes entirely from `renderShell()`'s already-proven CSS.

---

## Test Gaps and Risks

None identified as blocking.
