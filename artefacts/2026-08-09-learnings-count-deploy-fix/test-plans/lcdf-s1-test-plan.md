## Test Plan: Compute the learnings count at build/deploy time instead of reading a file absent from the deployed image

**Story reference:** artefacts/2026-08-09-learnings-count-deploy-fix/stories/lcdf-s1-build-time-learnings-count.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Build-time script computes and writes the real count | 1 test | — | — | — | — | 🟢 |
| AC2 | Deployed app displays the build-time value | 1 test | — | — | — | — | 🟢 |
| AC3 | Local/CI (workspace/ present) still correct, unregressed | 1 test | — | — | — | — | 🟢 |
| AC4 | Fail-open safety net still holds if both sources are missing | 1 test | — | — | — | — | 🟢 |
| AC5 | Real deployed page shows the real count | — | — | — | 1 manual post-deploy check | External-dependency | 🟡 |

---

## Coverage gaps

**AC5 (🟡):** Requires a real deploy to verify — cannot be closed by an automated test running in CI against a fresh, non-deployed checkout. Consistent with this repo's established pattern for real-external-dependency ACs (`workspace/learnings.md`'s own cross-surface-state-sync precedent, 2026-08-07): automated tests cover the mockable mechanics (AC1-AC4), a manual step covers the real-world confirmation.

---

## Test Data Strategy

**Source:** The real `workspace/learnings.md` file (for AC1/AC3) plus synthetic fixtures for AC2/AC4 (simulating a deployed environment where `workspace/` is absent but the baked count file is present, or where neither is present).
**PCI/sensitivity in scope:** No
**Availability:** Available now (AC1-4); AC5 requires a real deploy
**Owner:** Self-contained

---

## Unit Tests

### writeLearningsCountFile_computesRealCountFromWorkspaceLearnings

- **Verifies:** AC1
- **Action:** Run the new build-time script against the real `workspace/learnings.md`
- **Expected result:** Writes a JSON file containing the same count `getLearningsCount()` already computes locally today (cross-checked against the existing counting logic, not duplicated independently)

### getLearningsCount_deployedEnvironment_usesBakedFileWhenWorkspaceAbsent

- **Verifies:** AC2
- **Precondition:** Simulate a deployed environment: `workspace/learnings.md` absent, baked `learnings-count.json` present with a known value
- **Action:** Call `getLearningsCount()`
- **Expected result:** Returns the baked file's value, not `0`

### getLearningsCount_localEnvironment_stillReadsRealFileDirectly

- **Verifies:** AC3
- **Precondition:** `workspace/learnings.md` present (the real local/CI condition)
- **Action:** Call `getLearningsCount()`
- **Expected result:** Returns the same real, directly-computed count as before this change — the baked file (if present) is not preferred over a genuinely available live file, or is consistent with it either way (exact precedence documented in implementation)

### getLearningsCount_bothSourcesAbsent_failsOpenToZero

- **Verifies:** AC4
- **Precondition:** Neither `workspace/learnings.md` nor the baked file present
- **Action:** Call `getLearningsCount()`
- **Expected result:** Returns `0` without throwing — `lccf-s1`'s safety net re-verified, not assumed

## Manual Verification

### Real deploy confirms the real count

- **Verifies:** AC5
- **Action:** After this story merges and deploys, check `https://wuce-staging.fly.dev/` directly
- **Expected result:** The "learnings captured" hero card shows a real, non-zero count matching `workspace/learnings.md`'s actual current entry count at deploy time
