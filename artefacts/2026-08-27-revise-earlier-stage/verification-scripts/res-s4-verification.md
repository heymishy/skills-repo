# AC Verification Script: Act on a materiality suggestion without auto-triggering downstream changes

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s4-operator-acts-on-materiality-suggestion.md
**Technical test plan:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s4-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Complete res-s3's Scenario 2 (a material revision, so you have a materiality suggestion to act on).

**Reset between scenarios:** Start a fresh journey with a new material revision for each scenario, or use a journey with multiple downstream stages available.

---

## Scenarios

### Scenario 1: Choosing "flag downstream stages" marks them, without changing them

**Covers:** AC1

**Steps:**
1. When shown the materiality suggestion, respond choosing to flag downstream stages.
2. Look at the step-nav for the stages after the one you revised.
3. Open one of those downstream stages' artefact files.

**Expected outcome:**
> The downstream stages now show a visible marker (like "May need review" — text or an icon, not just a colour change) in the step-nav. Their write-ups (artefact files) are completely unchanged — nothing was regenerated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Choosing "leave as-is" changes nothing visible

**Covers:** AC2

**Steps:**
1. When shown a materiality suggestion, respond choosing to leave downstream stages as-is.
2. Look at the step-nav for downstream stages.

**Expected outcome:**
> No markers appear anywhere. Nothing downstream changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Your choice is recorded against the suggestion

**Covers:** AC3

**Steps:**
1. After Scenario 1 or 2, ask your engineer/reviewer to check the activity log.

**Expected outcome:**
> The log shows both the model's original suggestion AND your choice, linked together — this is what lets the team measure how often people agree with the suggestion over time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Reopening a flagged stage clears its flag

**Covers:** AC4

**Steps:**
1. After Scenario 1 (a stage is flagged), click that flagged stage's step-nav link to reopen it.
2. Go back to the journey's step-nav view.

**Expected outcome:**
> The marker is gone from that stage now that you've reopened and looked at it — it doesn't stay flagged forever with no way to clear it.

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
