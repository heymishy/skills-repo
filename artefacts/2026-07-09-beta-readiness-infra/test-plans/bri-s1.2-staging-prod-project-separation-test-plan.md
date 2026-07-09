## Test Plan: Separate staging and prod PostHog projects with isolated API keys

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.2-staging-prod-project-separation.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Staging environment uses the staging API key exclusively for every PostHog call | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Production environment uses the production API key exclusively, never staging | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Unit-level: PostHog client constructed with staging key when both keys present in config | 1 test | — | — | — | — | 🟢 |
| AC4 | Missing/misconfigured staging key logs a clear startup error, no silent fallback to prod key | 2 tests | 1 test | — | — | — | 🟢 |

**Note on ADR-018/PAT-06:** the epic's live end-to-end confirmation ("staging Playwright activity never reaches the prod PostHog project") is explicitly named in this story's Architecture Constraints as a DoR PROCEED-BLOCKED condition until Epic 2 (staging environment) and bri-s3.4 are DoD-complete. That live check is intentionally **not** in this test plan's scope — it is tracked as a deferred follow-up, not silently assumed passing. This plan covers only the unit-level AC3, which the story itself states is "fully verifiable now."

---

## Coverage gaps

None at the AC level for this story. The deferred live cross-contamination check is not an AC gap — it is a story-level PROCEED-BLOCKED condition already logged in the story's Architecture Constraints and tracked as a post-Epic-2 follow-up, per ADR-018/PAT-06.

---

## Test Data Strategy

**Source:** Mocked (PostHog Node SDK client constructor mocked; environment variables set directly in test process)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `NODE_ENV=staging` (or equivalent env var), fake `POSTHOG_KEY_STAGING` value (e.g. `phc_test_staging_key`) | Synthetic | None | Value is a placeholder string, never a real key |
| AC2 | `NODE_ENV=production`, fake `POSTHOG_KEY_PROD` value | Synthetic | None | |
| AC3 | Both fake staging and prod key env vars present simultaneously | Synthetic | None | Deliberately tests the "both present" edge case named in the AC |
| AC4 | Staging env selected, staging key env var unset/empty | Synthetic | None | |

### PCI / sensitivity constraints

None — no real API keys are used anywhere in this test plan.

### Gaps

None.

---

## Unit Tests

### resolvePostHogApiKey returns the staging key when the environment is staging

- **Verifies:** AC1
- **Precondition:** A config-resolution function (e.g. `resolvePostHogApiKey(envName, envVars)` in a new `src/web-ui/modules/posthog-config.js` module) exists, given an env name and an object of available env vars.
- **Action:** Call `resolvePostHogApiKey('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' })`.
- **Expected result:** Returns `'phc_test_staging'` exactly — never the prod value.
- **Edge case:** No.

### resolvePostHogApiKey returns the prod key when the environment is production

- **Verifies:** AC2
- **Precondition:** Same resolution function as above.
- **Action:** Call `resolvePostHogApiKey('production', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' })`.
- **Expected result:** Returns `'phc_test_prod'` exactly — never the staging value.
- **Edge case:** No.

### resolvePostHogApiKey never returns the prod key when both keys are present and environment is staging

- **Verifies:** AC3
- **Precondition:** Both `POSTHOG_KEY_STAGING` and `POSTHOG_KEY_PROD` are set to distinct fake values in the same config object.
- **Action:** Call `resolvePostHogApiKey('staging', envVarsWithBothKeys)`.
- **Expected result:** Returns the staging value; the returned value strictly does not equal the prod value, even though both were present in the input.
- **Edge case:** Yes — this is the exact "even when both keys are present" scenario named in AC3.

### resolvePostHogApiKey throws/errors with a specific identifying message when the staging key is missing

- **Verifies:** AC4
- **Precondition:** Environment is staging; `POSTHOG_KEY_STAGING` is `undefined` or an empty string; `POSTHOG_KEY_PROD` is set.
- **Action:** Call `resolvePostHogApiKey('staging', { POSTHOG_KEY_PROD: 'phc_test_prod' })`.
- **Expected result:** Throws (or returns an error-tagged result, depending on chosen implementation shape) identifying specifically `POSTHOG_KEY_STAGING` as the missing variable — the message names which key is missing, not a generic "config error." It must not return `phc_test_prod` as a fallback.
- **Edge case:** Yes.

### resolvePostHogApiKey does not silently fall back to the prod key under any missing-staging-key condition

- **Verifies:** AC4
- **Precondition:** Same as above (staging key missing).
- **Action:** Inspect the return value (or thrown error) from `resolvePostHogApiKey('staging', { POSTHOG_KEY_PROD: 'phc_test_prod' })`.
- **Expected result:** The returned/thrown result is never equal to the prod key value under any code path — explicitly asserted as a second, independent check from the "clear error" assertion above, since a regression could produce a correctly-worded error message on one path while a different code path still silently falls back.
- **Edge case:** Yes.

---

## Integration Tests

### Server startup wires the PostHog client with the staging key when NODE_ENV=staging

- **Verifies:** AC1
- **Components involved:** `server.js` startup wiring, `src/web-ui/modules/posthog-config.js`, mocked `posthog-node` SDK constructor.
- **Precondition:** `NODE_ENV=staging`, fake staging/prod keys set as env vars, PostHog SDK client constructor replaced with a spy that records constructor arguments.
- **Action:** Run the server's PostHog wiring startup step (in isolation, not a full server boot) with the staging environment active.
- **Expected result:** The mocked PostHog client constructor is called with the staging key exactly once, and is never called with the prod key.

### Server startup wires the PostHog client with the prod key when NODE_ENV=production

- **Verifies:** AC2
- **Components involved:** Same as above, with `NODE_ENV=production`.
- **Precondition:** Same as above, environment flipped to production.
- **Action:** Run the same startup wiring step with the production environment active.
- **Expected result:** The mocked PostHog client constructor is called with the prod key exactly once, and is never called with the staging key.

### Missing staging key produces a startup log line naming the missing key, and the app does not crash

- **Verifies:** AC4
- **Components involved:** `server.js` startup wiring, a spied `console.error` (or the app's logger), `posthog-config.js`.
- **Precondition:** `NODE_ENV=staging`, `POSTHOG_KEY_STAGING` unset, `POSTHOG_KEY_PROD` set.
- **Action:** Run the startup wiring step and capture logger output.
- **Expected result:** A log line is emitted identifying `POSTHOG_KEY_STAGING` (or equivalent name) as missing; the process does not throw an unhandled exception that would crash the whole server; the PostHog client is not constructed with the prod key as a fallback.

---

## NFR Tests

### Startup config never holds both staging and prod keys as active/usable at once

- **NFR addressed:** Security
- **Measurement method:** Inspect the resolved config object/return value from `resolvePostHogApiKey()` for a given environment; assert it contains exactly one active key field (the one matching the current environment), not both.
- **Pass threshold:** Resolved config for a given environment exposes only that environment's key — the other environment's key value is never present in the object returned to the caller, even if both were present in the raw input env vars.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-bri-s1.2-staging-prod-separation.js`.

### Startup log records which PostHog project is active without logging the key value

- **NFR addressed:** Audit
- **Measurement method:** Spy on the logger call made during startup wiring; assert the log message contains a project label (`staging` or `production`) but does not contain the raw key string value anywhere in the logged output.
- **Pass threshold:** Zero occurrences of the actual key string in any captured log line, for both the success path and the AC4 missing-key error path.
- **Tool:** Hand-rolled Node.js assertion.

### Performance

- **NFR addressed:** Performance — **None identified beyond S1.1's existing 200ms budget**, per story text. No separate test written; covered by `bri-s1.1`'s NFR test.

### Accessibility

- **NFR addressed:** Accessibility — **Not applicable**, per story text. No test written.

---

## Out of Scope for This Test Plan

- Automatically provisioning the second PostHog project via API — explicitly out of scope in the story; the staging project is assumed to already exist, created manually in the PostHog dashboard.
- Migrating historical prod event data — not applicable per the story's Out of Scope.
- The live cross-contamination confirmation (real staging Playwright traffic never reaching the real prod PostHog project) — deferred per ADR-018/PAT-06 until Epic 2 and bri-s3.4 are DoD-complete; not testable pre-implementation without a real staging environment.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Live staging→prod cross-contamination confirmation (originally AC3 per the epic's framing, now the deferred ADR-018/PAT-06 condition) | Requires a real staging environment (Epic 2) and a real Playwright suite generating traffic (bri-s3.4) — neither exists yet | Tracked explicitly as a follow-up check at Epic 3 completion in the story's Architecture Constraints; add a corresponding `pendingActions` entry in `workspace/state.json` once Epic 2 reaches DoD |
