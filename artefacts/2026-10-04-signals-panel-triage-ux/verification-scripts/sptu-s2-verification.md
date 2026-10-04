# AC Verification Script: Type/source filter for the signals panel

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
**Technical test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the local dev server and sign in.
2. Go to the Signals page.

**Reset between scenarios:** Click "clear filters" (or reload `/signals` with no parameters) between scenarios.

---

## Scenarios

### Scenario 1: Hiding "parse-error" removes it everywhere, not just the visible page

**Covers:** AC1

**Steps:**
1. Note the total signal count shown at the bottom of the page.
2. Click the control to hide `parse-error` signals.

**Expected outcome:**
> The total count shown drops by however many `parse-error` signals existed. No `parse-error` signal (the ones with the orange left border) appears anywhere, including on page 2 or later if you page through.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Hiding a source works the same way, and combines with a type filter

**Covers:** AC2

**Steps:**
1. With `parse-error` still hidden from Scenario 1, also hide the `capture-log` source.

**Expected outcome:**
> The total count drops further. No signal from the `capture-log` source appears, and no `parse-error` signal reappears either — both filters apply at once.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The active filter is visible, and reloading the page keeps it

**Covers:** AC3

**Steps:**
1. With a filter applied, reload the page (press F5 or your browser's reload button).

**Expected outcome:**
> The page clearly states which filter(s) are active (e.g. text saying "Hiding: parse-error"). After reloading, the same filter is still applied — the count does not jump back up.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Filtering everything away shows a clear, distinct message

**Covers:** AC4

**Steps:**
1. Apply filters until no signals remain visible (hide every type or source present).

**Expected outcome:**
> The page shows a message saying something like "No signals match the current filters" — not blank, not an error, and clearly different from the normal "No signals yet" message you'd see with zero real signals at all. A visible link or button lets you clear the filters.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Using the filter controls without a mouse

**Covers:** AC5

**Steps:**
1. Click once near the top of the page, then press Tab repeatedly to reach the filter controls.
2. Press Enter on one of them.

**Expected outcome:**
> Each filter control gets a visible focus outline as you Tab to it, and pressing Enter activates it (applies or removes that filter) — same as any other link on the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Nothing changes when no filter is applied

**Covers:** AC6

**Steps:**
1. Load the Signals page fresh, with no filters applied.

**Expected outcome:**
> The page looks and behaves exactly as it did before this change — same signals, same pagination, same empty-state behaviour if there are none.

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
| Edge case (keyboard) | | |
| Edge case (no filter) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
