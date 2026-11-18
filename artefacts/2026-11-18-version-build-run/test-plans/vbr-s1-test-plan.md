## Test Plan: The build stamp records the workflow run that built the image, so an operator can find the run from the running app

**Story reference:** artefacts/2026-11-18-version-build-run/stories/vbr-s1-version-build-run.md
**Epic reference:** None - short-track
**Test plan author:** Claude Haiku 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-vbr-s1-version-build-run.js`, plain Node, setting and restoring environment variables in-process.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | buildRunId from GITHUB_RUN_ID | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | buildRunAttempt from GITHUB_RUN_ATTEMPT | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Both null when unset | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Existing fields unchanged | 1 (T4) | - | - | - | - | 🟢 |

## Red-first plan

The new assertions read `buildRunId` and `buildRunAttempt`, which the script does not yet produce. Before the change, T1 and T2 fail with `undefined` against the expected run ID, and T3 fails because the keys are absent. That is the recorded red state.
