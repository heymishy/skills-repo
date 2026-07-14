# AC Verification Script: Edit a product's name, description, and repo association

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.1.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.1-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have an existing product to edit.
2. Have a second real repo you own, to test changing the connection.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Edit the name and description

**Covers:** AC1

**Steps:**
1. Open the product's edit page.
2. Change the name and description.
3. Save.

**Expected outcome:**
> The product page immediately shows the new name and description.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Change the connected repo

**Covers:** AC2

**Steps:**
1. On a product with a repo already connected, change it to a different repo you own.

**Expected outcome:**
> The product now shows the new repo. If you try changing it to a repo you don't have access to, you get the same error as when connecting for the first time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Add a repo to a product that never had one

**Covers:** AC3

**Steps:**
1. Find (or create) a product with no repo connected.
2. Use the edit page to connect one.

**Expected outcome:**
> This works exactly the same as connecting a repo during product creation — same steps, same confirmation.

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
