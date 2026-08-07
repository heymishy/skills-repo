# AC Verification Script: Render aggregate health on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s4.md
**Technical test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s4-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a synced product with a mix of feature health statuses (or ask the implementer to set up a test product with at least one red, one amber, and some green features).

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: Health counts are shown with clear labels

**Covers:** AC1

**Steps:**
1. Go to a synced product's page with a mix of feature health statuses.

**Expected outcome:**
> You see a count of features at each status, each with a clear label: "✓ Healthy," "⚠ Warning," "✕ Blocked," or "? Unknown" — not just raw numbers with no explanation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: One blocked feature makes the whole product show as blocked

**Covers:** AC2

**Steps:**
1. Go to a product with at least one feature marked "red"/blocked, even if most other features are healthy.
2. Look at the single overall health signal for the product.

**Expected outcome:**
> The overall signal shows "✕ Blocked" — even though most features are fine, having even one blocked feature is enough to mark the whole product as blocked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: No blocked features but a warning present shows the product as a warning

**Covers:** AC3

**Steps:**
1. Go to a product with no red/blocked features, but at least one amber/warning feature.

**Expected outcome:**
> The overall signal shows "⚠ Warning."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: All-healthy product shows as healthy overall

**Covers:** AC4

**Steps:**
1. Go to a product where every feature is green/healthy.

**Expected outcome:**
> The overall signal shows "✓ Healthy."

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
