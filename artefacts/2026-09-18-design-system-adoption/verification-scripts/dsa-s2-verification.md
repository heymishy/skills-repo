# AC Verification Script: Restyle the Dashboard to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in with a real account that has at least one product.
2. Know how to switch between dark and light mode (Settings page).

**Reset between scenarios:** No reset needed — switch modes via Settings between Scenario 1 and 2.

---

## Scenarios

---

### Scenario 1: Dashboard looks right in dark mode

**Covers:** AC1

**Steps:**
1. Make sure dark mode is active.
2. Go to the dashboard.
3. Look at the sidebar, main content area, and any status badges.

**Expected outcome:**
> Deep near-black background, bright readable text, subtle dark borders, clear blue accent color on buttons/active nav items. Looks crisp and consistent, not the current dated style.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Dashboard looks right in light mode

**Covers:** AC2

**Steps:**
1. Switch to light mode in Settings.
2. Go to the dashboard.
3. Look at the same elements as Scenario 1.

**Expected outcome:**
> Off-white background, dark readable text, light grey borders, deeper blue accent color for contrast. Just as polished as dark mode, nothing half-styled.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Dashboard layout matches the design

**Covers:** AC3

**Steps:**
1. Go to the dashboard (either mode).
2. Look at the overall page structure.

**Expected outcome:**
> A fixed-width sidebar on the left with your products list, main navigation, and account settings pinned to the bottom. The main content area fills the rest of the screen, capped at a reasonable reading width — this should look like the "Dashboard" reference screenshot.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Nothing that worked before is now broken

**Covers:** AC4

**Steps:**
1. Click through to one of your products from the dashboard.
2. Use the main navigation to visit another section.
3. Check the account nav at the bottom of the sidebar works.

**Expected outcome:**
> Clicking a product takes you to that product's page. Navigation links all go to the right place. Account nav opens the right menu. Everything behaves exactly as it did before — only the visual styling changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (Dark mode) | | |
| Scenario 2 (Light mode) | | |
| Scenario 3 (Layout) | | |
| Scenario 4 (No regression) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
