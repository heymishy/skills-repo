# AC Verification Script: Persist a stage's session turns to Postgres on completion

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md
**Technical test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s1-persist-session-turns-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story has no visible page of its own — it's a background save that happens automatically whenever a pipeline stage finishes. You'll confirm it worked by checking the automated test output, not by clicking anything.
2. Ask an engineer to run `node tests/check-dsh-s1-persist-session-turns.js` and share the output with you.

**Reset between scenarios:** No reset needed — each automated test run is independent.

---

## Scenarios

### Scenario 1: Finishing a stage saves its conversation permanently

**Covers:** AC1

**Steps:**
1. Have an engineer run the automated test file and look for the line mentioning "inserts a row... with journey_id, tenant_id, skill_name, and full turns array".

**Expected outcome:**
> The test passes. This confirms that whenever someone finishes a pipeline stage (like Discovery or Definition), the full back-and-forth conversation that produced it is saved permanently — not just the final written document.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Finishing the same stage twice doesn't create duplicate records

**Covers:** AC2

**Steps:**
1. Have an engineer run the test and look for "Re-completing the same stage upserts, does not duplicate".

**Expected outcome:**
> The test passes. This confirms that if the same stage somehow gets marked "finished" twice, we end up with one clean saved conversation, not two conflicting copies.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A database hiccup doesn't break the rest of the save

**Covers:** AC3

**Steps:**
1. Have an engineer run the test and look for "A failed Postgres write does not block the rest of the completion flow".

**Expected outcome:**
> The test passes. This confirms that if saving the conversation to the database has a temporary problem, the rest of the process (saving the actual document, finishing the stage) still completes normally — the operator is never blocked by this.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The save feature can't be silently switched off by mistake

**Covers:** AC4

**Steps:**
1. Have an engineer run the test and look for "Unwired adapter throws instead of silently no-op'ing".

**Expected outcome:**
> The test passes, and it specifically confirms an error is raised (not silently ignored) if this saving feature is ever accidentally left disconnected during future development — so a missing connection is caught immediately, not months later when someone can't find an old conversation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Two different customers' conversations never get mixed up

**Covers:** AC5

**Steps:**
1. Have an engineer run `node tests/check-dsh-s1-persist-session-turns.js --integration` (or the equivalent integration test command) against a real test database, and look for "Real Postgres wiring: two tenants' turns are stored and read back without cross-contamination".

**Expected outcome:**
> The test passes. This confirms that when saving conversations from two different customers/tenants, each customer's saved conversation only ever contains their own content — never another customer's.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case (AC4) | | |
| Edge case (AC5) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
