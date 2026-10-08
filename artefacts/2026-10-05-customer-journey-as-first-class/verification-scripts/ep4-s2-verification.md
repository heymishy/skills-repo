# AC Verification Script: Navigation and entry points: "Journeys" nav link and product page link

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s2.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in to the app. Make sure you have at least one product with a journey associated with it, and at least one product with no journey associated.

**Reset between scenarios:** No reset needed — all scenarios are read-only navigation checks.

---

## Scenarios

### Scenario 1: The "Journeys" link is always visible in the main navigation

**Covers:** AC1

**Steps:**
1. Go to any page in the app (the dashboard, a product page, Settings — doesn't matter which).
2. Look at the sidebar navigation.

**Expected outcome:**
> A "Journeys" link is visible in the sidebar on every page. Clicking it takes you to the journey list page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A product with a journey shows a "View journey" link

**Covers:** AC2

**Steps:**
1. Go to the detail page of a product that has at least one journey associated with it.

**Expected outcome:**
> A "View journey" link is visible near the top of the page, alongside the other links (Kanban, Roadmap, Standards). Clicking it takes you to that journey's own canvas page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A product with no journey shows no link at all

**Covers:** AC3

**Steps:**
1. Go to the detail page of a product that has no journey associated with it.

**Expected outcome:**
> There is no "View journey" link, no greyed-out placeholder, and nothing broken-looking in its place — the other links (Kanban, Roadmap, Standards) are unaffected.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The "Journeys" link works with the keyboard alone

**Covers:** AC4

**Steps:**
1. Click anywhere on the page to focus it, then press Tab repeatedly until you reach the "Journeys" link in the sidebar (you should see a visible focus outline on it).
2. Press Enter.

**Expected outcome:**
> The "Journeys" link gets a visible keyboard focus outline as you Tab to it, and pressing Enter navigates to the journey list page — no mouse needed at any point.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 ("Journeys" link always visible) | | |
| Scenario 2 ("View journey" link on a product with a journey) | | |
| Scenario 3 (no link on a product with no journey) | | |
| Scenario 4 (keyboard-only navigation) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
