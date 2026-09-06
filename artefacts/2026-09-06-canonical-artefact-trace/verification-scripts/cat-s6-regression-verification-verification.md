# AC Verification Script: The two existing non-trace consumers of artefact fetching keep working unchanged

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s6-regression-verification.md
**Technical test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s6-regression-verification-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load `.env` and start the local server (see the PowerShell/bash snippet in `cat-s5`'s verification script — same setup).
2. Have access to a feature that uses the "gate-confirm" step in a journey, and a tenant account that can trigger a SaaS export.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: Confirming a journey gate still shows the right document

**Covers:** AC1

**Steps:**
1. Walk through a journey to the "gate-confirm" step for a feature with correct registration.
2. Look at the document content shown at that step.

**Expected outcome:**
> The exact same document content is shown as before this epic's changes — nothing looks different at this step.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Exporting data for one tenant still uses that tenant's own repository

**Covers:** AC2

**Steps:**
1. Trigger a SaaS export for a specific tenant.
2. Check the exported content actually came from that tenant's own repository, not a different one.

**Expected outcome:**
> The export uses exactly the tenant's own repository, correctly, exactly as before. There is no sign of one tenant's export pulling from another tenant's data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Older features' own tests still pass without changes

**Covers:** AC3

**Steps:**
1. Ask engineering to run the existing test suites for the four prior related features (`bsgm-s1`, `sri-s1`, `adlr-s1`, `fadm-s1`).

**Expected outcome:**
> All four suites pass exactly as they did before, with no test needing to be rewritten.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The overall test suite has no new failures

**Covers:** AC4

**Steps:**
1. Ask engineering to run the full repo test suite (`node scripts/run-all-tests.js`).
2. Compare the list of failures against the two already-known, pre-existing ones (a draft-status check and a timing-sensitive check, both unrelated to this feature).

**Expected outcome:**
> The only failures present are those same two already-known ones. No new failure appears anywhere else in the suite.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — journey gate-confirm unchanged | | |
| Scenario 2 — tenant export isolation preserved | | |
| Scenario 3 — four prior suites pass unchanged | | |
| Scenario 4 — no new suite-wide failures | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
