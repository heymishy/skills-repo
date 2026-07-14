# AC Verification Script: Create a new GitHub repo directly from product creation

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.1.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.1-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log into wuce with a GitHub account.
2. Have a repo name ready that does NOT already exist on your GitHub account.
3. Also have a repo name ready that DOES already exist (for the collision scenario).

**Reset between scenarios:** Use a fresh product for each scenario.

---

## Scenarios

---

### Scenario 1: Create a brand-new repo

**Covers:** AC1

**Steps:**
1. Start creating a new product in wuce.
2. Choose "create a new repo" and type in a name that doesn't exist yet on your GitHub account.
3. Submit.

**Expected outcome:**
> A new repo appears on your GitHub account with that name. The product page in wuce shows that repo as connected.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Try to create a repo with a name you already have

**Covers:** AC2

**Steps:**
1. Start creating a new product.
2. Choose "create a new repo" and type in a name you already have a repo with.
3. Submit.

**Expected outcome:**
> You see a clear message saying that name is already taken. No existing repo is touched or overwritten.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Try to create a repo without a GitHub account linked

**Covers:** AC3

**Steps:**
1. Log in with Google or email/password.
2. Try to create a new product with "create a new repo."

**Expected outcome:**
> You see the same "link your GitHub account first" message as when connecting an existing repo (Scenario 3 of the connect-existing-repo script).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Confirm the product is fully set up right after creation

**Covers:** AC4

**Steps:**
1. Right after Scenario 1 completes, refresh the product page.

**Expected outcome:**
> The repo is already showing as connected — you don't see a half-finished state where the product exists but no repo is shown yet.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
