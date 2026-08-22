# Contract Proposal: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s1-gate-and-products-features.md`
**Date:** 2026-08-22

## What will be built

1. `src/web-ui/middleware/require-admin.js` refactored to export a new `resolveRole(req)` helper — extracts the existing session-role-read + live-role-check logic (currently inline inside `requireAdmin`) into a standalone function. `requireAdmin` itself is refactored to call `resolveRole(req)` internally instead of duplicating the logic, so its own behaviour is unchanged (verified by its own existing test suite continuing to pass unmodified).
2. A new file `src/web-ui/middleware/require-non-viewer.js` exporting `requireNonViewer(req, res, next)` — calls `resolveRole(req)` (imported from `require-admin.js`), denies with 403 if the resolved role is `'viewer'` or is missing/null/unrecognised (fail-closed), calls `next()` for `'admin'`/`'engineer'`/`'product'`. Has its own `setLogger`/`_logger` pair (reusing `require-admin.js`'s exact logging convention, not its logger instance — a separate `viewer_write_denied` event name from `requireAdmin`'s `admin_access_denied`).
3. `server.js` updated to wire `requireNonViewer` into 15 Products-group route blocks and 18 Features/journeys-group route blocks (the exact routes enumerated in AC1/AC2), each as an additional gate check alongside the route's existing `authGuard`/internal-`_checkAuth` pattern.
4. `server.js`'s bootstrap section updated to call `requireNonViewer`'s `setLogger` with the app's real logger (mirroring the existing `requireAdmin` wiring pattern).

## What will NOT be built

- No changes to `requireAdmin`'s own externally-observable behaviour — the refactor is internal (extract-method), not a behaviour change. `requireAdmin`'s existing test suite (`tests/check-arl-s2-admin-middleware.js` and others) must continue to pass unmodified as proof of this.
- No changes to Skill session, Credits/billing, or edge-case routes — those are `vrne-s2`/`vrne-s3`/`vrne-s4`.
- No new role added to `VALID_ROLES` — this story enforces the existing `viewer` role, it does not change the role model itself.
- No UI change to how roles are assigned (Team Management page is unaffected).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 15 unit tests, one per Products-group route, mock `req.session.role='viewer'`, assert 403 + underlying write function never called (spy) | unit |
| AC2 | 18 unit tests, one per Features/journeys-group route, same pattern | unit |
| AC3 | 3 unit tests (`engineer`/`product`/`admin` on 3 representative routes), assert `next()` called, no behaviour change | unit |
| AC4 | 4 unit tests (missing/null/unrecognised role, no session), assert 403 in every case | unit |
| AC5 | 1 unit test (injectable test logger asserts call shape) + 1 integration test (real `server.js` dispatch, 2 representative routes) | unit + integration |

## Assumptions

- `req.session.tenantId` and `req.session.login` are always populated by the time any of these route handlers run (true today for every authenticated session in this codebase, confirmed via `requireAdmin`'s own existing reliance on the same fields).
- The live-role-check adapter (`_getCurrentRole`, wired via `setGetCurrentRole`) is already correctly wired in production `server.js` bootstrap (pre-existing, confirmed via `sec-perf-s2`/`lrtc-s1`'s own DoD) — this story does not re-verify that wiring, only adds a second consumer (`resolveRole`) of the already-correct mechanism.
- No route in the Products/Features groups has a legitimate reason for a `viewer` to write to it that wasn't already considered at `/definition` — if one is discovered during implementation, it is a scope question for the operator, not a unilateral implementation decision.

## Estimated touch points

**Files:** `src/web-ui/middleware/require-admin.js` (refactor), `src/web-ui/middleware/require-non-viewer.js` (new), `src/web-ui/server.js` (33 route-block wiring changes + bootstrap `setLogger` call)
**Services:** None external — pure in-process middleware.
**APIs:** None new — gates existing routes, adds no new endpoints.
