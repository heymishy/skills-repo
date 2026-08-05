# AC Verification Script: Bootstrap an existing repo from a DoR-approved SaaS artefact

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s4-saas-connected-bootstrap.md
**Technical test plan:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s4-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a DoR-approved feature already in the hosted web-UI SaaS (run discovery through DoR for any small feature if you don't have one).
2. Have an empty local folder ready to bootstrap into.
3. Know your SaaS login credential — you'll be prompted for it, not asked to type it as part of the command.

**Reset between scenarios:** Delete and recreate the empty target folder between scenarios.

---

## Scenarios

---

### Scenario 1: Bootstrapping from a real DoR-approved feature

**Covers:** AC1, AC2

**Steps:**
1. In your empty target folder, run: `npx @heymishy/skills-repo@latest init . --from-saas <your-feature-slug>`
2. When prompted, enter your SaaS credential (it should not appear as you type, and should not need to be typed as part of the command itself).

**Expected outcome:**
> The command fetches your feature's approved artefact and shows it being written into `artefacts/[your-feature-slug]/...`. Your `.github/pipeline-state.json` now includes an entry for that feature at the DoR-approved stage. You can immediately run `/branch-setup` against it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Trying to bootstrap a feature you don't have access to

**Covers:** AC3

**Steps:**
1. Run the same command as Scenario 1, but with a feature slug that belongs to a different account/tenant than your credential.

**Expected outcome:**
> The command fails with a clear message saying your credential doesn't have access to that feature — it does not fall back to giving you an empty fresh-repo bootstrap instead, and does not pretend to succeed with placeholder content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The export matches what you see in the SaaS itself

**Covers:** AC4

**Steps:**
1. Open your feature's DoR-approved artefact in the hosted web-UI SaaS and note its content.
2. Compare it against the artefact content that was bootstrapped into your local folder in Scenario 1.

**Expected outcome:**
> The two are identical — nothing is missing, stale, or different between what the SaaS shows you and what was bootstrapped locally.

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
