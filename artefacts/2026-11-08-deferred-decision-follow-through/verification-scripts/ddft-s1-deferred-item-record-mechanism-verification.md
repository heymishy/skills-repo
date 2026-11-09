# AC Verification Script: Deferred-item record mechanism (generalized schema)

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s1-deferred-item-record-mechanism.md
**Technical test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s1-deferred-item-record-mechanism-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a copy of `workspace/incidents.json` in a text editor (use a copy, not the real file, if you want to try edits)
2. Confirm it already has at least one record from the incident-tracking feature (type field may be missing on older entries)

**Reset between scenarios:** Not needed — each scenario only reads or adds records, nothing is deleted.

---

## Scenarios

---

### Scenario 1: Existing incident records keep working after the update

**Covers:** AC1

**Steps:**
1. Look at an incident record that was created before this change
2. Check whether it still shows its original fields (trigger, summary, tags, status)

**Expected outcome:**
> The old record still has all its original information. It now also shows `type: "incident"` even though nobody had to add that by hand.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The `tfhc-s1` test-failure gap gets registered as a real record

**Covers:** AC2

**Steps:**
1. Look up the record created for `tfhc-s1` (the ongoing test-count mismatch issue)
2. Check its type and its "reason to revisit" text

**Expected outcome:**
> The record is marked `type: "deferred-item"`. The "reason to revisit" text describes the real issue — that the pull request merged but one of its five tests isn't passing yet. It's not a placeholder like "TBD".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The C1-vs-Option-C disagreement gets registered as a real record

**Covers:** AC3

**Steps:**
1. Look up the record created for the "C1 vs Option C" disagreement about whether forking the platform is allowed
2. Check its "reason to revisit" text

**Expected outcome:**
> The record is marked `type: "deferred-item"`. The "reason to revisit" text says it's deferred to a broader product-rules refresh later — matching what was already written down when this was first noticed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Both real records can be found and are typed correctly

**Covers:** AC4

**Steps:**
1. Run the record check (or look at the file directly)
2. Confirm both the `tfhc-s1` record and the C1-vs-Option-C record are present
3. Confirm neither one is accidentally marked as an "incident" instead of a "deferred item"

**Expected outcome:**
> Both records show up, and both say `type: "deferred-item"`, not `type: "incident"`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A deferred-item record without an incident's extra fields

**Covers:** AC1 (type-conditional required fields)

**Steps:**
1. Try to create a deferred-item record that's missing its "reason to revisit" text
2. See what happens

**Expected outcome:**
> The system refuses to create it and says what's missing — it doesn't silently accept an incomplete deferred-item record.

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
