# AC Verification Script: Transparently rehydrate an archived stage's turns on read

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s6-rehydrate-archived-turns.md
**Technical test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s6-rehydrate-archived-turns-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This mostly happens invisibly in the background. You'll need a feature with a stage old enough to have been archived (60+ days) — ask an engineer to help identify or simulate one for testing purposes.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: An old, archived conversation can still be found

**Covers:** AC1

**Steps:**
1. Ask an engineer to confirm "Falls back to the archive table when the hot table has nothing" passes.

**Expected outcome:**
> The test passes. This confirms that even after a conversation has been moved to long-term storage, it can still be found and read back.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Recent conversations aren't slowed down by unnecessary long-term-storage checks

**Covers:** AC2

**Steps:**
1. Ask an engineer to confirm "A hot-table hit never triggers an archive-table query" passes.

**Expected outcome:**
> The test passes. This confirms that for the normal, everyday case (a recent conversation), the system doesn't waste time checking long-term storage it doesn't need to check.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A genuinely missing conversation still behaves the same as before

**Covers:** AC3

**Steps:**
1. Ask an engineer to confirm "Neither table has data → still returns null, unchanged from dsh-s2" passes.

**Expected outcome:**
> The test passes — no change in behaviour for the "truly nothing saved" case.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An archived conversation looks and feels exactly like any other

**Covers:** AC4

**Steps:**
1. Open a feature stage that's old enough to have been moved to long-term storage (ask an engineer to help identify or set one up).
2. Click that stage's breadcrumb step.

**Expected outcome:**
> The page looks exactly the same as any recently-completed stage — conversation on the left, document on the right. There's nothing on the page telling you this one came from long-term storage; it should be invisible to you.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: You still can't see another customer's archived conversation

**Covers:** AC5

**Steps:**
1. Ask an engineer to confirm "Cross-tenant archive read returns null, same guard as hot-table reads" passes.

**Expected outcome:**
> The test passes. This confirms that moving a conversation to long-term storage doesn't accidentally weaken the protection that keeps customers' conversations separate.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case (AC3) | | |
| Edge case (AC5) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
