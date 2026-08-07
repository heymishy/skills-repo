## Test Plan: Deploy config safety net

**Story reference:** artefacts/2026-07-25-deploy-safety-net/stories/dsn-s1-deploy-config-safety-net.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | Hardcoded correct flyctl deploy flags | 1 test | — | 🟢 |
| AC2 | Post-deploy config check runs and parses correctly | 1 test | — | 🟢 |
| AC3 | Missing/wrong MOCK_LLM_GATEWAY -> loud error, exit non-zero | 2 tests | — | 🟢 |
| AC4 | Correct MOCK_LLM_GATEWAY -> success, exit 0 | 1 test | — | 🟢 |
| AC5 | Workflow calls the wrapper script, not raw flyctl | 1 test | — | 🟢 |
| AC6 | package.json has deploy:staging script | 1 test | — | 🟢 |

## Integration Tests

### deployCommandUsesCorrectHardcodedFlags
- **Verifies:** AC1
- **Action:** Inject a spy `flyctl` command runner into the script (injectable, D37-style); run the script
- **Expected result:** The captured deploy command args are exactly `deploy --remote-only --config fly.staging.toml --app wuce-staging`

### postDeployCheckParsesConfigCorrectly
- **Verifies:** AC2
- **Action:** Stub the config-show command to return a JSON payload with `MOCK_LLM_GATEWAY: "true"` in its env block
- **Expected result:** The script reads and correctly identifies the flag as present

### missingMockGatewayFlagFailsLoudly
- **Verifies:** AC3
- **Action:** Stub the config-show command to return a JSON payload with NO `MOCK_LLM_GATEWAY` key at all
- **Expected result:** Script prints an error naming `MOCK_LLM_GATEWAY` and `fly.staging.toml`; exits non-zero

### wrongMockGatewayValueFailsLoudly
- **Verifies:** AC3
- **Action:** Stub the config-show command to return `MOCK_LLM_GATEWAY: "false"` (present but wrong)
- **Expected result:** Script prints an error; exits non-zero

### correctConfigSucceeds
- **Verifies:** AC4
- **Action:** Stub the config-show command to return `MOCK_LLM_GATEWAY: "true"`
- **Expected result:** Script prints a success message; exits 0

### workflowCallsWrapperScript
- **Verifies:** AC5
- **Action:** Static check of `.github/workflows/staging-deploy.yml`'s `deploy-staging` job
- **Expected result:** The deploy step's `run:` line is `node scripts/deploy-staging.js`, not a raw `flyctl deploy` invocation

### packageJsonHasDeployScript
- **Verifies:** AC6
- **Action:** Static check of `package.json`
- **Expected result:** `scripts["deploy:staging"]` equals `"node scripts/deploy-staging.js"`

## Out of Scope for This Test Plan

- Testing real `flyctl` invocation against a real Fly app -- this test plan only covers the script's own logic via an injectable command-runner seam.
