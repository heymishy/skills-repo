# AC Verification Script: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Technical test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need a feature that is linked to a real, repo-connected product in this system (e.g. `skills-framework`, connected to `heymishy/skills-repo`).
2. You'll need a way to simulate a commit failure — either by temporarily revoking the GitHub token's write access to the connected repo, or by asking an engineer to run the automated test suite for this story instead of performing this manually (the throw/no-throw distinction in Scenarios 2 and 3 is hard to trigger by hand without deliberately breaking something).
3. This script is best run alongside an engineer for Scenarios 2 and 3 specifically — Scenario 1 and 4 are safe to attempt solo.

**Reset between scenarios:** Complete a fresh stage on a fresh test feature for each scenario — do not reuse the same stage across scenarios.

---

## Scenarios

---

### Scenario 1: A stage that genuinely has no repository connection still completes normally

**Covers:** AC3

**Steps:**
1. Start or resume a feature whose product has NO repository connected.
2. Complete any stage of that feature as you normally would (answer the questions, reach the point where the stage finishes).

**Expected outcome:**
> The stage completes exactly as it always has — no error message, no interruption. You move on to the next stage normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A commit failure after a successful repository link blocks the stage and shows a clear error

**Covers:** AC1

**Steps:**
1. With an engineer's help, arrange for the artefact commit to fail after the system has successfully found the connected repository (e.g. by revoking write access to the repo just before completing the stage).
2. Attempt to complete a stage for a feature linked to that repository.

**Expected outcome:**
> The stage does NOT complete. You see a clear error message telling you the artefact could not be committed to the connected repository, and instructing you to fix the issue (re-authenticate, check repo access, or wait for a rate limit to clear) and try again. The stage is NOT marked as done.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A failure to find the repository connection (despite one existing) blocks the stage and shows a clear error

**Covers:** AC2, AC2a

**Steps:**
1. With an engineer's help, arrange for the system's lookup of the repository connection to fail or come back empty, even though the feature genuinely has a repository connected (this simulates the specific bug found during this story's own investigation).
2. Attempt to complete a stage for that feature.

**Expected outcome:**
> The stage does NOT complete. You see a clear error message — NOT the silent "stage completed" you would have seen before this fix shipped. The stage is NOT marked as done.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The specific historical bug is now caught by an automated test

**Covers:** AC4

**Steps:**
1. Ask an engineer to confirm which of Scenarios 2 or 3 corresponds to the actual root cause found during implementation.
2. Ask them to point you to the specific automated test (by name) that would have failed on the old code and now passes on the fixed code.

**Expected outcome:**
> An engineer can name a specific test file and test name that demonstrates the exact historical bug is now caught. This is not something you need to verify yourself — just confirm the engineer can point to it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
