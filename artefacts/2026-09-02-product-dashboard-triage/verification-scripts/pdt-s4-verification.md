# AC Verification Script: Fix the Story-Detail Dead End With a Breadcrumb and Back Link

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s4.md
**Technical test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a product with several features and click into one of them.
2. Also find (or navigate directly by URL to) a nested story identifier, like the `dic.5` case found during this feature's own discovery — this reproduces the original dead-end bug.

**Reset between scenarios:** Navigate back to the product page between scenarios.

---

## Scenarios

---

### Scenario 1: Clicking into a feature shows where you came from

**Covers:** AC1

**Steps:**
1. From a product page, click into any feature.

**Expected outcome:**
> At the top of the feature's page, you see a breadcrumb naming the product it belongs to.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The breadcrumb takes you back

**Covers:** AC2

**Steps:**
1. On a feature's detail page, click the product name in the breadcrumb.

**Expected outcome:**
> You're taken back to that same product's page — not a generic list, not a different product.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A nested story shows its phase or epic too, when known

**Covers:** AC1a

**Steps:**
1. Navigate directly to a nested story identifier (e.g. one shaped like `dic.5` — a story ID within a larger feature's epic, not a feature in its own right).

**Expected outcome:**
> If the system can determine which epic/phase this story belongs to, you see that name in the breadcrumb too. If it genuinely can't be determined, you still see at least a way back — never a page with no context and no way out.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A feature with no artefacts yet

**Covers:** AC3

**Steps:**
1. Click into a feature that hasn't produced any artefacts yet.

**Expected outcome:**
> You see the breadcrumb AND the message "No artefacts found for this feature" together — not one without the other, and never a bare, unexplained blank page.

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
