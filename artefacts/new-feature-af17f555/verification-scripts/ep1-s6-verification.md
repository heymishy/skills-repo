# AC Verification Script: Audit Logging and PostHog Instrumentation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s6.md
**Technical test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s6-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have server console/log access for the Web UI (local dev server, or staging logs).
2. Have a test feature you can continue in the Web UI.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Continuing a feature shows up in the server logs

**Covers:** AC1

**Steps:**
1. Click "Continue" on a test feature in the Web UI.
2. Look at the server console/log output around that moment.

**Expected outcome:**
> You see one or more log lines starting with `[cross-channel]`, each with the feature's slug and the stage it's at.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A first-time-in-Web-UI feature logs the backfill too

**Covers:** AC1

**Steps:**
1. Continue a feature that's never been opened in the Web UI before (so ep1-s3's backfill fires).
2. Look at the logs again.

**Expected outcome:**
> Alongside the normal "feature selected" log line, you also see one for the journey backfill happening.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |

---

*Written 2026-09-01 alongside the technical test plan, as part of getting the whole `new-feature-af17f555` feature to DoR-ready level.*
