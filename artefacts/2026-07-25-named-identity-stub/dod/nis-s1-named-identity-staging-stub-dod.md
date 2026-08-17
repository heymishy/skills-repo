# Definition of Done: `/auth/github/callback` supports a staging-safe named-identity stub so bri-s3.3/bri-s3.6 can run against real staging

**PR:** #604 (commit `06d902dd`) | **Merged:** 2026-07-25 19:01:08 +1200
**Story:** artefacts/2026-07-25-named-identity-stub/stories/nis-s1-named-identity-staging-stub.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|----------------------|-----------|
| AC1 | Yes | `testAC1SecretUnsetStubNeverActivates` -- "AC1: real providerExchangeCode invoked when secret unset, even with header+e2e- code present" | `tests/check-nis-s1-named-identity-stub.js` (unit, re-run this session) | None |
| AC2 | Yes | `testAC2StubActivatesForE2ECode` -- "AC2: real providerExchangeCode NOT invoked when stub is active" + "AC2: session login set from code via stub path"; `testAC2NonPrefixedCodeFallsThroughToRealPath` -- "AC2 (negative): a non-\"e2e-\"-prefixed code falls through to the real provider path" | `tests/check-nis-s1-named-identity-stub.js` (unit) | None |
| AC3 | Yes | `testAC3NoStubTenantDefaultsToLogin` -- "AC3: tenantId defaults to the login itself when stubTenant is absent" | `tests/check-nis-s1-named-identity-stub.js` (unit) | None |
| AC4 | Yes | `testAC4NonPrefixedStubTenantRejected` -- "AC4: non-\"e2e-\"-prefixed stubTenant is rejected with 400" + "AC4: no tenantId is set on rejection" + "AC4: rejection happens before any provider-exchange attempt" | `tests/check-nis-s1-named-identity-stub.js` (unit) | None |
| AC5 | Yes | `testAC5PrefixedStubTenantSetsTenantDirectly` -- "AC5: tenantId is set directly from stubTenant, bypassing org-allowlist resolution" | `tests/check-nis-s1-named-identity-stub.js` (unit) | None |
| AC6 | Yes | `testAC6RealRoleFirstLoginCreditGrantWired` -- asserts `getRoleForTenant` called with real `(tenantId, login)`, `req.session.role` set only from its return value, `getFirstLoginFlag` called with stub-derived userId, `grantFreeTierIfNew` called with resolved tenantId | `tests/check-nis-s1-named-identity-stub.js` (unit) | None |
| AC7 | Yes | `testAC7SeedEndpointSourceHardening` -- "AC7: sharedOrg default is e2e-shared-org" + "AC7: sharedOrg is validated against an e2e- prefix pattern" + "AC7: seeded identity_key values use the e2e- prefix" (source-level assertion against `server.js`) | `tests/check-nis-s1-named-identity-stub.js` (static/source check) | None |
| AC8 | Partial | Story requires `bri-s3.3-multi-user-tenant-journey.spec.js` and `bri-s3.6-auth-journey.spec.js` to pass unchanged locally; the test plan assigns this to a separate existing-suite re-run (`tests/check-bri-s3.6-auth-journey.js` + local Playwright run), not to `check-nis-s1-named-identity-stub.js`. Both spec files and the check script exist in the repo, but no fresh pass/fail evidence for that specific re-run was supplied for this DoD pass -- only `check-nis-s1-named-identity-stub.js`'s 16/16 was. | Not independently re-verified this session | Gap: no fresh AC8-specific evidence this pass (see Scope Deviations) |

## Scope Deviations

- AC8's dedicated verification (existing-suite re-run of `bri-s3.3`/`bri-s3.6` under `NODE_ENV=test`) was not re-run as part of this retroactive DoD pass -- only `check-nis-s1-named-identity-stub.js` (AC1-AC7) was supplied/re-run. The referenced files (`tests/check-bri-s3.6-auth-journey.js`, `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, `tests/e2e/bri-s3.6-auth-journey.spec.js`) all exist in the repo, but this is not the same as fresh pass/fail confirmation. This is a verification-coverage gap in this DoD pass, not a known product defect.
- The story's own "Out of Scope" section explicitly defers a live re-run against real `wuce-staging` to a post-merge verification step, matching the `dss-s1` precedent -- accepted, not a defect.

## Test Plan Coverage

- `tests/check-nis-s1-named-identity-stub.js`: **16 passed, 0 failed** (freshly re-run this session; the "null/null" figure supplied at task start was a harness artefact -- re-running the script directly produced a clean, fully-enumerated 16/0 result across AC1-AC7).
- AC8's existing-suite re-run (`tests/check-bri-s3.6-auth-journey.js` + Playwright `bri-s3.3`/`bri-s3.6` specs) was not executed in this pass -- see Scope Deviations.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Security -- `e2e-` prefix enforced on every caller-controlled identity/tenant value | Met | AC2 negative case (non-prefixed `code` falls through to real path), AC4 (non-prefixed `stubTenant` rejected 400), AC7 (`sharedOrg` and seeded identity keys source-verified against `e2e-` pattern) |
| Backward compatibility -- zero behaviour change for real OAuth path and local `NODE_ENV=test` harness | Met for real OAuth path (AC1: secret unset leaves real exchange path untouched) | Local harness path (AC8) not independently re-confirmed this pass -- see above |

## Metric Signal

No benefit-metric artefact is referenced by this story or present in this feature's artefact folder (`artefacts/2026-07-25-named-identity-stub/` contains only `decisions.md`, `dor/`, `stories/`, `test-plans/`). This is a short-track security-scoped infra fix restoring a staging smoke-test signal for `bri-s3.3`/`bri-s3.6`, not a metric-bearing feature story.

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** Re-run `tests/check-bri-s3.6-auth-journey.js` and the local Playwright suite (`bri-s3.3-multi-user-tenant-journey.spec.js`, `bri-s3.6-auth-journey.spec.js`) to close the AC8 evidence gap; also complete the story's own pre-accepted follow-up of a live post-merge verification run against real `wuce-staging`.

## DoD Observations

The core stub mechanism (AC1-AC7, the security-critical prefix-enforcement logic) is fully evidenced by a clean 16/0 unit-test run against the real `handleAuthCallback` code path; production longevity since the 2026-07-25 merge is not independently confirmed in this pass. The only gap is missing fresh evidence for AC8's existing-suite re-run, not a known defect in shipped behaviour.
