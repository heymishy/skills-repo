## Test Plan: Fix seedTestSession's dead staging bypass and withAuth's staging-incompatible tests

**Story reference:** artefacts/2026-07-30-seedtestsession-and-withauth-staging/stories/swts-s1-fix-seedtestsession-and-withauth.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | Default throws unchanged | 2 | `tests/check-seedtestsession-allow-outside-test.js` T2, T4 | 🟢 |
| AC2 | allowOutsideTest:true permits seeding | 1 | `tests/check-seedtestsession-allow-outside-test.js` T3 | 🟢 |
| AC3 | /test/session passes allowOutsideTest:true | — | Code review of the diff | 🟢 |
| AC4 | bri-s3.6 AC3/AC4 no longer use withAuth | — | Code review of the diff; observed on next staging-deploy run | 🟢 |
| AC5 | No unit-test regressions | — | Full `npm test` run compared against `tests/known-baseline-failures.json` | 🟢 |

## Coverage gaps

AC4's real confirmation (that `bri-s3.6` passes against real staging) cannot be verified locally — same class of gap as every fix in this investigation thread. Verification is observing the next staging-deploy run.

## Test Data Strategy

New unit test (`check-seedtestsession-allow-outside-test.js`) uses direct module calls with temporary `NODE_ENV` overrides, restored after each test. No new E2E fixtures.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-staging confirmation for bri-s3.5/bri-s3.6 | Only manifests against real staging's per-IP/route behaviour | Observe the next staging-deploy run |
