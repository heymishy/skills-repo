# AC Verification Script: Render discovery scope and feature/epic taxonomy grouping

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s7.md
**Technical test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s7-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a synced product whose connected repo has features organised into epics as well as some standalone features (skills-framework's own product is a real example of this).
2. If possible, also have access to a second product whose repo has no epics at all (all flat features).

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: Features are grouped by epic, with ungrouped features shown separately

**Covers:** AC1

**Steps:**
1. Go to a synced product with a mix of epic-grouped and standalone features.

**Expected outcome:**
> Features that belong to an epic appear nested/grouped under that epic's name. Features that don't belong to any epic appear in their own separate section — nothing is missing and nothing appears twice.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can see what each feature is about, not just its name

**Covers:** AC2

**Steps:**
1. Look at a feature in the taxonomy view that has a discovery document.

**Expected outcome:**
> You see a short summary of what that feature is about, or a link you can click to read its discovery document — not just a bare technical name.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A product with no epics shows a clean flat list

**Covers:** AC3

**Steps:**
1. Go to a product whose features are all standalone (no epics).

**Expected outcome:**
> You see a simple flat list of features. There's no confusing empty "Epics" heading with nothing underneath it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The total feature count adds up correctly

**Covers:** AC4

**Steps:**
1. Count the total number of features shown across all epic groups plus the ungrouped section.
2. Ask the implementer to confirm the actual total number of features for this product (from the sync/cache).

**Expected outcome:**
> Your count matches the actual total — no feature is missing, and none is counted twice across the grouped and ungrouped sections.

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
