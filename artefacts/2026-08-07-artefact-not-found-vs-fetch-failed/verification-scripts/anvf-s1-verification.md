# AC Verification Script: Don't show "could not be retrieved" for an artefact that simply doesn't exist yet

**Story reference:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/stories/anvf-s1-distinguish-not-found-from-fetch-failed.md
**Technical test plan:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/test-plans/anvf-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a repo-connected product in the web UI.
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Start a fresh feature/journey for each scenario.

---

## Scenarios

---

### Scenario 1: A brand-new feature shows the ordinary "not found yet" message

**Covers:** AC1

**Steps:**
1. Start a brand-new feature via a repo-connected product (no stage completed yet).
2. Immediately view or resume that feature's stage page.

**Expected outcome:**
> The artefact panel says "No artefact content found." — a plain, ordinary placeholder. It does not say anything about content "could not be retrieved."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A real fetch problem still shows the honest failure message

**Covers:** AC2

**Steps:**
1. (Requires a way to simulate a real GitHub API failure — e.g. an expired/invalid token, or a repo the app's token can no longer access, for a feature that HAS completed a stage before.)
2. View that feature's stage page.

**Expected outcome:**
> The artefact panel says "Artefact content could not be retrieved from local storage or the connected repository." — this message still exists for real problems; this fix only narrows when it appears.

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
