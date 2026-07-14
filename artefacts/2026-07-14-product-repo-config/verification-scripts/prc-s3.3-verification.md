# AC Verification Script: Wire standardsList to read from the git-backed cache, with promote/opt-out proven unaffected

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.3.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s3.3-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product connected to a real repo with at least one standard.
2. Have access to a second product where you can promote a standard or set an opt-out, if those features are exposed in the UI (otherwise, coordinate with a developer for this scenario).

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: View the standards list

**Covers:** AC1

**Steps:**
1. Open the standards list for a product that has standards.

**Expected outcome:**
> You see all the standards, with content matching what's actually in the repo (spot-check one against the file on GitHub).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Promote and opt-out still work exactly as before

**Covers:** AC2

**Steps:**
1. Promote a standard (or opt a product out of one), using whatever existing flow does this.

**Expected outcome:**
> This works exactly as it did before this feature shipped — no new errors, no different behaviour.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Create a standard and immediately see it in the list

**Covers:** AC3

**Steps:**
1. Create a new standard.
2. Immediately go to the standards list.

**Expected outcome:**
> The new standard shows up right away, with exactly the content you typed — no delay, nothing missing.

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
