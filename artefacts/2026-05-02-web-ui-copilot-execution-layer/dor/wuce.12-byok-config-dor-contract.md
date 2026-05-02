# Contract Proposal: BYOK and self-hosted provider configuration

**Story:** wuce.12
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- BYOK configuration module: `src/config/byok-config.js`
  - `getBYOKEnv() -> Record<string, string>` — reads BYOK env vars at call time; returns key-value pairs to merge into subprocess env
  - Vars read: `COPILOT_PROVIDER_TYPE`, `COPILOT_PROVIDER_BASE_URL`, `COPILOT_PROVIDER_API_KEY`, `COPILOT_PROVIDER_MODEL`, `COPILOT_OFFLINE`
  - When `COPILOT_PROVIDER_TYPE` set but `COPILOT_PROVIDER_BASE_URL` absent: logs warning, returns partial config (does not throw)
  - When no BYOK vars set: returns empty object (no BYOK env vars injected)
- Key redaction utility: `src/utils/redact-sensitive.js` — redacts `COPILOT_PROVIDER_API_KEY` value from error messages and log strings
- Integration: `executeSkill` in `src/modules/skill-executor.js` merges `getBYOKEnv()` result into subprocess env (wuce.9 integration point)

## Components NOT built by this story

- UI for entering or rotating BYOK keys — env vars only
- Runtime key rotation without server restart
- Multi-provider load balancing or failover
- Provider health check endpoint
- Provider auto-discovery

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | `COPILOT_PROVIDER_TYPE=azure` + URL + KEY + MODEL → set in subprocess env | `when all BYOK vars present → all injected into subprocess env`, `COPILOT_PROVIDER_TYPE injected`, `COPILOT_PROVIDER_BASE_URL injected`, `COPILOT_PROVIDER_MODEL injected` |
| AC2 | `COPILOT_OFFLINE=true` → set in subprocess env | `COPILOT_OFFLINE=true → injected into subprocess env`, `COPILOT_OFFLINE unset → not injected` |
| AC3 | No BYOK vars → no BYOK env vars injected | `no BYOK env vars → getBYOKEnv returns empty object`, `subprocess env does not contain COPILOT_PROVIDER_* keys` |
| AC4 | API key never in logs or API response | `error log does not contain COPILOT_PROVIDER_API_KEY value`, `API response body does not contain API key`, `redact-sensitive strips key value from strings` |
| AC5 | Provider type set but base URL absent → startup warning, no crash | `COPILOT_PROVIDER_TYPE set, COPILOT_PROVIDER_BASE_URL absent → warning logged`, `server does not crash`, `subsequent invocations still function` |

## Assumptions

- BYOK env vars are read fresh on each `getBYOKEnv()` call — supports server restart for rotation without code changes
- The `executeSkill` module (wuce.9) calls `getBYOKEnv()` and merges the result — no BYOK logic inside the executor itself

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/config/byok-config.js` | Create | `getBYOKEnv` module |
| `src/utils/redact-sensitive.js` | Create | API key redaction utility |
| `src/modules/skill-executor.js` | Extend | Merge `getBYOKEnv()` into subprocess env (wuce.9 integration) |
| `tests/byok-config.test.js` | Create | 17 Jest tests for wuce.12 |

## Contract review

**APPROVED** — all components are within story scope, API key redaction is explicit, env-var-only configuration enforces ADR-004, no scope boundary violations identified.
