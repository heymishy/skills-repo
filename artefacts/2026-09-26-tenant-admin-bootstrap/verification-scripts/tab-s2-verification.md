# AC Verification Script: Backfill admin for every existing real tenant that has members but no admin

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s2.md
**Technical test plan:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This is a one-time backfill script, not something a regular user triggers — most scenarios below need a developer to run the script directly against a real or staging database and share the results.
2. Have access to query the real `team_memberships` table (or ask a developer to run the reconciliation query for you) on both `wuce-staging` and production.

**Reset between scenarios:** Not applicable — this migration is designed to be idempotent (Scenario 4 specifically checks this), so re-running it safely is part of what's being verified.

---

## Scenarios

---

### Scenario 1: Every real tenant that had no admin now has exactly one

**Covers:** AC1

**Steps:**
1. Before running the migration, ask a developer to count how many real tenants have members but no admin.
2. Have a developer run the migration script.
3. Count again after it finishes.

**Expected outcome:**
> The "before" count is some number greater than zero (or the migration reports "nothing to do" if it turns out to already be zero). The "after" count is exactly zero — every tenant that needed an admin now has exactly one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The person promoted to admin is genuinely the earliest member of that team

**Covers:** AC2

**Steps:**
1. Pick one tenant that the migration backfilled in Scenario 1.
2. Check who is now the admin, and compare against who was added to that team first (earliest date).

**Expected outcome:**
> The person who became admin is the same person who joined that team earliest — not a random or most-recent member.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Tenants that already had an admin, or have no members at all, are left alone

**Covers:** AC3

**Steps:**
1. Pick a tenant that already had a real admin before the migration ran.
2. Confirm nothing changed for that tenant.
3. Confirm no tenant with zero members anywhere gained a new row.

**Expected outcome:**
> The already-admin'd tenant is completely unchanged — same admin, same members, same roles. No empty tenant gained a member out of nowhere.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Running the backfill a second time changes nothing

**Covers:** AC4

**Steps:**
1. Have a developer run the migration script a second time, right after the first run.

**Expected outcome:**
> The second run reports zero changes — every tenant that needed an admin already got one the first time, so there's nothing left to do. Running it again is always safe.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A tie for "earliest member" is resolved consistently, not randomly

**Covers:** AC2 (tie-break rule)

**Steps:**
1. This scenario requires a developer to check the migration's own log output for a tenant where two members joined at exactly the same moment (a rare case) — or run the automated test covering this directly.

**Expected outcome:**
> If a tie ever happens, the same person is chosen every time the rule is applied (not random), and it's clearly logged as a tie so anyone reviewing later can see it happened.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Every adminless tenant gets exactly one admin | | |
| Scenario 2 — Promoted person is genuinely the earliest member | | |
| Scenario 3 — Already-admin'd and empty tenants untouched | | |
| Scenario 4 — Re-running is safe, changes nothing | | |
| Edge case — Ties resolved consistently (developer-checked) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
