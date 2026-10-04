# AC Verification Script: Add `/signals` to the main navigation

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
**Technical test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the local dev server (`npm start`, or however this repo's dev server is normally started) and sign in.
2. Have the sidebar visible on any page.

**Reset between scenarios:** None needed — this is a read-only navigation check.

---

## Scenarios

### Scenario 1: A "Signals" link appears in the sidebar

**Covers:** AC1

**Steps:**
1. Look at the left sidebar on any page (e.g. the Org board page).

**Expected outcome:**
> A row labelled "Signals" appears in the sidebar's main navigation list, alongside "Org board" and "Pod Manager".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking "Signals" goes to the signals page and highlights itself

**Covers:** AC2

**Steps:**
1. Click the "Signals" row in the sidebar.

**Expected outcome:**
> The page navigates to the signals/improvement-signals page, and the "Signals" row in the sidebar is now visually highlighted (same highlighted style as whichever row is normally highlighted for the current page — a different background and bold text).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Every other sidebar link still works

**Covers:** AC3

**Steps:**
1. Click "Org board."
2. Click "Pod Manager."
3. Click "Settings."

**Expected outcome:**
> Each click goes to the correct page, same as before this change. Nothing is missing or broken.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Reaching "Signals" without a mouse

**Covers:** AC4

**Steps:**
1. Click once somewhere near the top of the page, then press the Tab key repeatedly (not Shift+Tab) until you reach the sidebar links.

**Expected outcome:**
> At some point while pressing Tab, the "Signals" link receives a visible focus outline, the same way "Org board" and the other sidebar links do when you Tab to them. You never get stuck or skip past it.

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
