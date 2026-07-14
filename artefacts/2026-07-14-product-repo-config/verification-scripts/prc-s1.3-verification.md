# AC Verification Script: Resolve sign-off write-back to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.3.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.3-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have two products set up, each connected to a different real GitHub repo (following prc-s1.2's connect flow).
2. Have an artefact ready to sign off in each product (e.g. a discovery.md).

**Reset between scenarios:** No reset needed if you have both products ready from setup.

---

## Scenarios

---

### Scenario 1: Sign off an artefact and check where the commit lands

**Covers:** AC1

**Steps:**
1. In Product A, sign off an artefact.
2. Open Product A's connected GitHub repo and look at its commit history.

**Expected outcome:**
> A new commit appears in Product A's repo, with a message starting "sign-off:" and showing your name as the author.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Confirm sign-offs in different products don't cross over

**Covers:** AC2

**Steps:**
1. Sign off an artefact in Product A.
2. Sign off a different artefact in Product B.
3. Check both repos' commit histories.

**Expected outcome:**
> Product A's commit only appears in Product A's repo. Product B's commit only appears in Product B's repo. Neither repo has the other's commit.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Try to sign off with no repo connected

**Covers:** AC3

**Steps:**
1. Use a product that has no GitHub repo connected.
2. Try to sign off an artefact.

**Expected outcome:**
> You see a clear error saying the product has no repo configured. No commit appears anywhere.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Check who the commit is attributed to

**Covers:** AC4

**Steps:**
1. After Scenario 1's sign-off, look at the commit's author on GitHub.

**Expected outcome:**
> The commit author is you (your real GitHub name/email) — not a bot account or service account.

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
