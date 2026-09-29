# AC Verification Script: Signals panel route handler — `/api/signals` endpoint

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have the web UI running locally or on staging, signed in.
2. No special data setup needed — the endpoint reads real signals on request.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: The endpoint returns real signals as JSON

**Covers:** AC1

**Steps:**
1. In a browser (or via `curl`), visit `/api/signals`.

**Expected outcome:**
> You get back a JSON array (starts with `[`, ends with `]`). If this repo has any real signals right now, the array is non-empty.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Every signal in the response has the fields it needs

**Covers:** AC2

**Steps:**
1. From Scenario 1's response, pick any signal entry.
2. Check it has: id, source, type, text, timestamp, and a call-to-action (label + skill).

**Expected outcome:**
> All of those fields are present and filled in on every entry you check.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A broken aggregator returns a clean error, not a half-broken response

**Covers:** AC3

**Steps:**
1. Ask a developer to temporarily make the aggregator throw an error (a quick local test-only change).
2. Visit `/api/signals` again.

**Expected outcome:**
> You get an error response (not a 200), with a clear error message in it — not a browser error page, not a partial/truncated list of signals.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The endpoint responds quickly

**Covers:** AC4

**Steps:**
1. Visit `/api/signals` and note how long it takes to load (browser dev tools Network tab, or just a stopwatch for a rough check).

**Expected outcome:**
> Well under half a second, even the first time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Calling it twice in a row gives the same answer

**Covers:** AC5

**Steps:**
1. Visit `/api/signals`, save the response.
2. Visit it again immediately (no changes made to any workspace files in between).
3. Compare the two responses.

**Expected outcome:**
> Identical — same signals, same order, both times.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Returns JSON signal array | | |
| Scenario 2 — Required fields present | | |
| Scenario 3 — Clean error on failure | | |
| Scenario 4 — Fast response | | |
| Edge case — Repeatable | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
