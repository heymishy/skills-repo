# AC Verification Script: Person and team-membership schema replaces tenant-wide role lookup

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s1.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s1-person-team-schema-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have a local copy of the app running against a clean (or disposable) database.
2. Have access to a database client or the app's own logs to inspect table contents.

**Reset between scenarios:** Restart the server fresh between scenarios if you need to re-observe startup behaviour.

---

## Scenarios

---

### Scenario 1: The app creates the new team schema on startup, and restarting doesn't break it

**Covers:** AC1

**Steps:**
1. Start the app against a database with no `people` or `team_memberships` tables.
2. Check the database — confirm both tables now exist.
3. Stop the app and start it again.

**Expected outcome:**
> The app starts cleanly both times, with no error message about the tables already existing. Both tables are present after step 3, unchanged.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: An existing single-person account keeps its exact same role after the schema change

**Covers:** AC2

**Steps:**
1. Before this change ships, note the role (e.g. "admin") shown for an existing solo account.
2. After this change ships and the app has started once, check that same account's role again (via login or an admin view).

**Expected outcome:**
> The role is exactly the same as it was before — "admin" stays "admin". Nothing changes for this person.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 3: Logging in resolves your role correctly using the new system

**Covers:** AC3

**Steps:**
1. Log in via any of the three sign-in options (GitHub, Google, or email/password).
2. Confirm you land on the dashboard with the correct access level for your role (e.g. an admin sees admin-only controls).

**Expected outcome:**
> Login works exactly as it did before this change — your role and access are correct, with no visible difference in behaviour.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 4: Nothing else broke

**Covers:** AC4

**Steps:**
1. Run the full automated test suite (`npm test`).
2. Compare the failing-test list to the known baseline list.

**Expected outcome:**
> No new failing tests beyond the already-known, pre-existing ones — this change did not break anything that was working before.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: A person who hasn't logged in since the update still works fine

**Covers:** AC5

**Steps:**
1. Find (or simulate) an existing solo account that has not logged in since this change went live.
2. Log in as that account.

**Expected outcome:**
> Login succeeds normally, with the same role as before. No error, no unexpected reset to a different role.

**Result:** [ ] Pass [ ] Fail
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
