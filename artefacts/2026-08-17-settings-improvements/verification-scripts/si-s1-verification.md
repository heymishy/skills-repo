# AC Verification Script: Relocate the theme toggle into Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
**Technical test plan:** artefacts/2026-08-17-settings-improvements/test-plans/si-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the app (staging or local) as any user.
2. Go to Settings (click your account menu, then "Settings").

**Reset between scenarios:** No reset needed — each scenario starts from the Settings page.

---

## Scenarios

---

### Scenario 1: The dark/light mode toggle appears inside Settings, not the top bar

**Covers:** AC1, AC3

**Steps:**
1. Look at the top bar (the strip across the very top of the page) on any page.
2. Go to Settings and look at the Profile tab.

**Expected outcome:**
> The dark/light mode toggle button (a small button with a sun/moon icon) is NOT in the top bar. It IS visible in the Settings page's Profile tab, near your other account details.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking the relocated toggle switches the theme immediately

**Covers:** AC2

**Steps:**
1. On the Settings Profile tab, note the current theme (light or dark background).
2. Click the toggle button.

**Expected outcome:**
> The page's colour theme switches immediately (light becomes dark, or dark becomes light) with no page reload or flicker.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The theme choice is remembered after reloading the page

**Covers:** AC2

**Steps:**
1. Click the toggle to switch to a theme different from what it was on page load.
2. Reload the page (F5 or browser refresh).

**Expected outcome:**
> The page loads in the theme you just switched to — it does not revert to the previous theme.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The toggle stays keyboard-accessible

**Covers:** AC1 (Accessibility NFR)

**Steps:**
1. On the Settings Profile tab, click somewhere else on the page first (not the toggle).
2. Press Tab repeatedly until the toggle button is focused (you should see a visible outline around it).
3. Press Enter or Space while it's focused.

**Expected outcome:**
> The toggle receives a visible focus outline when tabbed to, and pressing Enter/Space switches the theme the same as clicking it.

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
