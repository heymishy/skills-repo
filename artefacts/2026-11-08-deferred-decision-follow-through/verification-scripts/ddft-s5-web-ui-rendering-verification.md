# AC Verification Script: Web UI rendering alongside incident records

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s5-web-ui-rendering.md
**Technical test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s5-web-ui-rendering-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Confirm `itar-s3` (the incident-rendering story this one extends) has already shipped — if it hasn't, these scenarios cannot be run yet
2. Open the product's consolidated features page for a connected repo whose `workspace/incidents.json` you can edit
3. Have the two real seeded records from `ddft-s1` (`tfhc-s1`, C1-vs-Option-C) available to add to that file

**Reset between scenarios:** Restore `workspace/incidents.json` to its starting content between scenarios if you've been editing it directly.

---

## Scenarios

---

### Scenario 1: A deferred item and an incident both show up, clearly labelled

**Covers:** AC1

**Steps:**
1. Add one incident record and one deferred-item record to the connected repo's incidents file
2. Load the product's consolidated features page

**Expected outcome:**
> Both items appear in the same list. Each one has a visible word telling you which kind it is — "Incident" or "Deferred" — not just a different colour you'd have to guess the meaning of.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The "reason to revisit" text is right there, no extra click

**Covers:** AC2

**Steps:**
1. Look at the deferred-item record on the page
2. Check whether its "reason to revisit" text is already visible, or whether you have to click something to see it

**Expected outcome:**
> The text is already showing — same as how an incident's triage summary already shows without a click.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The two real deferred items render without any error

**Covers:** AC3

**Steps:**
1. Add the two real seeded records (`tfhc-s1` and the C1-vs-Option-C disagreement) to the incidents file
2. Load the consolidated features page

**Expected outcome:**
> Both records show up correctly, with their real text, and nothing on the page errors out or shows a broken state.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A repo with incidents but no deferred items still looks right

**Covers:** AC4

**Steps:**
1. Use a connected repo whose incidents file has incident records only — no deferred items at all
2. Load the consolidated features page

**Expected outcome:**
> The page looks exactly like it did before this feature existed — just the incidents, nothing broken, no empty "Deferred items" placeholder cluttering the view.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
