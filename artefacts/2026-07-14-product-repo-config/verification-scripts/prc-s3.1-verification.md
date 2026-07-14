# AC Verification Script: Write standards to the product's repo as the source of truth

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.1.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s3.1-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product connected to a real repo.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Create a new standard

**Covers:** AC1

**Steps:**
1. Create a new standard on the product (give it a name and some content).
2. Check the connected GitHub repo.

**Expected outcome:**
> A file appears in a `standards/` folder in the repo, matching what you typed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Edit that standard

**Covers:** AC2

**Steps:**
1. Edit the standard from Scenario 1 — change some of the content.
2. Check the repo again.

**Expected outcome:**
> The same file is updated with your new content — there isn't a second file created for the edit.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Try to create a standard with no repo connected

**Covers:** AC3

**Steps:**
1. Use a product with no repo connected.
2. Try to create a standard.

**Expected outcome:**
> You see the same "no repo configured" error as elsewhere in the product.

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
