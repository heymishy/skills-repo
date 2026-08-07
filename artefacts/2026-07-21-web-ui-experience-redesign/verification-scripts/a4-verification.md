# AC Verification Script: Render the product view grouped by module with dual health/coverage indicators and a scale gauge

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a4-module-grouped-rendering-and-scale-gauge.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a4-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Open the skills-framework product (or any product with modules and epics set up per A1/A2).

---

## Scenarios

### Scenario 1 — Epics are grouped by module (AC1)
1. Look at the product page.

**Expected:** Epics appear grouped under their module's heading, not as one flat list. Any epic with no module shows under an "Unassigned" heading.

### Scenario 2 — Health and coverage are shown separately (AC2)
1. Look at any single epic row.

**Expected:** You see two separate things next to the epic's name: a colored health label (e.g. "Healthy", "Blocked") AND a separate coverage percentage/bar. They are not merged into one number.

### Scenario 3 — Scale is visible at a glance (AC3)
1. Look at the top of the page.

**Expected:** You see the total number of epics and stories, plus a visual bar showing how the stories are distributed across modules (bigger modules take up more of the bar).

### Scenario 4 — A brand-new product with no modules still works (AC4)
1. Open a product that has never had any modules created.

**Expected:** The page loads cleanly — no error, no blank screen. You see epics listed some reasonable way (even if not grouped by module yet).

🟡 **Manual scenario — AC5 (motion):**
1. Click on a collapsed module's header to expand it.

**Expected:** The section smoothly grows open over a fraction of a second — it does not instantly snap open with no visible motion. Click it again to collapse — same smooth motion in reverse.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Grouped by module | | |
| 2 — Health/coverage separate | | |
| 3 — Scale visible | | |
| 4 — Zero-module fallback | | |
| 5 — Smooth expand/collapse | | |
