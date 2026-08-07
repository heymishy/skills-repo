## Test Plan: Fix bri-s3.4's own rate-limit bypass gap

**Story reference:** artefacts/2026-07-30-bri-s34-rate-limit-bypass/stories/bslb-s1-fix-bri-s3.4-rate-limit-bypass.md

## AC Coverage

| AC | Description | Verification | Risk |
|----|-------------|--------------|------|
| AC1 | uniqueEmail() uses e2e-test- prefix | Code review against the diff; observed on the next real staging-deploy run | 🟢 |
| AC2 | signup POST sends the bypass header | Code review against the diff, mirrors ssr-s1's already-verified fix shape exactly | 🟢 |
| AC3 | No unit-test regressions | Confirmed by construction — tests/e2e/*.spec.js excluded from run-all-tests.js's glob | 🟢 |

## Coverage gaps

Same as ssr-s1: cannot be verified locally — only manifests against the real per-IP rate limiter on wuce-staging. Verification is observing the next staging-deploy run.

## Test Data Strategy

No new fixtures — reuses existing tests/e2e/fixtures/staging-auth.js helpers.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot verify locally | Real per-IP rate limiter only exists on real wuce-staging | Observe the next staging-deploy run |
