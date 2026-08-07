# AC Verification Script: Wire Scenario A as a CI-blocking gate

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a5-ci-gate-scenario-a-blocking.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a5-ci-gate-scenario-a-blocking-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have permission to open a throwaway test PR against this repo.
2. Have access to the repo's GitHub Actions checks and branch protection settings page.

**Reset between scenarios:** Close/delete the throwaway PR after each scenario.

---

## Scenarios

---

### Scenario 1: A broken change is blocked from merging

**Covers:** AC1

**Steps:**
1. Open a throwaway branch, deliberately break something Scenario A covers (e.g. rename the product-creation button so the spec can't find it).
2. Open a PR.
3. Wait for CI to finish running.
4. Look at the PR's merge button.

**Expected outcome:**
> The Scenario A check shows as failed (red X), and the PR's merge button is disabled or shows "Merging is blocked" — you cannot merge without fixing it or bypassing branch protection.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A clean change is not blocked

**Covers:** AC2

**Steps:**
1. Open a throwaway branch with no changes affecting Scenario A's covered path (e.g. a comment-only change).
2. Open a PR.
3. Wait for CI to finish.

**Expected outcome:**
> The Scenario A check shows as passed (green check), and the PR is mergeable.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The existing 29 specs still don't block anything

**Covers:** AC3

**Steps:**
1. Look at the same PR's CI checks from Scenario 1 or 2.
2. Find the check for the existing (pre-existing) E2E suite.

**Expected outcome:**
> Even if that check fails or is flaky, it does not disable the merge button by itself — only the new Scenario A check does that.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The gate can be turned off via config, not just code

**Covers:** AC4

**Steps:**
1. Open `.github/context.yml`.
2. Find the flag that controls the new Scenario A gate.

**Expected outcome:**
> The flag is a clearly named setting in this file (not something you'd have to edit the workflow YAML file to change).

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
