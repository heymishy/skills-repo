# Test Plan: Thread impersonation state into the /dashboard route's renderShell call (ibg-s1)

**Story:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1: active impersonation renders banner on `/dashboard` (main view) | AC1 | Behavioural | `handleGetDashboard` with `req.session.impersonation = {active:true, target:{login, tenantId}}` renders HTML containing the impersonation banner markup (`renderImpersonationBanner`'s known output shape, matching `/settings`'s existing rendering) |
| T2: active impersonation renders banner on `/dashboard?view=board` | AC1 | Behavioural | Same session state, `?view=board` query — banner also renders on the kanban-board branch, since it's the same route and the same accountability gap the story exists to close |
| T3: no impersonation session → no banner, dashboard renders unchanged | AC2 | Behavioural | `req.session.impersonation` absent/`{active:false}` — no banner markup present; product-list/empty-state body unchanged from current behaviour |
| T4: banner's "Exit impersonation" form present with a real CSRF token when impersonating | AC3 | Behavioural | Matches `d2`'s existing exit-flow contract — this story does not modify the exit mechanism itself, only confirms the banner (which carries the exit form) is present with a real, non-placeholder CSRF token |
| T5: `check-d2-banner-exit-permission-visibility.js` full suite still passes | AC4 | Regression | Re-run after the fix — 24/24 must still pass, confirming no regression to already-correctly-wired routes (`/settings` etc.) |

## Out of Scope (per story)

- Any other `renderShell()` call site's impersonation wiring — scoped to `/dashboard` (both branches: default and `?view=board`) only, matching the story's own Architecture Constraints (`handleGetDashboard` in `products.js`).
- `handleDashboard` (the non-pool fallback in `dashboard.js`) — already correctly wired, untouched.

## NFR Test Coverage

None — story names no NFRs beyond "None identified" across all 4 categories; no NFR-specific test required.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
