# AC Verification Script: Overwrite a reopened stage's artefact in place on revision

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md
**Technical test plan:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s2-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Complete res-s1's flow first — reopen a completed stage's live session (see res-s1's verification script Scenario 1).
2. Note the artefact file this stage produced (its path is shown in the journey/stage view).

**Reset between scenarios:** Reopen the same stage fresh between scenarios.

---

## Scenarios

### Scenario 1: Sending a revision updates the existing write-up, not a new one

**Covers:** AC1

**Steps:**
1. In the reopened stage's chat, type a message asking for a specific, checkable change (e.g. "change the title to include the word ZEBRA").
2. Wait for the response.
3. Open the artefact file for that stage (the same file you noted in Setup).

**Expected outcome:**
> The file now contains "ZEBRA" in the title, and it's the *same file* as before (same location, same filename) — no second file was created anywhere.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A revision is visible to the rest of the journey right away

**Covers:** AC2

**Steps:**
1. After Scenario 1's revision, move to a later stage in the journey (or reopen the same stage again).

**Expected outcome:**
> Anywhere the journey shows or references this stage's write-up, it shows the ZEBRA version — not the old version from before your edit.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Just asking a question doesn't change anything

**Covers:** AC3

**Steps:**
1. Reopen a completed stage.
2. Ask a question that doesn't request any change (e.g. "why did we choose this approach?").
3. Check the artefact file afterward.

**Expected outcome:**
> The file is exactly the same as before you asked the question — nothing was touched just because you opened the session and had a conversation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A save failure tells you, instead of pretending it worked

**Covers:** AC4

**Steps:**
1. This scenario requires a way to force a save failure (e.g. temporarily making the artefact file read-only, or ask engineering to simulate this in a test environment).
2. Send a revision in the reopened session while the save is forced to fail.

**Expected outcome:**
> You see a clear error message in the chat — it does NOT look like the revision succeeded. Checking the artefact file afterward shows it's unchanged (not half-written or corrupted).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: AC5 (pre-revision content handoff) has no scenario of its own

**Covers:** AC5

AC5 is a purely internal handoff between this story and res-s3 — it has no independent, user-observable effect. It's verified indirectly: res-s3's verification script Scenario 1 (the materiality suggestion) only produces a correct "material vs minor" judgment if this handoff worked correctly. If res-s3's Scenario 1 passes, AC5 is working; if the materiality suggestion is ever visibly wrong or missing, come back and check this handoff specifically.

**Result:** [ ] N/A — verified via res-s3 Scenario 1
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| AC5 (via res-s3) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
