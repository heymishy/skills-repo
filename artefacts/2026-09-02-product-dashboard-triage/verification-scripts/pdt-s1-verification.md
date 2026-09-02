# AC Verification Script: Consolidate the Epic/Phase List

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s1.md
**Technical test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a product with several epics/phases and at least 20-30 features — `skills-framework` on staging is the real example this was built from.
2. Have the page loaded and ready to scroll from the very top.

**Reset between scenarios:** Reload the product page fresh before each scenario.

---

## Scenarios

---

### Scenario 1: The page opens with one list, not two

**Covers:** AC1

**Steps:**
1. Load the product page and scroll from the very top.

**Expected outcome:**
> You see each epic/phase name appear exactly once as you scroll — not a static text list first, followed later by the same groups again in a different, interactive format.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Groups start closed, showing a count and status at a glance

**Covers:** AC2

**Steps:**
1. Load the product page.
2. Look at any epic/phase group.

**Expected outcome:**
> The group shows its name, how many items it contains, and an overall status indicator — but you do NOT see the individual story rows until you click it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Clicking a group opens it

**Covers:** AC3

**Steps:**
1. Click any closed group's header.

**Expected outcome:**
> The group opens, showing its individual story rows — the same information you'd have seen in the old fully-expanded view.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A brand-new product with no features yet

**Covers:** AC4

**Steps:**
1. Open (or create) a product with zero features.

**Expected outcome:**
> You see a clear message like "No features yet" — not a blank area or a broken-looking section.

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
