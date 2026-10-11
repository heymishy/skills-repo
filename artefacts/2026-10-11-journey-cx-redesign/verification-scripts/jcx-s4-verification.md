# AC Verification Script: Persona card on the Customer experience tab, pre-populated from the product's own discovery artefacts

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s4.md
**Technical test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey whose product has at least one feature with a discovery artefact naming a persona.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: Opening the persona editor for the first time offers real suggestions

**Covers:** AC1

**Steps:**
1. Open the Customer experience tab for a journey with no persona set.
2. Click "Set persona."

**Expected outcome:**
> Instead of a blank form, you see one or more suggested personas pulled from this product's own existing features — you can pick one as a starting point instead of typing from scratch.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: No suggestions available falls back gracefully

**Covers:** AC2

**Steps:**
1. Open the persona editor on a journey whose product has no features with a named persona.

**Expected outcome:**
> You see a normal blank form — no error, no broken state.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Saving a persona shows it on the card

**Covers:** AC3

**Steps:**
1. Pick a suggestion (or type your own), fill in name/role/goal, save.

**Expected outcome:**
> The persona card now shows what you entered.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Editing an already-set persona shows what's saved, not the old suggestions

**Covers:** AC4

**Steps:**
1. Reopen the editor on a journey with a persona already saved.

**Expected outcome:**
> You see your saved persona in the fields, ready to edit — not the original suggestion list again.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — real suggestions offered | | |
| Scenario 2 — graceful fallback | | |
| Scenario 3 — saved persona shows on card | | |
| Scenario 4 — editor shows saved state | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
