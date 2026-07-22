# AC Verification Script: Consolidate product view features section with tabs and filters

**Story reference:** artefacts/2026-07-22-product-view-consolidation/stories/pvc-s1-consolidate-and-tab-features-view.md
**Technical test plan:** artefacts/2026-07-22-product-view-consolidation/test-plans/pvc-s1-test-plan.md
**Script version:** 1
**Verified by:** [pending] | **Date:** [pending] | **Context:** [ ] Pre-code sign-off  [ ] Post-merge smoke test

---

## Scenarios

### Scenario 1: The page shows one features section, not two

**Covers:** AC1

**Steps:**
1. Open a product with modules and both real synced features and any in-flight features.

**Expected outcome:**
> You see ONE set of modules with features under them — not two separate module listings back to back.

**Result:** [ ] Pass  [ ] Fail

---

### Scenario 2: Switching tabs changes the grouping

**Covers:** AC4, AC5, AC6

**Steps:**
1. Click "By Module", "By Phase", and "All" in turn.

**Expected outcome:**
> Each tab shows the same features, organized differently — by module, by phase/epic, or as one flat list. No features disappear or duplicate between tabs.

**Result:** [ ] Pass  [ ] Fail

---

### Scenario 3: Health filter narrows the visible list

**Covers:** AC7

**Steps:**
1. Click a health filter chip (e.g. "Warning").

**Expected outcome:**
> Only features with that health status remain visible, on whichever tab is currently open.

**Result:** [ ] Pass  [ ] Fail

---

### Scenario 4: Search narrows the visible list

**Covers:** AC8

**Steps:**
1. Type part of a feature's name or slug into the search box.

**Expected outcome:**
> Only matching features remain visible.

**Result:** [ ] Pass  [ ] Fail

---

### Scenario 5: A product with no modules is unaffected

**Covers:** AC9

**Steps:**
1. Open a product that has never had any modules created.

**Expected outcome:**
> The page looks exactly as it did before this change — no tabs, no filter bar, same simple feature list.

**Result:** [ ] Pass  [ ] Fail

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — no duplication | Pending | |
| Scenario 2 — tab switching | Pending | |
| Scenario 3 — health filter | Pending | |
| Scenario 4 — search filter | Pending | |
| Scenario 5 — zero-modules unaffected | Pending | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
