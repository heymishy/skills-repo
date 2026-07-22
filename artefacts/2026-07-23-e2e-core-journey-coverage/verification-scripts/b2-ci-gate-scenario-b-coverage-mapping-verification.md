# AC Verification Script: Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b2-ci-gate-scenario-b-coverage-mapping-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have permission to open a throwaway test PR against this repo.
2. Have the discovery.md and the new coverage-mapping document open side by side.

**Reset between scenarios:** Close/delete the throwaway PR after each scenario.

---

## Scenarios

---

### Scenario 1: A broken Scenario B change is blocked from merging

**Covers:** AC1

**Steps:**
1. Open a throwaway branch, deliberately break something Scenario B covers (e.g. break the story-map canvas rendering).
2. Open a PR and wait for CI.

**Expected outcome:**
> The Scenario B check fails, and the PR's merge button is disabled.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A clean change passes both gates

**Covers:** AC2

**Steps:**
1. Open a throwaway branch with an unrelated change (e.g. a comment).
2. Open a PR and wait for CI.

**Expected outcome:**
> Both the Scenario A and Scenario B checks pass, and the PR is mergeable.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The coverage mapping covers every journey step

**Covers:** AC3

**Steps:**
1. Open discovery.md's MVP Scope section and list each numbered step of Scenario A (7 steps) and Scenario B (4 steps).
2. Open the coverage-mapping document.
3. Check off each step as you find it listed with a spec file and AC reference.

**Expected outcome:**
> Every single step from discovery.md appears in the mapping document — none are missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The mapping's claims are actually true

**Covers:** AC4

**Steps:**
1. Pick 3 random rows from the mapping document.
2. Open the spec file each row names.
3. Find the AC reference each row names inside that file.

**Expected outcome:**
> For all 3 rows checked, the named AC genuinely exists in the named spec file — the mapping isn't just asserted from memory.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
