# AC Verification Script: A single, tenant-scoped read path for a completed stage's turns

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s2-shared-durable-read.md
**Technical test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s2-shared-durable-read-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This is background infrastructure with no page of its own (see the story's own "Technical Enabler" note) — it exists to support dsh-s3 and dsh-s4. Confirm it via the automated test output.
2. Ask an engineer to run `node tests/check-dsh-s2-shared-durable-read.js` and share the output.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: Old conversations can still be found even after the server restarts

**Covers:** AC1

**Steps:**
1. Ask an engineer to confirm the test line "Returns Postgres turns when the stage's session is no longer in memory" passes.

**Expected outcome:**
> The test passes. This confirms that once a conversation is saved, it can be found and read back — this is the piece both the "Resume conversation" link and the breadcrumb page will rely on.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The most recent version of a conversation is always shown, never a stale copy

**Covers:** AC2

**Steps:**
1. Ask an engineer to confirm "Prefers in-memory turns over Postgres when both exist" passes.

**Expected outcome:**
> The test passes. This confirms that if a conversation was JUST saved, the freshest copy is always shown, not an older saved version.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Asking for a conversation that was never saved doesn't crash anything

**Covers:** AC3

**Steps:**
1. Ask an engineer to confirm "Returns null (not a throw) when no row exists yet" passes.

**Expected outcome:**
> The test passes. This confirms that if no saved conversation exists (e.g. for a stage completed before this feature shipped), the system handles it gracefully rather than erroring.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: One customer can never see another customer's saved conversation

**Covers:** AC4

**Steps:**
1. Ask an engineer to confirm "Cross-tenant request returns null, never another tenant's turns" passes.

**Expected outcome:**
> The test passes. This confirms a customer can never read another customer's saved conversation, even by guessing an internal ID.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: An invalid or made-up feature reference doesn't crash anything

**Covers:** AC5

**Steps:**
1. Ask an engineer to confirm "Non-existent journeyId returns null without an unhandled exception" passes.

**Expected outcome:**
> The test passes. This confirms the system handles a completely invalid reference gracefully.

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
