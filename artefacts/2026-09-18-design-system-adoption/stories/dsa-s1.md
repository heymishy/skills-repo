## Story: Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## Amendment note (2026-09-18)

This story was originally scoped as a pure visual restyle. Investigation at `/implementation-plan` time found the real, live artefact viewer (`GET /artefact/:slug/:type` → `handleArtefactRoute`) has no Sign-off or Comments UI at all — `DESIGN.md`'s mock and the story's original AC3 described a two-column layout with those sidebar cards, but that UI does not exist anywhere reachable in the real application (`views/artefact-view.js`'s `renderArtefact` and `routes/sign-off.js`'s `handleArtefactRead` are both dead code — imported but never dispatched). The operator, presented with this gap, chose to build the real Sign-off and Comments UI as new functionality rather than restyle only what already exists. Full investigation and decision trail: `decisions.md`, "major architecture correction and scope expansion" entry, 2026-09-18. This amendment updates the User Story, Architecture Constraints, Acceptance Criteria, Out of Scope, NFRs, and Complexity Rating to reflect the real, expanded scope. Re-run through `/review` → `/test-plan` → `/definition-of-ready` following this amendment, per the operator's own explicit choice.

## User Story

As a **beta user** (one of the platform's 2 onboarded external users) and as **Hamish King (Founder/Operator)**,
I want **the artefact viewer to look like a modern, consistent SaaS product, and to be able to sign off an artefact and leave/read comments directly from the page**,
So that **my first impression of the platform's visual credibility is a positive one, and the sign-off/collaboration workflow this artefact page is meant to support is actually usable, not just visually implied by a mock**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** This story converts the artefact viewer — one of the 4 real screens the metric counts — from the old token values to `DESIGN.md`'s exact token values, moving the metric from 0/4 toward 4/4. It also builds the real Sign-off/Comments UI the mock depicts, so the visual restyle isn't presenting functionality that doesn't exist.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one." This story exists specifically to satisfy that guardrail.
- Confirmed via `/clarify`: reuse and extend `src/web-ui/utils/html-shell.js`'s existing `:root`/dark-mode CSS custom-property blocks — do not introduce a parallel styling mechanism. Update hex values to match `DESIGN.md`'s token table.
- **Corrected at `/implementation-plan` time: ADD `--success`/`--warn`/`--danger` as new aliases alongside the existing `--green`/`--amber`/`--red` — do NOT rename/remove the old names.** Confirmed via direct grep that `--green`/`--amber`/`--red` (and their `-soft` variants) are used in 25+ places across 8 files outside this epic's 4 named screens (`settings.js`, `kanban-view.js`, `journey.js`, `chat-view.js`, `features.js`, `commit-view.js`, `features-view.js`, and dead-code `artefact-view.js`) — a literal rename would silently break their styling (an undefined CSS custom property falls back to `transparent`/`inherit`, not an error). This is a real, larger blast radius than any single story in this epic (or the epic itself) was ever scoped for. Define the new names with the exact same hex values as the corresponding old names in both the dark (`:root`) and light-mode blocks; this story's own restyled markup uses the new names, every other screen keeps working unchanged on the old names.
- **Real render path, confirmed via direct trace (not the originally-assumed one):** `routes/artefact.js`'s `handleArtefactRoute` renders via `renderArtefactToHTML` (markdown→HTML) wrapped in `renderShellWithNav`'s generic single-column shell. Do NOT edit `views/artefact-view.js`'s `renderArtefact` — confirmed dead code, never dispatched.
- **Sign-off action: reuse the existing, real, already-hardened `POST /sign-off` endpoint** (`routes/sign-off.js`'s `handleSignOff`) — do not build new sign-off backend logic. It expects `{ artefactPath: 'artefacts/<slug>/<type>.md' }`, is rate-limited (10 req/user/min), validates the path server-side, resolves the product's connected repo, and returns 200 (success), 400 (invalid path / no repo configured), 401 (unauthenticated), 409 (already signed off, with `approver`/`date` in the response body, or a write conflict), or 429 (rate limited). The new UI must handle every one of these response shapes, not just the 200 case.
- **Initial sign-off status must be determined server-side at page-render time, not client-side via a guess-then-fail POST.** `handleArtefactRoute` already has the fetched markdown in hand (`const markdown = await _fetchArtefact(...)`) before rendering. `adapters/sign-off-writer.js`'s `detectExistingSignOff(markdown)` is a pure, synchronous function (already used by `handleSignOff` itself) that returns `{approver, date}` or `null` — call it once during `handleArtefactRoute`'s own render to decide whether the Sign-off card shows an active "Sign Off" button or the existing approver/date, matching AC6's own requirement exactly and reusing real, already-tested detection logic rather than inventing new client-side state-guessing.
- **Comments: build new, generic comments infrastructure — do NOT reuse `modules/agency-client-comments.js`.** That module is tightly coupled to a different feature's org-scoped model (every real call site requires a `clientOrgId`/`agencyOrgId` tied to an `organisations` row with `org_type: 'agency'|'client'`) — reusing it here would misuse that model for users with no real agency/client relationship (mock-shape-mismatch pattern, `CLAUDE.md`'s `tir-s5` precedent). New table, scoped simply by `(resource_type, resource_id, user_id, body, created_at)` — no `org_id`/`org_type` column.
- **Migration must actually be wired at server startup** — confirmed via investigation that `agency-client-comments.js`'s own `migrateCommentsSchema` function is defined but never called anywhere (a real, pre-existing, unrelated bug in that other feature, not fixed here). Do not repeat this mistake: the new comments table's migration function must be called during `server.js` startup, matching the real, working pattern `migrateAgencyClientGrantsSchema` already establishes (`server.js:648`), wired via `_userRolesPool` — confirmed via direct trace that `_userRolesPool` and `_pshPool` (the pool `handleArtefactRoute` receives and will use to read/write comments) are separate `Pool` objects but both connect to the same `DATABASE_URL`, so a table migrated via one is fully visible to queries via the other.
- **Real, already-shipped E2E test precedent confirms the true backend success path for `POST /sign-off` cannot be automated in E2E** — `tests/e2e/sign-off.spec.js`'s own header comment and 3 `test.skip()` entries confirm AC1 (valid path commits) and the 409-on-second-sign-off case both require real GitHub write access unavailable in test, deferred to manual verification (`wuce.3-attributed-signoff-verification.md`) since that story shipped. This story's own new tests must follow the same precedent for the true success/409 round trip — do not invent a new mocking technique (`route.fulfill`) with no precedent anywhere in this codebase's E2E suite; the new UI's *request-sending* behavior (correct `artefactPath` in the POST body) is real, automatable, and testable via the established `page.route(..., route.continue())` call-observation pattern (`tests/e2e/s3.1-drag-to-advance.spec.js`).
- **New comment endpoints must be CSRF-guarded, matching the real, established pattern.** Confirmed via direct trace of `server.js`'s dispatch for the existing `/api/agency/comments` (POST) and `/client/comments` (POST) routes: both wrap their handler in `authGuard` + an explicit `csrfGuard` check before calling through — "CSRF-guarded, matching every other mutating route in products.js" per that code's own comment. The new create-comment endpoint must follow this exact shape. The real handler pattern to model on (`handleCreateAgencyComment`/`handleListAgencyComments`, `products.js`): read `resourceType`/`resourceId`/`body` from the request, 400 if `resourceId`/`body` missing, call the new module's `createComment`, respond via a `_sendJson`-style helper with `{success: true, comment: {...}}`; list responds `{comments: [...]}`. Serialize comment rows without an `orgId` field (unlike `_serializeComment`'s real shape, which includes one this feature's comments don't have).
- Real target files (confirmed to exist): `src/web-ui/routes/artefact.js`, `src/web-ui/server.js`. New files: a new comments module (new table + migration + create/list functions, modeled on `agency-client-comments.js`'s own real structure but without the org-scoping), a new client-side script for the Sign-off button and Comments card interactions, and that script's static route (pairing lesson already established elsewhere in this feature's own epic — client script + static route land in the same commit).

## Dependencies

- **Upstream:** None
- **Downstream:** None (independently demo-able and revertible, per this epic's vertical-slice strategy)

## Acceptance Criteria

**AC1:** Given the artefact viewer is rendered in dark mode, When its computed CSS custom-property values are inspected, Then every color token (`--bg`, `--surface`, `--ink`, `--ink-2`, `--muted`, `--muted-2`, `--muted-3`, `--accent`, `--accent-soft`, `--accent-ink`, `--success`, `--warn`, `--danger`) matches `DESIGN.md`'s dark-mode token table exactly.

**AC2:** Given the artefact viewer is rendered in light mode (via the existing Settings toggle), When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s light-mode token table exactly.

**AC3:** Given the artefact viewer's layout follows `DESIGN.md`'s "Artefact/document viewer" layout pattern (two-column, `minmax(0,1fr) 320px`, doc body in Source Serif 4 on a surface card, sidebar with a real Sign-off card and a real Comments card), When the real page is rendered, Then this structure is present and visually matches the `Skills Platform - Artefact Viewer.dc.html` mock — with real, working functionality behind both sidebar cards, not static/placeholder markup.

**AC4:** Given the artefact viewer's pre-existing functionality (viewing artefact content), When the restyle is applied, Then no existing functional behavior regresses — verified by running this screen's own pre-existing test coverage before and after the change.

**AC5:** Given a signed-in user viewing an artefact that has not yet been signed off, When they click the Sign Off button in the sidebar's Sign-off card, Then a real `POST /sign-off` request is sent with the correct `artefactPath`, and on success (200) the card updates to show the sign-off as recorded (approver name and date), without a full page reload.

**AC6:** Given a signed-in user viewing an artefact that has already been signed off (`POST /sign-off` would return 409 with `approver`/`date`), When the Sign-off card renders, Then it shows the existing sign-off's approver and date directly — the user is not shown an active "Sign Off" button that would only fail on click.

**AC7:** Given a signed-in user viewing an artefact, When the page loads, Then the Comments card displays every existing comment on that artefact (author, body, timestamp), oldest first, fetched via a real new list endpoint — empty state shown as "No comments yet" if none exist.

**AC8:** Given a signed-in user viewing an artefact, When they type a comment and submit it via the Comments card, Then a real new create-comment endpoint persists it, and it appears in the comments list without a full page reload.

## Out of Scope

- Any other of the 3 remaining real screens (dashboard, landing, skill-session chat) — each has its own story.
- Building the `design.system` DoR governance mechanism — that is `dsa-s5`, a separate epic's story.
- New icons or components beyond what `DESIGN.md` and the mock already specify.
- Modifying `handleSignOff`'s own existing backend logic (rate limiting, path validation, GitHub commit mechanics) — reused exactly as it already works.
- Comment editing or deletion — this MVP is append-only, matching `agency-client-comments.js`'s own established append-only precedent for this same class of feature.
- Fixing `agency-client-comments.js`'s own orphaned-migration bug (found during this story's investigation) — a real, pre-existing, unrelated defect in a different, already-shipped feature.
- Any org-scoping, permissions, or visibility model for comments beyond "any signed-in user viewing this artefact can read and post" — no client/agency distinction applies to this generic artefact-comments feature.

## NFRs

- **Performance:** No measurable page-load regression from the restyle. Comment list/create round trips complete within a normal interactive budget (no specific millisecond target set — this is a low-traffic, low-volume feature).
- **Security:** Comment body must be escaped before rendering (XSS prevention, matching this codebase's own established `_escapeHtml` convention). The new comments endpoints must require authentication, matching `handleSignOff`'s own existing pattern. No new path-traversal surface (comments are keyed by artefact slug/type + generated comment IDs, never raw file paths).
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9's existing platform-wide floor) for both the restyled page and the new Sign-off/Comments UI — keyboard-accessible buttons and forms, not just mouse-clickable.
- **Audit:** Comment creation is logged (author, resource, timestamp), matching `agency-client-comments.js`'s own established audit-logging convention for this same class of action. Sign-off submission is already audit-logged by the existing, reused `handleSignOff` endpoint.

## Complexity Rating

**Rating:** 2

<!-- Revised from 1 to 2 following the scope amendment: real new backend (comments table + endpoints) and real new UI wiring against an already-hardened but previously-unwired sign-off endpoint, not just a token/markup restyle. Still bounded and well-understood -- not a 3 -- since the sign-off backend is fully reused, and the comments backend closely mirrors an existing, real precedent (agency-client-comments.js) with the org-scoping intentionally removed. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
