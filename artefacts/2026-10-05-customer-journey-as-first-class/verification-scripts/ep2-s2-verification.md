# AC Verification Script: Feature-to-stage mapping: save mapping with metric key selection

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey's canvas page (`/journeys/<id>`) for a journey that has at least one stage.
2. Make sure this repo's `.github/pipeline-state.json` has at least one feature with a `metricKeys` array in it, and at least one feature without one. (If none exist yet, this is new as of this story — a throwaway local edit to `pipeline-state.json` works for testing; restore it afterward.)

**Reset between scenarios:** Reload the canvas page between scenarios.

---

## Scenarios

---

### Scenario 1: Selecting a feature with recorded metrics shows a metric picker

**Covers:** AC1

**Steps:**
1. Click "Map feature" on a stage card.
2. Click on a feature that has metric keys recorded.

**Expected outcome:**
> The picker view changes to show that feature's name, and a list of checkboxes — one per recorded metric key, each showing the metric's name.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Selecting a feature with no recorded metrics shows "No metrics recorded"

**Covers:** AC1

**Steps:**
1. Click "Map feature" on a stage card.
2. Click on a feature that has no metric keys recorded.

**Expected outcome:**
> The picker view changes to show that feature's name and the exact text "No metrics recorded" — no checkboxes, no blank list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Saving a mapping with metric keys selected

**Covers:** AC2

**Steps:**
1. Click "Map feature", select a feature with recorded metrics (Scenario 1).
2. Check one or more of the metric-key checkboxes.
3. Click "Save mapping".

**Expected outcome:**
> The modal closes. The stage card now shows a visible badge or annotation indicating a feature is mapped to it, along with the selected metric keys.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Saving a mapping with no metric keys selected

**Covers:** AC3

**Steps:**
1. Click "Map feature", select any feature.
2. Leave all metric-key checkboxes unchecked (or select a feature with "No metrics recorded").
3. Click "Save mapping".

**Expected outcome:**
> The mapping still saves successfully — the stage shows the feature is mapped, just with no metric keys attached. No error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Re-mapping the same feature to the same stage updates, not duplicates

**Covers:** AC4

**Steps:**
1. Follow Scenario 3 to map a feature with metric key "A" selected.
2. Reload the page. Click "Map feature" on the SAME stage, select the SAME feature again.
3. This time, select a different metric key "B" instead of "A". Click "Save mapping".
4. Reload the page and check the stage's mapping display.

**Expected outcome:**
> The stage shows exactly one mapping for that feature — not two side by side. The shown metric key is "B" (the most recent selection), not "A".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Mapping a feature to a stage you don't have access to

**Covers:** AC5

**Steps:**
1. This requires a way to submit a save request for a stage belonging to a different tenant/organization than the one you're logged into — likely only testable via a direct API request (e.g. with a tool like `curl` or Postman), not through the normal UI, since the UI never shows stages you can't access.
2. Submit a mapping-save request for a stage ID known to belong to a different tenant.

**Expected outcome:**
> The request is rejected (not found / access denied). No mapping is created anywhere.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This scenario is primarily covered by automated tests, not expected to be manually walked through in normal use.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — metric picker with keys | | |
| Scenario 2 — "No metrics recorded" | | |
| Scenario 3 — save with metrics | | |
| Scenario 4 — save with no metrics | | |
| Scenario 5 — re-map updates, not duplicates | | |
| Edge case — cross-tenant rejection | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
