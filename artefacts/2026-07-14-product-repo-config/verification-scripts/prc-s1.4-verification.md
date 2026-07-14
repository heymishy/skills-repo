# AC Verification Script: Prove the walking skeleton end-to-end with a real commit

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.4.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.4-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. ⚠️ Confirm which environment this runs against (not yet decided as of this script's writing — see the test plan's Test Data Gap). Do not run this against a customer's real production data.
2. Create a throwaway test product connected to a real, disposable GitHub repo you can safely write to and delete afterward.
3. Prepare a short piece of artefact content to sign off (e.g. a one-paragraph discovery.md).

**Reset between scenarios:** N/A — this is a single end-to-end scenario.

---

## Scenarios

---

### Scenario 1: Sign off through the real web UI and check the real commit

**Covers:** AC1, AC2

**Steps:**
1. In the real web UI (not a test script), open the test product and sign off the prepared artefact content.
2. Open the connected GitHub repo in a browser and find the new commit.
3. Open the commit and view the file's full content.

**Expected outcome:**
> A new commit exists, authored by your real GitHub identity. Opening the file shows exactly the content you signed off — nothing missing, nothing garbled (check especially any special characters or line breaks came through correctly).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Record this as the first real measurement

**Covers:** AC3

**Steps:**
1. Open `artefacts/2026-07-14-product-repo-config/benefit-metric.md`.
2. Find Metric 1's row in the coverage matrix.

**Expected outcome:**
> After Scenario 1 passes, update Metric 1's entry to note the first real measurement happened, with today's date and a link to the commit from Scenario 1.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
