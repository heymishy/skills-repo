## Test Plan: Staging-safe test endpoint gate

**Story reference:** artefacts/2026-07-25-staging-safe-test-endpoints/stories/dss-s1-staging-safe-test-endpoint-gate.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | Secret unset -> unchanged behaviour (test/other envs) | 4 tests (one per route) | — | 🟢 |
| AC2 | Secret set + matching header -> works like NODE_ENV=test | 4 tests | — | 🟢 |
| AC3 | Secret set + wrong/absent header -> same as secret unset | 4 tests | — | 🟢 |
| AC4 | Counter instrumentation always active, call unaffected | 2 tests | — | 🟢 |
| AC5 | Spec files omit header locally, unchanged behaviour | Manual/static review | — | 🟢 |
| AC6 | Real CI re-run after merge succeeds | Live re-run | — | 🟢 |
| AC7 | Other 4 routes completely untouched | 4 tests (regression) | — | 🟢 |

## Integration Tests

### For each of the 4 routes (real-llm-call-count, complete-onboarding, seed-multi-user-roles, stripe-call-count):

#### secretUnsetBehaviourUnchanged (AC1, x4)
- **Precondition:** `E2E_STAGING_AUTH_STUB_SECRET` unset, `NODE_ENV` not `'test'`
- **Action:** call the route with no bypass header
- **Expected result:** identical to today's pre-story behaviour (falls through / whatever the route does today when NODE_ENV isn't test)

#### secretSetMatchingHeaderWorks (AC2, x4)
- **Precondition:** `E2E_STAGING_AUTH_STUB_SECRET` set, `NODE_ENV` not `'test'`
- **Action:** call the route with `x-e2e-test-endpoint-bypass` matching the secret
- **Expected result:** identical to the route's own existing `NODE_ENV=test` behaviour (200 + correct JSON body / correct mutation)

#### secretSetWrongHeaderRejected (AC3, x4)
- **Precondition:** `E2E_STAGING_AUTH_STUB_SECRET` set, `NODE_ENV` not `'test'`
- **Action:** call the route with a non-matching or absent header
- **Expected result:** identical to AC1 (secret-unset) behaviour — no partial access

### counterInstrumentationAlwaysActive (AC4)
- **Verifies:** AC4
- **Action:** with `NODE_ENV` not `'test'` and no bypass secret, trigger a real `https.request`-shaped call to a mocked `api.anthropic.com` hostname (stub `https.request` at the test level to avoid a real network call); read `global.__BRI_S3_2_REAL_LLM_CALL_COUNT__`
- **Expected result:** counter increments regardless of `NODE_ENV`; the wrapped call itself still forwards to the original `https.request` unmodified

### specFilesOmitHeaderLocally (AC5)
- **Verifies:** AC5
- **Action:** static review of the 4 updated spec files — confirm the header is only added when `process.env.E2E_STAGING_AUTH_STUB_SECRET` is truthy
- **Expected result:** local runs (secret absent) send no new header at all

### realCiReRunSucceeds (AC6)
- **Verifies:** AC6
- **Action:** merge, then re-run (or wait for the next) `Staging Deploy` workflow's `smoke-test` job
- **Expected result:** the 4 previously-failing `/test/*`-dependent assertions now pass

### otherRoutesUnchanged (AC7, x4)
- **Verifies:** AC7
- **Action:** re-run existing test coverage (if any) for `/test/session`, `/test/seed-definition-session`, `/test/canvas`, `/test/seed-board-journey`
- **Expected result:** byte-identical behaviour to before this story — no bypass path added

## Out of Scope for This Test Plan

- Testing the adjacent rate-limiting gap in these spec files' own signup calls — deferred, see decisions.md.
- Re-testing `a1-staging-safe-auth-stub`'s or `serlb-s1`'s own mechanisms — pre-existing, unchanged.
