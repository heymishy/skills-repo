# AC Verification Script: Structured diagnostic for a malformed canvas diagram marker

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s1-diagram-marker-diagnostic.md
**Technical test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s1-diagram-marker-diagnostic-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Start a `/design` or `/definition` chat session in the web UI.
2. Have a way to deliberately send a broken diagram marker — either by asking the model to intentionally include one, or by using the developer console to inject a malformed `---CANVAS-JSON:---` marker into a test turn.

**Reset between scenarios:** Start a fresh chat turn for each scenario.

---

## Scenarios

### Scenario 1: A broken diagram marker shows a specific reason, not silence

**Covers:** AC1

**Steps:**
1. Trigger a turn where the model's response includes a diagram marker with broken JSON (e.g. a missing closing brace).
2. Watch the chat response and the canvas panel as the turn streams in.

**Expected outcome:**
> Instead of the diagram simply never appearing with no explanation, you see a specific message naming that a diagram marker failed to parse — not a blank space where a diagram should be.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An unrecognized diagram type names itself

**Covers:** AC2

**Steps:**
1. Trigger a turn with a diagram marker whose type is something not on the supported list (e.g. `"chart"` instead of `"table"`).
2. Watch the response.

**Expected outcome:**
> The message specifically names `"chart"` as the type it doesn't recognize, and lists the diagram types that ARE supported — not a generic "something went wrong."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A corrected diagram appears after a fix

**Covers:** AC3

**Steps:**
1. Trigger a broken diagram marker (as in Scenario 1).
2. Prompt the model (or the next turn) to correct it.

**Expected outcome:**
> The corrected diagram appears normally, rendering as if it had been correct from the start.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Two failures in a row stop retrying and say so

**Covers:** AC4

**Steps:**
1. Trigger a broken diagram marker.
2. Trigger a SECOND broken diagram marker for the same diagram (don't fix it).

**Expected outcome:**
> After the second failure, nothing suggests a third attempt is coming — the message reads as final, not "trying again."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Normal diagrams are unaffected

**Covers:** AC5

**Steps:**
1. Trigger a normal, correctly-formed diagram (e.g. during a routine `/design` session).

**Expected outcome:**
> The diagram renders exactly as it always has — no new messages, no change in appearance.

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
