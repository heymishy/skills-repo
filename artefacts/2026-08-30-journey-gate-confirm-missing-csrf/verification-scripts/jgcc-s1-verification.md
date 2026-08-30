# AC Verification Script: Add the missing CSRF field to the in-chat gate-confirm button

**Story reference:** artefacts/2026-08-30-journey-gate-confirm-missing-csrf/stories/jgcc-s1-add-missing-csrf-field-to-chat-gate-confirm-button.md
**Technical test plan:** artefacts/2026-08-30-journey-gate-confirm-missing-csrf/test-plans/jgcc-s1-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** No special setup — the automated scenarios below are unit tests. Scenario 4 is the real-world post-merge smoke test.

---

## Scenarios

### Scenario 1: The "Continue to next stage" button actually works

**Covers:** AC1, AC2

**Steps:**
1. Complete any skill session that's part of a journey (e.g. `/discovery`), so the "Continue to [next stage] →" button appears.
2. Click it.

**Expected outcome:**
> The journey advances to the next stage — no blank "Forbidden" page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The definition-of-ready "journey complete" link is unaffected

**Covers:** AC3

**Steps:**
1. Complete a journey's final `definition-of-ready` stage.

**Expected outcome:**
> The "View journey complete →" link still works exactly as before — this story doesn't touch it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3 (real prod smoke test): The originally-reported bug no longer reproduces

**Covers:** End-to-end confidence, post-merge

**Steps:**
1. On staging or production, complete a `/discovery` session (or any journey-linked skill) and click "Continue to [next stage] →" immediately, with no idle wait.

**Expected outcome:**
> No blank "Forbidden" page appears, regardless of timing — this was previously unconditional, so a single successful click here is strong confirmation.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This is the direct real-world reproduction that found this bug — unlike `cptr-s1`'s own timing-dependent scenario, this one should reproduce a fix (or a failure) on the very first attempt, with no waiting required.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
