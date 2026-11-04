# AC Verification Script: /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s3-parallel-review-dispatch.md
**Technical test plan:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s3-test-plan.md
**Script version:** 1
**Verified by:** Hamish King | **Date:** 2026-11-04 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a task ready to go through `/subagent-execution`'s review step.
2. No server needs to be running.

**Reset between scenarios:** None needed — each scenario is a fresh task review.

---

## Scenarios

### Scenario 1: Both reviewers start at the same time, not one after the other

**Covers:** AC1

**Steps:**
1. Watch a task go through review after implementation finishes.

**Expected outcome:**
> Both the spec-compliance reviewer and the code-quality reviewer are dispatched together — you don't see one finish before the other even starts.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clean task — both reviews just go through

**Covers:** AC2

**Steps:**
1. Use a task where both reviews are expected to find nothing wrong.

**Expected outcome:**
> Both reviews finish and the task moves on — nothing gets re-run.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A spec-compliance fix re-checks the code-quality side

**Covers:** AC3 (direction 1)

**Steps:**
1. Use a task where spec-compliance review finds something that needs fixing.
2. Watch what happens to the code-quality review after the fix is applied.

**Expected outcome:**
> The code-quality review that ran before the fix is thrown away, and a new code-quality review runs against the fixed code instead.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A code-quality fix re-checks the spec-compliance side (the symmetric case)

**Covers:** AC3 (direction 2)

**Steps:**
1. Use a task where code-quality review finds something that needs fixing, while spec-compliance already passed.
2. Watch what happens to the spec-compliance review after the fix is applied.

**Expected outcome:**
> The spec-compliance review that ran before the fix is thrown away too, and a new spec-compliance review runs against the fixed code — exactly the same treatment as Scenario 3, just in the other direction.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Only the final review result is ever shown, never the stale one

**Covers:** AC4

**Steps:**
1. After either Scenario 3 or Scenario 4 completes, look at the task's final review record.

**Expected outcome:**
> You only see the review result from after the fix — there's no leftover mention of the earlier, now-outdated review anywhere in the final record.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
