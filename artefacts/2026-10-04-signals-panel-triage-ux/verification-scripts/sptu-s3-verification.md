# AC Verification Script: Make the signals panel's existing sort order visible and explicit

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
**Technical test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the local dev server and sign in.
2. Go to the Signals page.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The page tells you how it's sorted

**Covers:** AC1

**Steps:**
1. Look near the top of the signals list.

**Expected outcome:**
> You see a short sentence stating the sort order — something like "Sorted by most recent first — signals with no date shown last." It is not left for you to guess.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Signals with no date are clearly marked

**Covers:** AC2

**Steps:**
1. Scroll through the list looking for a signal that has no date shown next to it.

**Expected outcome:**
> Any signal with no date carries a visible label or icon saying something like "no date" — not just a blank space where a date would be, and not indicated by colour alone.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The sort claim doesn't overclaim

**Covers:** AC3

**Steps:**
1. Re-read the sort-order sentence from Scenario 1 carefully.

**Expected outcome:**
> The sentence does not flatly say "sorted by recency" as if that's true for every signal — it clearly says this applies only to signals that have a date, and that undated ones are shown separately/last.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Everything else about the page still works the same

**Covers:** AC4

**Steps:**
1. Compare the list of signals, their order, and the pagination controls to what you'd expect from before this change.

**Expected outcome:**
> Nothing about which signals appear, their order, or the page/filter controls has changed — only the new label and "no date" markers are different.

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
