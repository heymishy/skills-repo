## Test Plan: Named-identity staging stub (nis-s1)

**Story reference:** artefacts/2026-07-25-named-identity-stub/stories/nis-s1-named-identity-staging-stub.md

## AC Coverage

| AC | Description | Unit/Integration | Gap type | Risk |
|----|-------------|-------------------|----------|------|
| AC1 | Secret unset -> stub never activates | 1 test | — | 🟢 |
| AC2 | Secret+header+e2e- code -> stub activates, real adapter not called | 2 tests | — | 🟢 |
| AC3 | No stubTenant -> tenantId defaults to login | 1 test | — | 🟢 |
| AC4 | stubTenant without e2e- prefix -> 400, no session | 1 test | — | 🟢 |
| AC5 | stubTenant with e2e- prefix -> tenantId = stubTenant | 1 test | — | 🟢 |
| AC6 | Role/first-login/credit-grant call real unmodified functions | 3 tests | — | 🟢 |
| AC7 | seed-multi-user-roles rejects non-e2e- sharedOrg; default is e2e-shared-org with e2e-alice/e2e-bob/e2e-viewer | 2 tests | — | 🟢 |
| AC8 | Local NODE_ENV=test harness unaffected | existing bri-s3.3/bri-s3.6 suites re-run | — | 🟢 |

## Unit/Integration Tests (new file: tests/check-nis-s1-named-identity-stub.js)

### secretUnsetStubNeverActivates
- **Verifies:** AC1
- **Precondition:** `E2E_STAGING_AUTH_STUB_SECRET` unset; header present with any value
- **Action:** call `handleAuthCallback` with `code=e2e-anything`, the header set
- **Expected:** real `providerExchangeCode` is invoked (spy called), stub path not taken

### secretSetHeaderMatchesCodePrefixedActivatesStub
- **Verifies:** AC2
- **Precondition:** secret set; header matches; `code=e2e-alice`
- **Expected:** real `providerExchangeCode`/`providerGetUserIdentity` NOT called; session populated with deterministic userId/login='e2e-alice'

### secretSetButCodeMissingPrefixDoesNotActivateStub
- **Verifies:** AC2 (negative case)
- **Precondition:** secret set; header matches; `code=alice` (no e2e- prefix)
- **Expected:** real adapter path taken instead (falls through safely, does not silently accept a non-prefixed login)

### noStubTenantDefaultsToLoginTenant
- **Verifies:** AC3
- **Action:** stub-activated call with `code=e2e-solo`, no `stubTenant`
- **Expected:** `req.session.tenantId === 'e2e-solo'`

### stubTenantWithoutPrefixRejected
- **Verifies:** AC4
- **Action:** stub-activated call with `code=e2e-alice&stubTenant=real-customer-org`
- **Expected:** HTTP 400, no `req.session.tenantId` set, no session rotation performed

### stubTenantWithPrefixSetsTenantDirectly
- **Verifies:** AC5
- **Action:** stub-activated call with `code=e2e-alice&stubTenant=e2e-shared-org`
- **Expected:** `req.session.tenantId === 'e2e-shared-org'`

### roleResolutionUsesRealGetRoleForTenant
- **Verifies:** AC6
- **Action:** stub-activated call; spy on `_userRoles.getRoleForTenant`
- **Expected:** called with `(tenantId, login)` exactly as the real path does; its return value (not any caller input) becomes `req.session.role`

### firstLoginUsesRealUserFlagsAdapter
- **Verifies:** AC6
- **Action:** stub-activated call; spy on `_userFlags.getFirstLoginFlag`/`clearFirstLoginFlag`
- **Expected:** both called with the stub-derived deterministic `userId`, exactly as the real path does

### creditGrantCalledForStubIdentity
- **Verifies:** AC6
- **Action:** stub-activated call; spy on `_credits.grantFreeTierIfNew`
- **Expected:** called with the resolved `tenantId`, exactly as the real path does

### seedMultiUserRolesRejectsNonE2ESharedOrg
- **Verifies:** AC7
- **Action:** POST `/test/seed-multi-user-roles` with `sharedOrg=real-org-name` (gated header present)
- **Expected:** HTTP 400, no rows written

### seedMultiUserRolesDefaultsAndKeysUseE2EPrefix
- **Verifies:** AC7
- **Action:** POST `/test/seed-multi-user-roles` with no `sharedOrg`
- **Expected:** response `sharedOrg === 'e2e-shared-org'`; seeded `identity_key` values are `e2e-alice`/`e2e-bob`/`e2e-viewer`

## Existing Suite Re-run (AC8)

- `tests/check-bri-s3.6-auth-journey.js` — must remain 100% passing, unmodified assertions
- Local Playwright run of `bri-s3.3-multi-user-tenant-journey.spec.js` and `bri-s3.6-auth-journey.spec.js` (`NODE_ENV=test`) — must remain 100% passing after their login-helper/constant updates

## Out of Scope for This Test Plan

- A live re-run against real `wuce-staging` — deferred to post-merge verification (matches `dss-s1` precedent).
