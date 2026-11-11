# AC Verification Script: Skip already-applied schema migrations on server boot via a tracking table

**Story reference:** `artefacts/2026-11-11-schema-migration-tracking/stories/smt-s1-schema-migration-tracking-table.md`
**Technical test plan:** `artefacts/2026-11-11-schema-migration-tracking/test-plans/smt-s1-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need access to the server's startup logs — either locally (`npm start` or the project's dev-server command) or on staging, after a deploy.
2. No special data setup is needed — this story doesn't touch any tenant or user data.

**Reset between scenarios:** Restart the server between scenarios where noted, so you can observe a genuinely "cold" first boot vs. a "warm" second boot.

---

## Scenarios

---

### Scenario 1: First boot still creates everything, exactly as today

**Covers:** AC1

**Steps:**
1. Start from a brand-new database (or one where the `schema_migrations` table doesn't exist yet).
2. Start the server.
3. Watch the startup logs.

**Expected outcome:**
> You see the same table-creation log lines you see today (e.g. `[ep1-s1] pods/pod_members schema ready`) for every feature. Nothing is missing. The server boots successfully.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Second boot skips the migration work

**Covers:** AC2

**Steps:**
1. Immediately after Scenario 1 succeeds, stop the server.
2. Start it again, without changing anything else.
3. Watch the startup logs.

**Expected outcome:**
> The server still boots successfully and all features still work, but the startup logs show the migration steps being skipped (not re-running their table-creation statements) rather than doing the same work twice.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Nothing that depends on "catching up" every boot stops working

**Covers:** AC4

**Steps:**
1. With the server already warmed up (Scenario 2 done), create a brand-new test tenant through whatever normal signup/onboarding flow this app uses.
2. Restart the server once more.
3. Check that the new tenant has an organisation record, the same way it would have before this change.

**Expected outcome:**
> The new tenant's organisation record exists, exactly as it would have before this change. Only the one-time table-creation work was skipped on the warm boot — the ongoing "catch any new tenant" work still ran.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A simulated database hiccup doesn't take the whole server down

**Covers:** AC5

**Steps:**
1. In a non-production environment, temporarily point the server at a database it cannot reach (e.g. wrong port or wrong credentials, something that will make a query fail).
2. Start the server.
3. Watch what happens.

**Expected outcome:**
> You see an error logged for the affected migration (the same kind of "migration failed" message you'd see today for any other database problem), but the server process does not crash outright — it keeps running and other, unrelated parts of the app continue to respond.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — cold boot | | |
| Scenario 2 — warm boot skips work | | |
| Scenario 3 — ongoing catch-up still runs | | |
| Edge case — db hiccup doesn't crash boot | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
