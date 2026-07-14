# AC Verification Script: Connect an existing GitHub repo to a product

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.2.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.2-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log into wuce with a GitHub account.
2. Have a real GitHub repo you own (or a throwaway test repo) ready to connect.
3. Create (or navigate to) a product in wuce.

**Reset between scenarios:** Between scenarios, use a fresh product (or clear the repo association) so each scenario starts from "no repo connected."

---

## Scenarios

---

### Scenario 1: Connect a repo you own

**Covers:** AC1

**Steps:**
1. On the product page, find the option to connect an existing GitHub repo.
2. Type in the owner and name of a real repo you own.
3. Click "Connect."

**Expected outcome:**
> You see a confirmation message that the repo is connected. If you refresh the product page, it still shows that repo as connected.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Try to connect a repo you don't have access to

**Covers:** AC2

**Steps:**
1. On the product page, try to connect a repo owner/name combination you know you don't have access to (e.g. someone else's private repo).
2. Click "Connect."

**Expected outcome:**
> You see a clear error message saying the repo couldn't be connected (access denied or not found). The product's repo connection is not changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Try to connect a repo when logged in without GitHub

**Covers:** AC3

**Steps:**
1. Log in with a Google or email/password account (not GitHub).
2. Try to connect a repo on a product.

**Expected outcome:**
> Instead of a repo-connect form, you see a message telling you to link your GitHub account first, with a link or button to do that.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Change which repo is connected

**Covers:** AC4

**Steps:**
1. On a product that already has a repo connected, connect a *different* repo.

**Expected outcome:**
> The product now shows the new repo as connected, not the old one. There's no error about "already connected."

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
