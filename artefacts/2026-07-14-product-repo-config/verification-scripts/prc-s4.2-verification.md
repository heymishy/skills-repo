# AC Verification Script: Delete (detach) a product

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.2.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.2-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a throwaway test product connected to a real repo, ready to delete.
2. Note the product's URL so you can try to access it after deletion.

**Reset between scenarios:** N/A — deletion is terminal, each scenario needs its own product.

---

## Scenarios

---

### Scenario 1: Delete a product and check the repo survives

**Covers:** AC1

**Steps:**
1. Delete the test product.
2. Go to GitHub and check the repo it was connected to.

**Expected outcome:**
> The product is gone from wuce. The GitHub repo still exists, completely untouched — same files, same history.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Check the confirmation wording before deleting

**Covers:** AC2

**Steps:**
1. Start deleting a product but stop at the confirmation step — read it carefully.

**Expected outcome:**
> The confirmation clearly says the GitHub repo will NOT be deleted — this isn't left ambiguous or unstated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Try to visit a deleted product's page

**Covers:** AC3

**Steps:**
1. After deleting a product, try to open its old URL directly (e.g. from browser history or a bookmark).

**Expected outcome:**
> You see a clear "this product no longer exists" message — not a broken/blank page or an error screen.

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
