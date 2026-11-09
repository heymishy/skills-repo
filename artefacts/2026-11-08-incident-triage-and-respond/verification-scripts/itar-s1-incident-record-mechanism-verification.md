# AC Verification Script: Incident record mechanism

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s1-incident-record-mechanism.md
**Technical test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s1-incident-record-mechanism-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Make a copy of `workspace/incidents.json` if it already exists (or note that it doesn't exist yet) — scenarios should run against a test copy, not the real file.
2. Have the incident-creation function (or its CLI/script entry point, once implemented) available to run.

**Reset between scenarios:** Delete or restore your test copy of `incidents.json` back to its starting state between Scenario 1 and Scenario 2.

---

## Scenarios

---

### Scenario 1: Creating a new incident record captures the right basic fields

**Covers:** AC1

**Steps:**
1. Run the incident-creation function with a trigger of "login attempt" and tags "auth".
2. Look at the record that comes back.

**Expected outcome:**
> The record has an ID (some unique string), the trigger text "login attempt" exactly as typed, the tag "auth", an empty list of prior-incident links, and a status of "open".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Creating a second record adds to the file without losing the first one

**Covers:** AC2

**Steps:**
1. Starting from a test file with one existing incident record already in it, run the incident-creation function to add a second record.
2. Open the file and look at its contents.

**Expected outcome:**
> The file now contains both records — the original one, unchanged, and the new one just added. Nothing was overwritten or deleted.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Tags are cleaned up automatically when a record is saved

**Covers:** AC3

**Steps:**
1. Run the incident-creation function with tags typed as " Auth " (with extra spaces) and "SQL-Error" (mixed case).
2. Look at the tags on the saved record.

**Expected outcome:**
> The saved tags are "auth" and "sql-error" — no extra spaces, no capital letters.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A real past incident can be migrated into a structured record

**Covers:** AC4

**Steps:**
1. Using the real `tenant_admin_bootstrap_failed` login error described in `workspace/capture-log.md` (2026-10-07 entry) as the trigger text, run the incident-creation function.
2. Look at the resulting record.

**Expected outcome:**
> A real, structured incident record is created for this known past issue — not a made-up example — with status "open" and tags describing the auth/SQL-type error, ready to be matched against by future incidents.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A tag/summary field that's too long is rejected, not silently cut off

**Covers:** AC1 (bounded-length constraint)

**Steps:**
1. Try to create a new incident record with a tags field that is unreasonably long — far beyond a short keyword list (e.g. several sentences of text pasted into the tags field).
2. See what happens.

**Expected outcome:**
> The system clearly refuses to save the record and tells you the tags field is too long — it does not quietly cut the text short and save a partial version anyway.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
