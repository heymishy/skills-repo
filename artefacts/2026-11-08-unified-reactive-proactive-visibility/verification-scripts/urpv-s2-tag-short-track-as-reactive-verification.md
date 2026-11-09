# AC Verification Script: Tag short-track features as reactive work in the consolidated features view

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s2-tag-short-track-as-reactive.md
**Technical test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s2-tag-short-track-as-reactive-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a connected product with at least one short-track (bug/small-fix) feature and at least one standard-track feature in its synced `pipeline-state.json`.
2. Open that product's consolidated features view.

**Reset between scenarios:** None needed — all scenarios read the same already-loaded page.

---

## Scenarios

---

### Scenario 1: A short-track item shows a "Reactive" label

**Covers:** AC1, AC3

**Steps:**
1. Open the product's consolidated features view, "By Module" tab.
2. Find a card for a known short-track feature.

**Expected outcome:**
> The card shows the text "Reactive" somewhere on it — not just a coloured dot or border, actual visible text reading "Reactive".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The same label appears correctly in the other tab view

**Covers:** AC3

**Steps:**
1. Switch to the "By Phase" tab.
2. Find the same short-track feature's card.

**Expected outcome:**
> The card still shows the "Reactive" text label — switching tabs does not lose or hide it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A standard-track item never shows "Reactive"

**Covers:** AC2, AC4

**Steps:**
1. On either tab, find a card for a known standard-track feature.

**Expected outcome:**
> The card shows "Planned" (or shows no track label at all, depending on the final design) — it never shows the word "Reactive".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A product with no reactive work at all shows an honest zero

**Covers:** AC4

**Steps:**
1. Open the consolidated features view for a product whose connected repo has no short-track features at all.
2. Scan every card on the page.

**Expected outcome:**
> No card anywhere on the page shows "Reactive" — every card shows "Planned" or no label, honestly reflecting that this product has no reactive work right now.

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
