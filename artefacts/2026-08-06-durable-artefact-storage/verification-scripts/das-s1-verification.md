# AC Verification Script: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
**Technical test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a test product with a connected GitHub repo, and one with no repo connected.
2. Be ready to complete at least one stage of a journey for each.

**Reset between scenarios:** Use a fresh journey per scenario where possible.

---

## Scenarios

---

### Scenario 1: A completed stage survives a redeploy

**Covers:** AC1, AC3

**Steps:**
1. Complete a stage for a journey on the repo-connected product.
2. Simulate a redeploy — ask your engineering contact to restart the app or clear its local disk in a test environment.
3. Click "Resume conversation" for that stage.

**Expected outcome:**
> You see the real artefact content, not "No artefact content found" — even though the app was restarted since you completed it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A failed save never lies about being done

**Covers:** AC2

**Steps:**
1. Ask your engineering contact to simulate a GitHub API failure (revoked token or rate limit) in a test environment.
2. Try to complete a stage on the repo-connected product.

**Expected outcome:**
> The stage does NOT show as complete, and you see a clear error — never a stage that looks finished but has nothing durable behind it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Existing repo-less products keep working exactly as before

**Covers:** AC4

**Steps:**
1. Complete a stage on the product with no connected repo.

**Expected outcome:**
> It completes normally, exactly as it always has — no new errors, no unexpected prompts to connect a repo.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: An honest message when nothing can be retrieved

**Covers:** AC5

**Steps:**
1. Ask your engineering contact to simulate both the local file being missing AND the GitHub fetch failing (e.g. revoke repo access) for a completed stage.
2. Click "Resume conversation" for that stage.

**Expected outcome:**
> You see a clear message saying the content couldn't be retrieved — not a blank or broken-looking page.

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
