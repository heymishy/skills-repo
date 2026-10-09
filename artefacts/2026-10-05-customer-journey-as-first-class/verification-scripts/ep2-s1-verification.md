# AC Verification Script: Feature picker: read pipeline-state.json and render feature list in modal

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey's canvas page (`/journeys/<id>`) for a journey that has at least one stage. Use any existing journey, or create one first via "New journey" from the `/customer-journeys` list page.
2. Make sure the repo you're viewing has a real `.github/pipeline-state.json` file with at least one feature in it (the production skills-repo itself qualifies).

**Reset between scenarios:** Reload the canvas page between scenarios to get a fresh, closed picker.

---

## Scenarios

---

### Scenario 1: Feature picker shows the real feature list

**Covers:** AC1

**Steps:**
1. On any stage card, click the "Map feature" button.

**Expected outcome:**
> A modal opens titled something like "Map feature" (or similar). It lists features, each showing both a feature name and its slug (e.g. "Customer Journey as First Class — 2026-10-05-customer-journey-as-first-class"). The list reflects the features that actually exist in this repo's own `pipeline-state.json` right now — not a hardcoded sample list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can filter the feature list by typing

**Covers:** AC2

**Steps:**
1. With the picker modal open (from Scenario 1), click into the search/filter box at the top of the list.
2. Type a few letters that match only one feature's name or slug.

**Expected outcome:**
> As you type, the list narrows to only the features whose name or slug matches what you typed. Features that don't match disappear from view. Clearing the search box brings the full list back.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A broken pipeline-state.json shows a clear error, not a crash

**Covers:** AC3

**Steps:**
1. Temporarily rename or corrupt `.github/pipeline-state.json` in the repo being viewed (e.g. append `{broken` to the end of the file in a throwaway local copy — do not do this against a real shared repo).
2. Reload the canvas page and click "Map feature" again.

**Expected outcome:**
> The modal still opens — the whole page does not crash or show a server error page. Instead of a feature list, the modal shows the message: "Features could not be loaded. Check that pipeline-state.json exists."

**Result:** [ ] Pass  [ ] Fail
**Notes:** Restore the original `pipeline-state.json` after this scenario before continuing.

---

### Scenario 4: Closing the picker without picking anything changes nothing

**Covers:** AC4

**Steps:**
1. Open the picker modal (Scenario 1).
2. Without clicking on any feature in the list, close the modal (click the Close button, or press Escape).

**Expected outcome:**
> The modal closes. The canvas page looks exactly as it did before you opened the picker — no new mapping, badge, or annotation appears anywhere on the stage card or canvas.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Feature picker with zero features in pipeline-state.json

**Covers:** AC1 (boundary)

**Steps:**
1. Using a throwaway local copy, edit `pipeline-state.json` so its `features` list is empty (`"features": []`).
2. Reload the canvas page and click "Map feature".

**Expected outcome:**
> The modal opens and shows an empty-list state (e.g. "No features found" or similar) — this is visibly different from Scenario 3's error message. It should be clear this means "there really are no features," not "something went wrong reading the file."

**Result:** [ ] Pass  [ ] Fail
**Notes:** Restore the original `pipeline-state.json` after this scenario.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — feature list shown | | |
| Scenario 2 — filter works | | |
| Scenario 3 — broken file shows error | | |
| Scenario 4 — close without selecting is a no-op | | |
| Edge case — empty feature list | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
