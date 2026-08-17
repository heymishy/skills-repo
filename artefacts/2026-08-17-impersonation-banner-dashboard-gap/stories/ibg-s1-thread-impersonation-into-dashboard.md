## Story: Thread impersonation state into the /dashboard route's renderShell call

**Epic reference:** None — short-track bug fix
**Discovery reference:** None — short-track (bug found during DoD backlog review, `2026-07-21-web-ui-experience-redesign`, story `d2`)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **admin who is impersonating a user**,
I want to **see the persistent "Viewing as" banner on the main Products dashboard, the same as every other page**,
So that **I can't accidentally forget I'm impersonating while looking at the app's most-visited page — closing a real accountability gap, not just a visual inconsistency**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track bug fix, no benefit-metric artefact) — directly restores `d2`'s own AC1 guarantee ("a persistent banner appears at the very top of the viewport... When any page in the app renders"), which the merged code silently does not satisfy for `/dashboard`.
**How:** Threading `req.session.impersonation` into `handleGetDashboard`'s `renderShell()` call (matching the existing pattern in `dashboard.js`'s `handleDashboard` and `settings.js`'s `handleGetSettings`) makes the banner render on `/dashboard` exactly as it already does everywhere else it's wired.

## Architecture Constraints

- Reuse `html-shell.js`'s existing `renderImpersonationBanner()`/`renderShell({ impersonation })` mechanism exactly as-is — do not modify the banner's own rendering logic, markup, or the `/api/admin/impersonate/exit` flow. This story only fixes a missing call-site wiring, not the banner mechanism itself.
- Follow the exact pattern already used in `src/web-ui/routes/dashboard.js`'s `handleDashboard` (lines ~98-120: read `req.session.impersonation`, construct the `impersonation` object only when `imp.active && imp.target`, pass it to `renderShell`) — do not invent a new pattern.
- `src/web-ui/routes/products.js`'s `handleGetDashboard` (the actual handler used whenever `_pshPool` is configured — i.e. always on staging/production) is the specific function requiring the fix, confirmed via `server.js` route wiring (`/dashboard` → `_handleGetDashboard` when `_pshPool` set, else `handleDashboard`).

## Dependencies

- **Upstream:** None
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given an active impersonation session (`req.session.impersonation.active === true`), When the admin loads `/dashboard`, Then the persistent "Viewing as [target] (tenant: [target tenant])" banner renders at the top of the viewport, identical in content and behaviour to the banner already rendered on `/settings`.

**AC2:** Given no active impersonation session, When `/dashboard` loads, Then no banner renders and no regression occurs to the existing dashboard rendering (product list, empty state, etc.) — this story adds a conditional, it does not change the unconditional rendering path.

**AC3:** Given an active impersonation session, When the admin clicks "Exit impersonation" from the banner while on `/dashboard`, Then the session reverts to the real admin's identity and the banner disappears on next render — matching `d2`'s existing AC4 behaviour, now also reachable from `/dashboard`.

**AC4:** Given the existing `check-d2-banner-exit-permission-visibility.js` test suite (24/24 passing before this fix), When re-run after this fix, Then all 24 tests still pass — this fix must not regress the routes that were already correctly wired (`/settings` and others).

## Out of Scope

- Auditing or fixing every other `renderShell()` call site in the codebase for the same gap — this story fixes the specific, confirmed instance (`/dashboard`) found during DoD review. A broader audit (which routes correctly thread `impersonation` vs. which don't — currently 5 of 11 route files reference `impersonation` at all) is a separate, larger piece of work, not bundled into this bug fix.
- Any change to `d2`'s original ACs, banner design, or exit-flow mechanism.
- Any change to `handleDashboard` (the non-pool fallback in `dashboard.js`), which already correctly threads impersonation — only `handleGetDashboard` in `products.js` needs the fix.

## NFRs

- **Performance:** None identified — reads existing session state already available in the request, no new I/O.
- **Security:** None identified — no new data exposure; if anything, this closes an accountability/visibility gap.
- **Accessibility:** None new — reuses the existing, already-accessible banner markup.
- **Audit:** None new — the underlying impersonation audit log (`d3`) is unaffected; this only fixes a visual/UI indicator gap, not the audit trail itself.

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
