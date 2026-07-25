## Test Plan: Free-tier credit grant at signup

**Story reference:** artefacts/2026-07-25-free-tier-credit-grant/stories/ftcg-s1-free-tier-credit-grant.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | New tenant -> grant applied, returns true | 1 test | — | 🟢 |
| AC2 | Existing tenant (any balance) -> no re-grant, returns false | 2 tests | — | 🟢 |
| AC3 | Concurrent calls -> exactly one grant applied | 1 test | — | 🟢 |
| AC4 | GitHub signup grants free tier | 1 test | — | 🟢 |
| AC5 | Google signup grants free tier | 1 test | — | 🟢 |
| AC6 | Email/password signup grants free tier | 1 test | — | 🟢 |
| AC7 | Returning user via each method -> unchanged balance | 3 tests | — | 🟢 |
| AC8 | Adapter not wired -> signup still succeeds | 3 tests | — | 🟢 |

## Integration Tests

### newTenantGetsGrantAndReturnsTrue
- **Verifies:** AC1
- **Action:** `grantFreeTierIfNew('brand-new-tenant', 10)` against a fresh fake DB with no existing row
- **Expected result:** Returns `true`; a subsequent `getBalance` returns `10`

### existingTenantNotReGranted (2 tests: nonzero balance, exactly-zero balance)
- **Verifies:** AC2
- **Action:** Seed a `credits` row with a known balance (e.g. `5`, and separately `0`), then call `grantFreeTierIfNew` again
- **Expected result:** Returns `false`; balance is unchanged (still `5`, still `0` respectively) -- proves the zero-balance case isn't misread as "no row"

### concurrentGrantsApplyExactlyOnce
- **Verifies:** AC3
- **Action:** Fire two `grantFreeTierIfNew` calls for the same brand-new tenant "concurrently" (`Promise.all`)
- **Expected result:** Final balance is exactly `10`, not `20`; exactly one of the two calls returns `true`

### githubSignupGrantsFreeTier
- **Verifies:** AC4
- **Action:** Drive `handleAuthCallback` for a brand-new GitHub identity (mocked OAuth adapter)
- **Expected result:** Resulting tenant's `getBalance` returns `10` (or the configured `CREDITS_FREE_TIER_GRANT`)

### googleSignupGrantsFreeTier
- **Verifies:** AC5
- **Action:** Drive `handleAuthGoogleCallback` for a brand-new Google identity (mocked OAuth adapter)
- **Expected result:** Resulting tenant's `getBalance` returns `10`

### emailSignupGrantsFreeTier
- **Verifies:** AC6
- **Action:** Drive `handleEmailSignup` with a brand-new email
- **Expected result:** Resulting tenant's `getBalance` returns `10`

### returningUserUnchangedBalance (3 tests: GitHub, Google, email)
- **Verifies:** AC7
- **Action:** Seed a tenant with an existing balance (e.g. `3`, simulating partial spend), then drive the same login/signup path again for the SAME identity
- **Expected result:** Balance remains `3`, not reset to `10` and not incremented

### adapterNotWiredSignupStillSucceeds (3 tests: GitHub, Google, email)
- **Verifies:** AC8
- **Action:** Simulate `grantFreeTierIfNew` throwing (adapter not wired / DB error) during each of the 3 signup paths
- **Expected result:** The signup/login itself still completes successfully (correct redirect, session fields set) -- the thrown error is caught and swallowed, never surfaced to the user

## Out of Scope for This Test Plan

- Re-testing the existing GitHub `isFirstLogin`/`/welcome` redirect logic -- pre-existing, unchanged.
- Re-testing paid-plan credit grants (`CREDITS_PLAN_<PLAN>`) -- pre-existing, unchanged, already covered by `check-lab-s3.1-credits-model.js` etc.
