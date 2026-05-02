# Test Plan: wuce.12 — BYOK and self-hosted provider configuration

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.12-byok-config.md
**Epic:** wuce-e3
**Framework:** Jest + Node.js (env var manipulation; `spawn` mocked via `child_process.spawn` spy)
**Test data strategy:** No committed fixtures; all state driven via `process.env` set/delete in each test

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | `COPILOT_PROVIDER_TYPE`, `BASE_URL`, `API_KEY`, `MODEL` injected into subprocess env | Unit (spawn mock) | None |
| AC2 | `COPILOT_OFFLINE=true` injected into subprocess env | Unit (spawn mock) | None |
| AC3 | No BYOK vars configured → none injected into subprocess | Unit (spawn mock) | None |
| AC4 | `COPILOT_PROVIDER_API_KEY` does not appear in logs or API responses | Unit (log spy + response inspection) | None |
| AC5 | Partial BYOK config → warning logged, server does not crash | Unit (startup validation call) | None |

---

## Unit tests

### T1 — BYOK env vars injected into subprocess env (AC1)

**T1.1 — all four BYOK vars present in subprocess env when all four are configured**
- Setup: set env vars `COPILOT_PROVIDER_TYPE=azure`, `COPILOT_PROVIDER_BASE_URL=https://my-endpoint.openai.azure.com`, `COPILOT_PROVIDER_API_KEY=sk-test-byok-key`, `COPILOT_MODEL=gpt-4o`; mock `child_process.spawn`; call `executeSkill("discovery", "prompt", "gho_token", "/tmp/home")`
- Expected: spawn `env` option contains all four keys with the configured values

**T1.2 — BYOK vars are present alongside `COPILOT_GITHUB_TOKEN` and `COPILOT_HOME`**
- Setup: as T1.1
- Expected: spawn `env` contains `COPILOT_GITHUB_TOKEN`, `COPILOT_HOME`, `COPILOT_PROVIDER_TYPE`, `COPILOT_PROVIDER_BASE_URL`, `COPILOT_PROVIDER_API_KEY`, `COPILOT_MODEL` — all six

**T1.3 — BYOK vars reflect current environment values, not hardcoded defaults**
- Setup: set `COPILOT_PROVIDER_BASE_URL=https://custom-host.example.com`
- Expected: spawn env `COPILOT_PROVIDER_BASE_URL` equals `"https://custom-host.example.com"` (not a different hardcoded value)
- Rationale: ADR-004 — all config via env vars; no hardcoded values

### T2 — `COPILOT_OFFLINE` mode (AC2)

**T2.1 — `COPILOT_OFFLINE=true` injected when env var is set**
- Setup: `process.env.COPILOT_OFFLINE = 'true'`; mock spawn; call `executeSkill`
- Expected: spawn `env` contains `COPILOT_OFFLINE: 'true'`

**T2.2 — `COPILOT_OFFLINE` NOT injected when env var is unset**
- Setup: `delete process.env.COPILOT_OFFLINE`; mock spawn; call `executeSkill`
- Expected: spawn `env` does NOT contain `COPILOT_OFFLINE` key

### T3 — No BYOK vars when none configured (AC3)

**T3.1 — when no `COPILOT_PROVIDER_*` vars are set, none are injected**
- Setup: ensure all BYOK vars are deleted from `process.env`; mock spawn
- Expected: spawn `env` does NOT contain `COPILOT_PROVIDER_TYPE`, `COPILOT_PROVIDER_BASE_URL`, `COPILOT_PROVIDER_API_KEY`, or `COPILOT_MODEL`

**T3.2 — standard vars (`COPILOT_GITHUB_TOKEN`, `COPILOT_HOME`) are still present when BYOK is absent**
- Setup: no BYOK vars; mock spawn
- Expected: spawn `env` still contains `COPILOT_GITHUB_TOKEN` and `COPILOT_HOME`

### T4 — API key never in logs or responses (AC4)

**T4.1 — `COPILOT_PROVIDER_API_KEY` value does not appear in any log call**
- Setup: set `COPILOT_PROVIDER_API_KEY=sk-super-secret-byok-key`; spy on logger (capture all log calls as strings); call `executeSkill`
- Expected: the string `"sk-super-secret-byok-key"` does NOT appear in any captured log call; no exception

**T4.2 — `COPILOT_PROVIDER_API_KEY` value does not appear in HTTP response body**
- Setup: authenticated session; set `COPILOT_PROVIDER_API_KEY=sk-super-secret-byok-key`; mock `executeSkill` to succeed
- Request: `POST /api/skills/discovery/execute` with a valid prompt
- Expected: response body JSON.stringify does NOT contain `"sk-super-secret-byok-key"`

**T4.3 — startup log records BYOK active state without key value**
- Setup: set `COPILOT_PROVIDER_TYPE=azure`, `COPILOT_PROVIDER_API_KEY=sk-secret`; spy on startup logger
- Action: call `validateByokConfig()` (startup validation function)
- Expected: logger called with a message containing `"azure"` (the type) but NOT containing `"sk-secret"` (the key value)

### T5 — Partial BYOK configuration warning and non-crash (AC5)

**T5.1 — `COPILOT_PROVIDER_TYPE` set but `COPILOT_PROVIDER_BASE_URL` absent → warning logged**
- Setup: `process.env.COPILOT_PROVIDER_TYPE = 'azure'`; delete `COPILOT_PROVIDER_BASE_URL`; spy on logger
- Action: call `validateByokConfig()`
- Expected: logger called with a warning-level message containing `"BYOK provider type set but base URL is missing"` (exact phrase from AC5)

**T5.2 — partial BYOK config does not throw or crash server startup**
- Setup: as T5.1
- Expected: `validateByokConfig()` resolves without throwing; server startup flow continues

---

## Integration tests

### IT1 — `POST /api/skills/:name/execute` uses BYOK env vars when configured (AC1, AC2)

- Setup: authenticated session; set all four BYOK env vars; spy on `executeSkill`; post to execute endpoint
- Expected: `executeSkill` called; the BYOK vars were present in the process env at call time (verified via subprocess mock inspection)

### IT2 — `GET /api/health` or startup log includes BYOK mode status (AC5, audit NFR)

- Setup: `COPILOT_PROVIDER_TYPE=anthropic` set; `COPILOT_PROVIDER_BASE_URL` set
- Request: `GET /api/health`
- Expected: response body or server startup log contains a BYOK-active indicator (`"byok": true` or similar) but does NOT contain the provider API key value

---

## NFR tests

### NFR1 — BYOK mode active/inactive logged at startup

- Setup: set BYOK vars; spy on startup logger
- Action: call the startup config initialisation function
- Expected: log entry contains provider type; does not contain API key; does not contain base URL (URL may be sensitive in some deployments — only type is logged)

### NFR2 — No BYOK vars leaked in any error response

- Setup: set `COPILOT_PROVIDER_API_KEY=sk-test-key`; mock `executeSkill` to throw an error
- Request: `POST /api/skills/discovery/execute`
- Expected: `500` response; response body does NOT contain `"sk-test-key"`

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC2 — actual offline execution without GitHub Copilot service | Requires a live BYOK provider endpoint | Unit test verifies env var injection; offline execution is a deployment-level smoke test documented below |
| AC1 — confirming BYOK provider actually routes correctly | Runtime-only; depends on external provider availability | Env var injection is fully verified in unit tests; actual routing is a manual verification step |

---

## Manual smoke test (AC1/AC2 live verification — requires BYOK provider)

For deployments where a BYOK provider is available:

```bash
export COPILOT_PROVIDER_TYPE=azure
export COPILOT_PROVIDER_BASE_URL=https://<your-endpoint>.openai.azure.com
export COPILOT_PROVIDER_API_KEY=<your-api-key>
export COPILOT_MODEL=gpt-4o
export COPILOT_GITHUB_TOKEN=<user-token>
node -e "
const { executeSkill } = require('./src/execution/subprocess-executor');
const { createSession, cleanupSession } = require('./src/execution/session-manager');
async function run() {
  const home = await createSession('smoke-test-user');
  const result = await executeSkill('discovery', 'What is the test problem?', process.env.COPILOT_GITHUB_TOKEN, home);
  const artefact = result.find(e => e.type === 'artefact');
  console.log('BYOK execution success, artefact present:', !!artefact);
  await cleanupSession(home);
}
run().catch(err => console.error('BYOK smoke test failed:', err.message));
"
```

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 13 |
| Integration tests | 2 |
| NFR tests | 2 |
| **Total** | **17** |

**acTotal: 5**
