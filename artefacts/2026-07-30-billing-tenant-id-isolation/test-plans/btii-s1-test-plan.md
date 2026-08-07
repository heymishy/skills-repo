## Test Plan: Give bri-s3.5's billing E2E tenants unique per-run IDs so plan state doesn't leak across staging-deploy runs

**Story reference:** artefacts/2026-07-30-billing-tenant-id-isolation/stories/btii-s1-billing-tenant-id-isolation.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | AC1 test's tenant ID is unique per run | — | Code review of the diff (`RUN_SUFFIX` token appended) | 🟢 |
| AC2 | All 4 tenant IDs replaced consistently | — | Code review of the diff; grep for the 4 old hardcoded literals to confirm none remain | 🟢 |
| AC3 | Top-of-file comment updated to reflect the real isolation boundary | — | Code review of the diff | 🟢 |
| AC4 | No unit-test regressions | — | Full `npm test` / local suite run compared against `tests/known-baseline-failures.json` | 🟢 |

## Coverage gaps

This is a pure test-fixture fix inside an E2E spec — E2E specs can't be meaningfully run locally against real staging behaviour (no local Postgres-backed `tenant_plan` persistence across "runs" to reproduce the pollution scenario). As with every fix in this investigation thread, real confirmation is observing the next staging-deploy run and checking whether AC1/AC3/AC4 (the spec's own ACs) now pass consistently. AC2 (the spec's timeout) is explicitly not claimed as fixed by this story.

## Test Data Strategy

None new — this story doesn't add test data, it makes existing E2E test-fixture tenant IDs unique per run via a `Date.now() + random` suffix token, matching the existing `uniqueEmail()` convention from `bri-s3.2`/`bri-s3.4`.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot locally reproduce cross-run Postgres pollution | Local test runs use a fresh fake in-memory adapter (`check-bri-s3.5-usage-gate.js`), not the real persisted table `bri-s3.5-billing-journey.spec.js` hits against staging | Observe the next staging-deploy run's logs specifically for AC1/AC3/AC4 (the pollution-affected ACs), separate from AC2 |
| AC2's real cause still unconfirmed | Its timeout occurs before any tenant-ID-dependent assertion, so this fix may not resolve it | Continue treating AC2 as a distinct, open investigation if it persists after this merge |
