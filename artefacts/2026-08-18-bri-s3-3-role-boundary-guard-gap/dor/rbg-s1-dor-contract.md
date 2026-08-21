# Contract Proposal: Fix bri-s3.3's role-boundary regression guard so it actually asserts denial

**Story reference:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/stories/rbg-s1-fix-role-boundary-regression-guard.md
**Prepared by:** Claude (agent)
**Date:** 2026-08-21
**Status:** ✅ Reviewed — no mismatches

---

## What will be built

- `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, and only that file, is edited.
- The existing "AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied" test is rewritten to target `GET /admin/credits` — a route that is genuinely admin-gated — instead of the current shared, non-admin-gated `GET /products/:productId` route. Alice (admin) must get `200`; Bob (engineer) must get `403`.
- The existing "AC3: viewer-role write attempt is denied" test, currently an empty placeholder that only re-checks an LLM-call counter, has its body implemented for real: log in as the already-seeded `e2e-viewer` identity and assert `GET /admin/credits` returns `403`.
- No other test in the file is touched. No application code (`src/web-ui/**`) is touched.

## What will NOT be built

- No new role-enforcement mechanism, middleware, or route guard anywhere in the codebase. The only mechanism this story exercises is the existing `requireAdmin` middleware.
- No enforcement of viewer-role restrictions on any route other than `GET /admin/credits`. There is currently no such enforcement anywhere in the codebase for any other write action — building that is out of scope and tracked separately at `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md` (awaiting operator approval, not yet started).
- No change to the `product`/`engineer` role boundary, or to any role other than admin vs. non-admin.

## How each AC will be verified

| AC | Verification |
|----|--------------|
| AC1 | `alice.ctx.get('/admin/credits')` → `200`; `bob.ctx.get('/admin/credits')` → `403` |
| AC2 | `viewer.ctx.get('/admin/credits')` (login as `e2e-viewer`) → `403` |
| AC3 | Full file run (`npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`) — all 5 tests pass, no regression to the 3 untouched tests |

## Assumptions

- `e2e-viewer` / `VIEWER_PERSON_ID = 103` is already seeded by the file's existing `beforeAll` hook via `POST /test/seed-multi-user-roles` (confirmed present, `server.js:2351-2399`) — no new fixture data is required.
- `requireAdmin` correctly denies non-admin roles on `/admin/credits` in the current codebase (confirmed this session via the live production `isAdmin`-propagation investigation — the underlying gate itself was never the bug; only nav-link visibility was).
- No real production tenant's outcome is affected by this change — it is test-only.

## Estimated touch points

- 1 file changed: `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`
- 0 application files changed
- 0 new dependencies

---

**Contract review result:** ✅ Passed — proposed implementation aligns with all 3 ACs; no mismatches identified.
