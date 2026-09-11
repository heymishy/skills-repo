# Implementation Plan: Thread impersonation state into the /dashboard route's renderShell call (ibg-s1)

**Story:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md
**Test plan:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/test-plans/ibg-s1-test-plan.md
**DoR:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/dor/ibg-s1-dor.md

---

## Task 1: Read `req.session.impersonation` in `handleGetDashboard` and thread it into both `renderShell` call sites (AC1, AC2, AC3)

**Files:** `src/web-ui/routes/products.js`

- Add an `impersonation` computation in `handleGetDashboard`, mirroring `dashboard.js`'s `handleDashboard` exactly (only when `imp.active && imp.target`, shape `{active, targetLogin, targetTenantId, csrfToken}`).
- Thread it into the `?view=board` branch's direct `renderShell()` call.
- Add `impersonation` as a new trailing parameter to `_renderProductDashboard`, and pass it through from the non-board branch's call site.
- Confirm the two existing test files that call `_renderProductDashboard` directly (`check-npwe-s1-skills-nav-wiring.js`, `check-fresc-s1-empty-state-clarity-copy.js`) still pass unmodified — a trailing optional parameter is backward compatible.

**Status:** committed

---

## Task 2: New regression test file covering AC1-AC4

**Files:** `tests/check-ibg-s1-dashboard-impersonation-banner.js` (new)

- T1/T2: active impersonation renders the banner div + exit control on both the main dashboard view and the `?view=board` branch.
- T3/T4: no impersonation → no banner div/exit-control on either branch, existing content unchanged.
- T5: banner's CSRF token is real (non-placeholder, length > 10).
- T6: existing `check-d2-banner-exit-permission-visibility.js` suite still passes (24/24 regression guard, per AC4).

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
