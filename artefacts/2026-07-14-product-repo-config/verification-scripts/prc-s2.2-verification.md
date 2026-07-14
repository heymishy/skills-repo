# AC Verification Script: Bootstrap a newly created repo with the skills framework

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.2.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.2-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a way to create a brand-new, empty GitHub repo (via the create-new-repo flow from the previous story).
2. Have a copy of this skills-repo's `.github/skills/`, `.github/templates/`, and `scripts/` folders open for comparison.

**Reset between scenarios:** Use a fresh empty repo for each run.

---

## Scenarios

---

### Scenario 1: A new repo gets a real first commit with the framework files

**Covers:** AC1

**Steps:**
1. Create a new product with a brand-new repo.
2. Wait for the bootstrap step to finish.
3. Open the new repo on GitHub and look at its first commit.

**Expected outcome:**
> There's a commit containing folders that look like `.github/skills/`, `.github/templates/`, and `scripts/`. The commit is authored by you, not a bot.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Confirm the bootstrap actually happened via the API, not a slow local process

**Covers:** AC2

**Steps:**
1. Time how long Scenario 1's bootstrap step takes.

**Expected outcome:**
> Bootstrap completes in well under a minute — consistent with an API-based approach rather than a full local git clone/push cycle.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Compare the new repo's file structure to a known-good reference

**Covers:** AC3

**Steps:**
1. Compare the folder structure from Scenario 1 side-by-side against this skills-repo's own `.github/skills/`, `.github/templates/`, `scripts/` folders.

**Expected outcome:**
> The folder and file names match — same structure, same files present.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4 (only if a fallback path exists): Confirm the fallback still uses your identity

**Covers:** AC4

**Steps:**
1. If you know a way to force a bootstrap failure (e.g. temporarily revoke API access), do so, then create a new product.
2. Check the resulting commit's author.

**Expected outcome:**
> Even if the fallback path runs, the resulting commit is still authored by you, never a bot or service account.

**Result:** [ ] Pass  [ ] Fail  [ ] N/A (no fallback implemented)
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
