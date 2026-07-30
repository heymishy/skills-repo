## Test Plan: Add temporary diagnostic logging to identify why bri-s3.5's paid-plan writes aren't taking effect

**Story reference:** artefacts/2026-07-30-tenant-plan-write-diagnostics/stories/tpwd-s1-tenant-plan-write-diagnostics.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | setPlanState logs write confirmation for e2e- tenants | — | Code review of the diff | 🟢 |
| AC2 | getPlanState logs row count for e2e- tenants | — | Code review of the diff | 🟢 |
| AC3 | getPlanState logs the real error on a genuine read failure | — | Code review of the diff | 🟢 |
| AC4 | Existing fail-open behaviour unchanged | 17 | `tests/check-bri-s3.5-usage-gate.js` (unchanged, still 17/17) | 🟢 |
| AC5 | Next staging-deploy run's logs contain enough evidence to localize the fault | — | Observe the next run; pull `flyctl logs` promptly | 🟡 |

## Coverage gaps

This is diagnostic-only instrumentation for a live-staging-only symptom — it cannot be verified locally against real Postgres load/timeout conditions. Verification is entirely dependent on observing and promptly capturing the next staging-deploy run's logs, consistent with every diagnostic-logging story in this investigation thread (see rlld-s1).

## Test Data Strategy

None new — reuses the existing `e2e-` tenant ID prefix convention already used throughout `bri-s3.5-billing-journey.spec.js`.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Log buffer may rotate before capture | `wuce-staging` auto-suspends quickly when idle; `flyctl logs --no-tail` only returns a small recent buffer | Pull logs immediately after the smoke-test job fails, per this session's established practice; use `gh api .../jobs/<id>/logs` for the CI-side failure detail in parallel |
| Root cause may be DB capacity, not something these two functions can reveal | If the write logs "OK" and the read logs a row was found with the correct plan, but the test-level assertion still fails, the fault is elsewhere (e.g. a caching layer, or the test's own cookie/session wiring) — a genuinely useful negative result, not a dead end | Report exactly what the logs show, even if it rules out this hypothesis entirely |
