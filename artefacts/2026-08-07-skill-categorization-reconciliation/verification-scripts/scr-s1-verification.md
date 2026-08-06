# AC Verification Script: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap

**Story reference:** artefacts/2026-08-07-skill-categorization-reconciliation/stories/scr-s1-unify-skill-categorization-and-fix-nfr.md
**Technical test plan:** artefacts/2026-08-07-skill-categorization-reconciliation/test-plans/scr-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to run the CI governance checks and the CLI's `--with-outer-loop` install flow locally.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: One list, not two

**Covers:** AC1, AC2

**Steps:**
1. Ask your engineering contact to add a new skill to the single categorization source and re-run the CI governance check — without touching the check script itself.

**Expected outcome:**
> The check picks up the new skill correctly with zero code changes to the check itself — proving there's only one place this classification lives now.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Faster install with the outer loop enabled

**Covers:** AC3, AC4

**Steps:**
1. Time `skills-repo init <dir> --with-outer-loop` on the same kind of machine/setup used before.

**Expected outcome:**
> The extra time this flag adds is under 3 seconds — or, if it still isn't, you're told the honest measured number rather than a stale or hidden one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
