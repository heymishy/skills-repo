## Test Plan: Replace bri-s3.5's local-file tenant-cap mechanism with a real remote override

**Story reference:** artefacts/2026-07-30-tenant-cap-remote-override/stories/tcro-s1-tenant-cap-remote-override.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | setTenantCapOverride takes immediate effect | 2 | `tests/check-bri-s3.5-usage-gate.js` "fix-forward" block | 🟢 |
| AC2 | clearTenantCapOverride reverts to next priority | 1 | Same file | 🟢 |
| AC3 | capReader still wins over override | 1 | Same file | 🟢 |
| AC4 | withTenantCap calls the real route, no file I/O | — | Code review of the diff | 🟢 |
| AC5 | No unit-test regressions | — | Full `npm test` run compared against `tests/known-baseline-failures.json` | 🟢 |

## Coverage gaps

Real confirmation that AC4 (and possibly AC2) of `bri-s3.5-billing-journey.spec.js` passes on real staging cannot be verified locally — same class of gap as every fix in this investigation thread. Verification is observing the next staging-deploy run. AC2's `page.fill` timeout is explicitly NOT claimed as fixed by this story — flagged as an open question to be resolved by the next run's evidence.

## Test Data Strategy

Extended `tests/check-bri-s3.5-usage-gate.js`'s existing fake-Postgres-adapter pattern with 3 new unit tests for the override mechanism itself.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2's real cause unconfirmed | Timeout happens before any cap-dependent code path runs, so the tenant-cap fix may be unrelated to it | Observe the next staging-deploy run's logs specifically for AC2's outcome, separate from AC4's |
