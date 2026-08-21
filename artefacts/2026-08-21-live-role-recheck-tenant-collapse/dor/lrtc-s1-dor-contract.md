# Contract Proposal: Thread the authenticating person's identity through requireAdmin's live role re-check

**Story reference:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/stories/lrtc-s1-thread-identity-through-live-role-recheck.md
**Prepared by:** Claude (agent)
**Date:** 2026-08-21
**Status:** ✅ Reviewed — no mismatches

---

## What will be built

- `src/web-ui/middleware/require-admin.js`: the live re-check call changes from `_getCurrentRole(req.session.tenantId)` to `_getCurrentRole(req.session.tenantId, req.session.login)`.
- `src/web-ui/server.js`: both `setGetCurrentRole` wiring sites (the real-`DATABASE_URL` branch, and the fake-test-db branch `rbg-s1` added) change from `function(tenantId) { return getRoleForTenant(tenantId); }` to `function(tenantId, identityKey) { return getRoleForTenant(tenantId, identityKey); }`.
- `tests/check-sec-perf-s2-stale-role-revalidation.js`: two new tests added (AC1, AC2) exercising the real `resolveRoleForPerson` chain with a synthetic multi-person pool — not a hand-substituted mock, per the anti-pattern this story's own test plan documents was already present in the existing T8 test.

## What will NOT be built

- No change to `modules/user-roles.js`'s `resolveRoleForPerson`/`getRoleForTenant` function bodies — they already correctly accept and use an `identityKey` argument; only the two call sites that omit it are wrong.
- No change to the login-time role resolution path (`routes/auth.js`) — already correct, already passes `user.login`.
- No production-tenant audit for real-world exploitability — flagged as a recommended follow-up in the story, not part of this fix.
- No change to the existing T8/T9 tests in `check-sec-perf-s2-stale-role-revalidation.js` — they stay as-is, validating their own (narrower) original claims; new tests are added alongside them.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (two people, one tenant, correct per-person resolution) | New unit test in `check-sec-perf-s2-stale-role-revalidation.js`, using the real `resolveRoleForPerson` chain against a synthetic 2-person pool | unit |
| AC2 (solo-tenant regression check) | New unit test, same file, synthetic 1-person pool where `tenantId === identity` | unit |
| AC3 (rbg-s1's own AC1 E2E test passes unmodified) | Existing E2E test, `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, no changes needed | E2E |

## Assumptions

- `req.session.login` is reliably set at login time for both GitHub and Google OAuth flows (confirmed: `routes/auth.js` lines 301 and 452 both set it) and for email/password login (not yet directly confirmed — will verify during implementation; if absent there, `getRoleForTenant`'s existing `identityKey || tenantId` fallback already handles it safely, matching pre-existing email/password behaviour).
- No other call site relies on `_getCurrentRole`/`setGetCurrentRole`'s current single-argument shape in a way that would break from adding an optional second parameter (JS functions ignore extra arguments; existing callers passing only `tenantId` are unaffected).

## Estimated touch points

- 3 files changed: `src/web-ui/middleware/require-admin.js`, `src/web-ui/server.js`, `tests/check-sec-perf-s2-stale-role-revalidation.js`
- 0 new dependencies

---

**Contract review result:** ✅ Passed — proposed implementation aligns with all 3 ACs; no mismatches identified.
