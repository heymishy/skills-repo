# AC Verification Script: Resolve annotation write-back to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.3.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.3-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product connected to a real repo (reuse from earlier scenarios).
2. Have an artefact you can annotate.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Annotate an artefact and check where the commit lands

**Covers:** AC1

**Steps:**
1. In the connected product, add an annotation to an artefact.
2. Check the product's connected GitHub repo's commit history.

**Expected outcome:**
> A new commit appears in that product's repo with your annotation content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Try to annotate with no repo connected

**Covers:** AC2

**Steps:**
1. Use a product with no repo connected.
2. Try to add an annotation.

**Expected outcome:**
> You see the same "no repo configured" error message as when trying to sign off without a connected repo.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3 (code-level check, not user-facing — for the developer reviewing this)

**Covers:** AC3

**Steps:**
1. Open the annotation code and the sign-off code side by side.

**Expected outcome:**
> Both call into the exact same shared function to figure out which repo to write to — it's not two separate pieces of code doing the same thing differently.

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
