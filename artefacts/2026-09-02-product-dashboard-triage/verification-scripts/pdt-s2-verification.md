# AC Verification Script: Add a Triage Summary Strip for Blocked/Warning Counts

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s2.md
**Technical test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a product with at least one Blocked or Warning item — `skills-framework` on staging has both.
2. Also find (or create) a product with zero Blocked and zero Warning items, for the second scenario.

**Reset between scenarios:** Reload each product page fresh.

---

## Scenarios

---

### Scenario 1: A strip at the top shows what needs attention

**Covers:** AC1

**Steps:**
1. Load a product page that has at least one Blocked or Warning item.

**Expected outcome:**
> A strip near the top of the page shows the Blocked and Warning counts — you don't need to scroll to see whether anything needs attention.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking a count takes you straight to those items

**Covers:** AC2

**Steps:**
1. Click the Blocked count in the strip.

**Expected outcome:**
> You're taken to (or the page filters to) exactly the Blocked items — the same result you'd get from clicking the existing "Blocked" filter chip further down the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A healthy product shows a clear "nothing blocked" message

**Covers:** AC3

**Steps:**
1. Load a product page with zero Blocked and zero Warning items.

**Expected outcome:**
> The strip shows a clear, positive message (e.g. "Nothing blocked") — not an empty space, and not just a bare "0".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
