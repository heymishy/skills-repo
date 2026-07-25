# AC Verification Script: Drift signal — as-designed vs as-built comparison

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s6-drift-signal.md
**Technical test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s6-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a real feature ready with both as-designed diagrams (from csd-s3/s4) and as-built diagrams (from csd-s5).
2. Optionally prepare one deliberately-modified as-built diagram to force a "diverged" result for testing.

**Reset between scenarios:** Use a different feature/fixture pair for each scenario.

---

## Scenarios

---

### Scenario 1: A table added without a matching design shows up clearly

**Covers:** AC1

**Steps:**
1. Take a feature where the as-built Data Model has an extra table not present in the as-designed one.
2. Look at the drift signal for Data Model in canvas.

**Expected outcome:**
> You see "Diverged" for Data Model, with a message naming the specific new table — something like "New table `orders_v2` added, no matching entity in the as-designed diagram."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A genuinely duplicate table gets called out as non-optimal design

**Covers:** AC1

**Steps:**
1. Take a feature where the as-built Data Model adds a new table that duplicates the purpose of an existing one (e.g. a second roles table alongside an existing one).
2. Look at the drift signal.

**Expected outcome:**
> You see "Diverged" with a message specifically flagging that this looks like a duplicate — not just a generic "table added" note.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Renaming a variable inside an unchanged file structure does NOT trigger a false alarm

**Covers:** AC2

**Steps:**
1. Take a feature where the as-built code has the exact same file/call structure as designed, but one internal variable name is different.
2. Look at the drift signal for Program Design.

**Expected outcome:**
> You see "Matches" — a cosmetic rename inside an otherwise-unchanged structure does not falsely flag as drift.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A new service call gets flagged

**Covers:** AC3

**Steps:**
1. Take a feature where the as-built System Architecture has a new service-to-service call not in the design.
2. Look at the drift signal for System Architecture.

**Expected outcome:**
> You see "Diverged", naming the specific new call.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Everything matches — you're told so clearly, not left guessing

**Covers:** AC4

**Steps:**
1. Take a feature where as-built matches as-designed across all three diagram types.
2. Look at the canvas view.

**Expected outcome:**
> You see an explicit "Matches" label for each of the three diagram types — not silence, not an absence of any signal that would leave you wondering whether the check even ran.

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
