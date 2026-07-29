## Test Plan: Fix the E2E test gaps blocking every staging-deploy smoke test

**Story reference:** artefacts/2026-07-30-staging-smoke-test-regressions/stories/ssr-s1-fix-staging-smoke-test-failures.md

## AC Coverage

| AC | Description | Verification | Risk |
|----|-------------|--------------|------|
| AC1 | bri-s3.2 signup uses e2e-test- prefix + bypass header | Code review of the diff against `serlb-s1`'s documented gate requirements in `routes/auth-email.js`; observed on the next real `staging-deploy` run | 🟢 |
| AC2 | bri-s3.2 asserts the correct auto-skip redirect | Code review against `extractStoryIdsFromDefinitionArtefact`'s actual regex and `definition.success.json`'s actual fixture content; observed on the next real `staging-deploy` run | 🟢 |
| AC3 | a3 test scopes its dashboard locator to `<main>` | Code review confirming `<main>` wraps `bodyContent` in `html-shell.js` (already confirmed during root-cause investigation); observed on the next real `staging-deploy` / post-deploy E2E confirmation run | 🟢 |
| AC4 | No new unit-test regressions | Full local `npm test` run compared against `tests/known-baseline-failures.json` | 🟢 |

## Coverage gaps

None of these three fixes can be verified by a local, non-staging test run — they specifically target behaviour that only manifests against the real deployed `wuce-staging` app (real per-IP rate limiting, the real definition-stage mock fixture content, and the real pan-s1-deployed sidebar markup). Verification for AC1-AC3 is: code-level review against the documented mechanisms each targets, plus observing the actual next `staging-deploy` workflow run once this merges — there is no local harness equivalent for "does the real per-IP counter on wuce-staging get bypassed correctly."

## Test Data Strategy

No new fixtures needed — reuses existing `tests/e2e/fixtures/staging-auth.js` helpers and the existing `definition.success.json` mock fixture (read, not modified).

## NFR Tests

None beyond AC4 (regression guard).

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot verify AC1-AC3 without a real staging deploy | These are staging-environment-specific behaviours (real rate limiter, real deployed markup) not reproducible in a local/CI-only harness | Merge, observe the next real `staging-deploy` workflow run, and treat that as the actual verification evidence for this story's DoD |
