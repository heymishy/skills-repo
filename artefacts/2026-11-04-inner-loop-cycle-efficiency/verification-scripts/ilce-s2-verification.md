# AC Verification Script: /branch-complete skips the redundant full-suite rerun when a fresh result exists

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s2-branch-complete-freshness-guard.md
**Technical test plan:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s2-test-plan.md
**Script version:** 1
**Verified by:** Hamish King | **Date:** 2026-11-04 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a story that has just run `/verify-completion` successfully, with no commits made since.
2. No server needs to be running.

**Reset between scenarios:** Make a small commit between Scenario 1 and Scenario 2 to flip the "fresh" condition off.

---

## Scenarios

### Scenario 1: Branch-complete skips the repeat test run when nothing changed

**Covers:** AC1

**Steps:**
1. Run `/verify-completion` for a story and let the full test suite finish.
2. Immediately run `/branch-complete` for the same story, without making any further commits.

**Expected outcome:**
> `/branch-complete` does not run the full test suite again — it says it is reusing the already-fresh result from `/verify-completion` instead of waiting through another full run.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Branch-complete reruns the tests if anything changed since

**Covers:** AC2

**Steps:**
1. Make a small commit after `/verify-completion` finished.
2. Run `/branch-complete` for the same story.

**Expected outcome:**
> `/branch-complete` runs the full test suite again — it does not skip, because something changed since the last run.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A partial test run doesn't count as "fresh"

**Covers:** AC3

**Steps:**
1. Run only a single test file directly (not the full suite) for a story.
2. Run `/branch-complete` for that story right after, with no commits in between.

**Expected outcome:**
> `/branch-complete` still runs the full test suite — running just one file earlier doesn't count as proof that everything passes, so it reruns the whole thing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

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
