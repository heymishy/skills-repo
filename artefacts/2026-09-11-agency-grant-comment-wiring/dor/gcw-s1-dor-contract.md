# Contract Proposal — Wire the already-built shared-access grant and client-agency comment routes into live URLs

**Story:** `artefacts/2026-09-11-agency-grant-comment-wiring/stories/gcw-s1-wire-grant-and-comment-routes.md`
**Date:** 2026-09-11

---

**What will be built:**
9 new route registrations in `src/web-ui/server.js`, wiring 9 already-implemented, already-tested handler functions exported from `src/web-ui/routes/products.js` (5 from Story 2, 4 from Story 5) into live URLs, using this codebase's existing dispatch pattern (`pathname.match(...)`, `pathname.split('/')` for params, `authGuard` wrapper). The 3 mutating routes additionally get the existing `csrfGuard` preamble already used by every other mutating POST route in `products.js`, which these 3 handlers were missing.

**What will NOT be built:**
No change to any of the 9 handlers' own internal logic. No UI/visual pages — API routes only. No fix to `handleCreateAgencyComment`/`handleListAgencyComments`'s missing resource-ownership check (logged as a follow-up in `decisions.md`, not built here).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Dispatch to `handleCreateGrant` via the new route shape, owner vs. non-owner | Integration |
| AC2 | Dispatch to `handleListSharedProducts`/`handleGetSharedProduct` via the new route shapes, granted vs. ungranted | Integration |
| AC3 | Dispatch PUT/POST/DELETE to `/client/shared-products/:id` | Integration |
| AC4 | Dispatch to the 4 comment handlers via the new route shapes | Integration |
| AC5 | Dispatch to the 3 mutating routes with missing/invalid CSRF token | Integration |
| AC6 | Chain: activate → create client → grant → client views | Integration |

Plus a live post-deploy Chrome smoke check on staging (AC1/AC2/AC4/AC6) — same standard `asa-s1` and `jgls-s1` set earlier this session.

**Assumptions:**
- `_pshPool` (already wired for every other `products.js` route in `server.js`) is the correct pool to pass to these 9 handlers — same underlying Postgres instance as `_userRolesPool`, which Story 2's own schema migration already runs against.
- No other code path already reaches these 9 handlers under a different URL (confirmed by the exhaustive grep that found this gap in the first place).

**Estimated touch points:**
Files: `src/web-ui/server.js` (9 new route registrations, ~9 handler imports added to the existing `products.js` require line), `tests/` (one new test file).
Services: None new.
APIs: 9 new routes on already-existing infrastructure.
