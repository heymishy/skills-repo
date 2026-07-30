## Test Plan: Close the usage-cap bypass in the "add feature from within a product" flow

**Story reference:** artefacts/2026-07-30-product-feature-cap-bypass/stories/pfcb-s1-product-feature-cap-bypass.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | Blocks with 402 + human-readable message at cap | 1 | `tests/check-product-feature-cap-bypass.js` AC1 | 🟢 |
| AC2 | Zero journeys created when blocked | 1 | Same file, AC2 | 🟢 |
| AC3 | Succeeds unchanged when under cap | 1 | Same file, AC3 | 🟢 |
| AC4 | Succeeds unchanged when no cap configured | 1 | Same file, AC4 | 🟢 |
| AC5 | Paid/active tenant bypasses the cap entirely | 1 | Same file, AC5 | 🟢 |
| AC6 | No regressions | — | Full `run-all-tests.js` suite vs. baseline, plus targeted re-run of all 6 existing `handlePostProductFeature`-touching test files | 🟢 |

## Coverage gaps

None. Fully unit-testable — no live staging/production dependency, unlike most of this session's earlier fixes.

## Test Data Strategy

New test file (`check-product-feature-cap-bypass.js`) reuses the exact same `tenantPlan.setCapReader`/`setPlanStateAdapter` fake-adapter patterns already established in `tests/check-bri-s3.5-usage-gate.js`, and the same `makeRes()`/`freshRequire()` conventions already used by `tests/check-jrf-s2-register-product-feature-journeys.js`.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Not verified against real production traffic | Unlike this session's earlier staging-deploy fixes, this bug was found via direct manual testing against production, not CI | Full unit coverage (5 new tests) plus regression re-run of all existing touching tests gives high confidence without needing a live-environment observation step |
