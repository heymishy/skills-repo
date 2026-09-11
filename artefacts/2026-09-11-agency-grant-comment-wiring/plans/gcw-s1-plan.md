# Wire the already-built shared-access grant and client-agency comment routes into live URLs — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Wire 9 already-implemented, already-tested handler functions (5 from Story 2, 4 from Story 5) into live URLs in `server.js`, and add the missing CSRF protection those 3 mutating handlers never had.
**Branch:** `feature/gcw-s1`
**Worktree:** `.worktrees/gcw-s1`
**Test command:** `node tests/check-gcw-s1-agency-grant-comment-wiring.js` (new), `npm test` (full baseline)

---

## File map

```
Create:
  tests/check-gcw-s1-agency-grant-comment-wiring.js  — 14 new tests + 1 wiring regression

Modify:
  src/web-ui/server.js  — import the 9 handlers + _csrf middleware, register 9 new routes
```

---

## Task 1: Import handlers + CSRF middleware

**Files:** Modify `src/web-ui/server.js`

- [x] Extend the existing `require('./routes/products')` destructure with the 9 new handler names.
- [x] Add `const _gcwCsrf = require('./middleware/csrf');`

## Task 2: Register the 9 routes (AC1-AC4)

**Files:** Modify `src/web-ui/server.js`

- [x] `POST /api/agency/grants` → `handleCreateGrant`, CSRF-guarded
- [x] `POST /api/agency/grants/:grantId/revoke` → `handleRevokeGrant`
- [x] `POST /api/agency/comments` → `handleCreateAgencyComment`, CSRF-guarded
- [x] `GET /api/agency/comments/:id` → `handleListAgencyComments`
- [x] `GET /client/shared-products` → `handleListSharedProducts`
- [x] `GET /client/shared-products/:id` → `handleGetSharedProduct`
- [x] `PUT|POST|DELETE /client/shared-products/:id` → `handleMutateSharedProduct`
- [x] `POST /client/comments` → `handleCreateSharedComment`, CSRF-guarded
- [x] `GET /client/comments/:id` → `handleListSharedComments`

All wrapped in `authGuard`, all passed `_pshPool` (the same pool already wired for every other `products.js` route).

## Task 3: Tests (AC1-AC6)

**Files:** Create `tests/check-gcw-s1-agency-grant-comment-wiring.js`

- [x] 14 integration tests dispatching through local helpers that mirror the exact server.js wiring shape (param extraction, csrfGuard-first for mutating routes) — not re-testing the 9 handlers' own internal logic (already covered by `check-story2-relationship-grants-enforcement.js`/`check-story5-client-agency-comments.js`).
- [x] 1 wiring-regression test (source-scan `server.js`).
- [x] AC6's end-to-end test chains `asa-s1` (activate) → Story 3 (create client) → this story's own grant route → this story's own client-view route — the actual proof the epic's core value chain now works.

## Task 4: Regression + full baseline

- [x] `node tests/check-gcw-s1-agency-grant-comment-wiring.js` — 14/14 passing
- [x] `node tests/check-story2-relationship-grants-enforcement.js` — 15/15 passing (unaffected)
- [x] `node tests/check-story5-client-agency-comments.js` — 13/13 passing (unaffected)
- [x] `node tests/check-story3-self-service-provisioning.js` — 18/18 passing (unaffected)
- [x] `node tests/check-asa-s1-agency-self-activation.js` — 8/8 passing (unaffected)
- [ ] `npm test` — full baseline (in progress)

## Task 5: Live smoke check

- [ ] Re-verify on `wuce-staging.fly.dev` after this fix deploys: as the now-activated Agency org, share the previously-created Client org's access to a real product via `POST /api/agency/grants`, then confirm `GET /client/shared-products` (as that Client org's own session, once Story 4's login path is exercised) shows it — the exact live reproduction that found this gap.

---

<!-- All 6 ACs covered across Tasks 1-3; AC6's integration test is the
     direct proof this story closes the gap it exists to close, chaining
     asa-s1 + Story 3 + this story's own new routes end-to-end. -->
