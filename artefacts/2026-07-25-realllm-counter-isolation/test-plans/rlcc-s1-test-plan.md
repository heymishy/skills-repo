## Test Plan: Staging smoke-test job worker isolation (rlcc-s1)

**Story reference:** artefacts/2026-07-25-realllm-counter-isolation/stories/rlcc-s1-smoke-test-worker-isolation.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | smoke-test job's playwright line includes `--workers=1` | 1 test | — | 🟢 |
| AC2 | Change is scoped -- no other job gained `--workers=1` | 1 test | — | 🟢 |
| AC3 | `playwright.config.js` unmodified (no `workers` key added) | 1 test | — | 🟢 |

## Integration Tests

### smokeTestJobHasWorkersOne
- **Verifies:** AC1
- **Action:** Read `.github/workflows/staging-deploy.yml`, locate the `smoke-test` job's `Run @mocked suite against staging` step
- **Expected result:** its `run:` value contains `--workers=1`

### workersFlagScopedToSmokeTestOnly
- **Verifies:** AC2
- **Action:** Search the full `staging-deploy.yml` file for `--workers=1`
- **Expected result:** exactly one occurrence, inside the `smoke-test` job

### playwrightConfigUnchanged
- **Verifies:** AC3
- **Action:** Read `playwright.config.js`
- **Expected result:** no top-level `workers:` key present (module.exports object has no `workers` property)

## Out of Scope for This Test Plan

- Runtime/timing verification of the actual CI job duration -- observed via a real CI run, not a local test.
