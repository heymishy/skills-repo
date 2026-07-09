# Contract Proposal: Separate staging and prod PostHog projects with isolated API keys

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.2-staging-prod-project-separation.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.2-staging-prod-project-separation-test-plan.md

---

## What will be built

- New module `src/web-ui/modules/posthog-config.js` exporting `resolvePostHogApiKey(envName, envVars)`, a pure function that:
  - Returns the staging key when `envName === 'staging'`.
  - Returns the prod key when `envName === 'production'`.
  - Never returns the other environment's key, even when both are present in `envVars`.
  - Throws/returns an error-tagged result identifying the specific missing env var name (e.g. `POSTHOG_KEY_STAGING`) when the current environment's key is absent — never silently falling back to the other environment's key.
- `server.js` startup wiring: calls `resolvePostHogApiKey()` with the running environment and constructs the (S1.1) PostHog adapter's real client using only the resolved key. Logs a startup line naming which project (staging/production) is active, without logging the key value. On a missing-key condition, logs the specific error and does not crash the process.

## What will NOT be built (scope boundary)

- Automatically provisioning a second PostHog project via API — the staging project is created once, manually, in the PostHog dashboard.
- Migrating historical prod event data.
- The live cross-contamination confirmation (real staging Playwright traffic never reaching the real prod project) — per ADR-018/PAT-06, this is a DoR PROCEED-BLOCKED condition deferred until Epic 2 (staging environment) and bri-s3.4 are DoD-complete. Not built or tested here.

## AC → test-approach table

| AC | Description | Test approach |
|----|--------------|----------------|
| AC1 | Staging env uses staging key exclusively | Unit (`resolvePostHogApiKey`) + Integration (server startup wiring, mocked SDK constructor) |
| AC2 | Production env uses prod key exclusively | Unit + Integration (mirrors AC1) |
| AC3 | Unit-level: staging key selected even when both keys present | Unit — the "both present" edge case named explicitly in the AC |
| AC4 | Missing staging key logs a clear startup error, no silent fallback | Unit (2 tests) + Integration (1 test, logger spy + no crash) |

Plus NFR tests: resolved config never exposes both keys simultaneously (Security); startup log records the active project without the key value (Audit).

## Assumptions

- Env var names are `POSTHOG_KEY_STAGING` / `POSTHOG_KEY_PROD` (or equivalent) — exact names to be confirmed against existing repo secret-naming convention (`fly secrets set`) at implementation time; test plan's fixtures use these placeholder names.
- The live cross-contamination check named in the epic is explicitly out of this story's testable scope per ADR-018/PAT-06 — not silently assumed passing.
- `posthog-config.js` sits alongside `posthog-flags.js` (S1.1) under `src/web-ui/modules/`.

## Estimated touch points

- New: `src/web-ui/modules/posthog-config.js`
- New: `tests/check-bri-s1.2-staging-prod-separation.js`
- `server.js` — startup wiring calls `resolvePostHogApiKey()` and constructs the real PostHog client via S1.1's `setPostHogFlagsAdapter()`
- Fly secrets configuration (operational, not code) — staging/prod keys set via `fly secrets set`, out of this PR's diff
