# AC Verification Script: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Technical test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s1-test-plan.md
**Script version:** 2 — rewritten after root-cause investigation confirmed the real mechanism
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need two test features: one created by clicking "Start a new feature" from within a product page that has a repository connected (this sets a product link), and one created without going through a product page at all (no product link).
2. You'll need an engineer's help to simulate a repository-resolution failure for Scenarios 2 and 3.
3. This script is best run alongside an engineer for Scenarios 2 and 3 specifically — Scenario 1 is safe to attempt solo.

**Reset between scenarios:** Complete a fresh stage on a fresh test feature for each scenario — do not reuse the same stage across scenarios.

---

## Scenarios

---

### Scenario 1: A commit failure after a successful repository link blocks the stage and shows a clear error

**Covers:** AC1

**Steps:**
1. With an engineer's help, arrange for the artefact commit to fail after the system has successfully found the connected repository (e.g. by revoking write access to the repo just before completing the stage).
2. Attempt to complete a stage for a feature linked to that repository.

**Expected outcome:**
> The stage does NOT complete. You see a clear error message telling you the artefact could not be committed to the connected repository, and instructing you to fix the issue and try again. The stage is NOT marked as done.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A feature created via a product page, whose repository lookup fails, blocks the stage and shows a clear error

**Covers:** AC2-revised

**Steps:**
1. Use the feature you created by clicking "Start a new feature" from within a product page (this feature genuinely IS linked to a product).
2. With an engineer's help, arrange for the system's repository lookup to fail even though the feature is genuinely linked (this reproduces the exact historical bug found during this story's investigation — `new-feature-af17f555`'s own missing artefacts).
3. Attempt to complete a stage for that feature.

**Expected outcome:**
> The stage does NOT complete. You see a clear error message — NOT the silent "stage completed" you would have seen before this fix shipped. The stage is NOT marked as done.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A feature with no product link at all still completes normally, no error

**Covers:** AC3-revised

**Steps:**
1. Use the feature you created WITHOUT going through a product page (no product link exists for it at all).
2. Complete any stage of that feature as you normally would.

**Expected outcome:**
> The stage completes exactly as it always has — no error message, no interruption. You move on to the next stage normally. (Unlike Scenario 2, this feature was never linked to a product in the first place, so there is genuinely nothing to report.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The specific historical bug is now caught by an automated test

**Covers:** AC4

**Steps:**
1. Ask an engineer to point you to the specific automated test (by name) that reproduces the shape of `new-feature-af17f555`'s own incident — a feature linked to a product whose repository lookup fails.
2. Confirm the engineer can show you that this test failed before the fix and passes after.

**Expected outcome:**
> An engineer can name a specific test file and test name that demonstrates the exact historical bug is now caught.

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
