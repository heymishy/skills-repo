# AC Verification Script: Dismiss / mark-reviewed for the signals panel

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
**Technical test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s4-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the local dev server and sign in.
2. Go to the Signals page.

**Reset between scenarios:** Use "show dismissed" and click "Undismiss" on anything you dismissed during testing, so each scenario starts clean.

---

## Scenarios

### Scenario 1: Dismissing a signal hides it

**Covers:** AC1

**Steps:**
1. Pick any signal on the page and click its "Dismiss" button.

**Expected outcome:**
> That signal disappears from the list immediately (or after the page refreshes). It is not shown anywhere in the normal view.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A dismissed signal stays dismissed after you leave and come back

**Covers:** AC2

**Steps:**
1. Dismiss a signal (as in Scenario 1).
2. Close the browser tab (or just reload the page a few times).
3. Come back to the Signals page.

**Expected outcome:**
> The signal you dismissed is still gone. It did not come back just because you reloaded or reopened the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: You can bring a dismissed signal back

**Covers:** AC3

**Steps:**
1. With a signal dismissed, turn on "show dismissed."
2. Find that signal (it should look visually marked as dismissed) and click "Undismiss."
3. Turn "show dismissed" back off.

**Expected outcome:**
> With "show dismissed" on, you can see the dismissed signal, clearly marked. After clicking "Undismiss," it reappears normally in the regular (non-dismissed) view.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Dismissing one signal never dismisses a different one by mistake

**Covers:** AC4

**Steps:**
1. Pick two different signals that look similar (e.g. same type).
2. Dismiss only the first one.

**Expected outcome:**
> Only the first signal disappears. The second, similar-looking signal is still there.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Using Dismiss/Undismiss without a mouse

**Covers:** AC6

**Steps:**
1. Click once near the top of the page, then press Tab repeatedly until you reach a signal's Dismiss button.
2. Press Enter (or Space) to activate it.

**Expected outcome:**
> The Dismiss button gets a visible focus outline as you Tab to it, and pressing Enter/Space dismisses that signal — same as clicking it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: First-time use works with no setup

**Covers:** AC7

**Steps:**
1. On a fresh install (or after deleting the dismissed-signals data file, if you have access to do so), load the Signals page.

**Expected outcome:**
> The page loads normally, with nothing marked as dismissed. No error page, no crash.

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
| Edge case (first use) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
