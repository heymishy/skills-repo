# AC Verification Script: Connect a repo by picking from your own accessible repos

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md
**Technical test plan:** artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a GitHub account with multiple repos accessible (for the picker) signed in via OAuth.
2. Have a test product ready to connect.

**Reset between scenarios:** Use a fresh product per scenario.

---

## Scenarios

---

### Scenario 1: Connecting a repo by picking from a list

**Covers:** AC1, AC2

**Steps:**
1. Open the repo-connection flow for your test product.
2. Pick one of your own repos from the list shown.
3. Confirm.

**Expected outcome:**
> You see a list of your own repos to choose from — not a blank URL field. After confirming, the product shows as connected to the repo you picked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Falling back to the URL field if the picker can't load

**Covers:** AC3

**Steps:**
1. Simulate a GitHub API failure (rate-limit or missing scope) — ask your engineering contact how to trigger this in a test environment if you can't do it yourself.
2. Open the repo-connection flow.

**Expected outcome:**
> Instead of a broken or empty picker, you see the familiar URL-entry field, with a short message explaining the picker isn't available right now.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Finding a repo in a long list

**Covers:** AC4

**Steps:**
1. Open the repo-connection flow for an account with many repos.
2. Type part of a repo's name into the search box.

**Expected outcome:**
> The list narrows to just repos matching what you typed — you don't have to scroll through everything.

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
