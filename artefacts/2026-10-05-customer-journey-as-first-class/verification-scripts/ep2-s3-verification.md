# AC Verification Script: Delivery view: feature and metric annotation rows on stage cards

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s3.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey's canvas page (`/journeys/<id>`) for a journey that has at least one stage with a feature mapped to it (via `ep2-s2`'s own "Map feature"/"Save mapping" flow) and at least one stage with no mapping.
2. Make sure this repo's `.github/pipeline-state.json` has at least one feature with both `metricKeys` and a matching `metricValues` entry, and one feature with a `metricKeys` entry that has NO matching `metricValues` entry. (Both fields are new as of `ep2-s2`/`ep2-s3` — a throwaway local edit works for testing; restore it afterward.)

**Reset between scenarios:** Reload the canvas page between scenarios.

---

## Scenarios

---

### Scenario 1: Switching to the Delivery view shows mapped features and their metric values

**Covers:** AC1

**Steps:**
1. Click the "Delivery" view toggle button above the canvas.
2. Look at a stage card that has a feature mapped to it with recorded metric keys and values.

**Expected outcome:**
> An annotation row appears below the stage card listing the mapped feature's name and slug, and beneath it each selected metric key with its real value (e.g. "conversion_rate: 0.42").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A stage with no mapped features shows "No features mapped"

**Covers:** AC1

**Steps:**
1. Stay in the Delivery view.
2. Look at a stage card with no feature mapping at all.

**Expected outcome:**
> The annotation area shows the exact text "No features mapped" — not blank, not missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A mapped feature with zero metric keys selected shows "No metrics selected"

**Covers:** AC1

**Steps:**
1. Find (or create via `ep2-s2`'s Save flow) a mapping where no metric-key checkboxes were selected.
2. View that stage in Delivery view.

**Expected outcome:**
> The feature's annotation row shows the exact text "No metrics selected" under it — not blank, not a missing metrics section.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A mapped feature that no longer exists in pipeline-state.json shows a warning with a Remove button

**Covers:** AC2

**Steps:**
1. Temporarily remove (or rename) a feature from `.github/pipeline-state.json` that has an existing mapping to a stage.
2. Reload the canvas and view that stage in Delivery view.
3. Click the "Remove" button on the warning row.

**Expected outcome:**
> Step 2: the row shows "⚠️ Feature not found (<slug>)" instead of crashing or silently disappearing. Step 3: the mapping is removed (confirm by reloading — the warning row is gone); no other stage's mappings are affected.

**Result:** [ ] Pass  [ ] Fail
**Notes:** Restore the feature in `pipeline-state.json` afterward if it was removed only for this test.

---

### Scenario 5: Switching views toggles annotation rows without a page reload

**Covers:** AC3

**Steps:**
1. With a stage that has a feature mapping visible in Delivery view, open browser dev tools to the Network tab.
2. Click "Canvas", then "Customer experience", then back to "Delivery".

**Expected outcome:**
> Each click instantly shows/hides the annotation rows (visible only in Delivery view) with NO new network request fired — confirming the toggle is a pure client-side CSS class change. "Customer experience" view shows no extra annotation content yet (that's a separate, later story's scope) but the toggle itself works without error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: A selected metric key with no recorded value shows "No value recorded"

**Covers:** AC4

**Steps:**
1. Map a feature to a stage, selecting a metric key that has NO corresponding entry in that feature's `metricValues` in `pipeline-state.json`.
2. View that stage in Delivery view.

**Expected outcome:**
> That specific metric key's row shows "No value recorded" — not blank, not an error, not a crash for the whole annotation row.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Removing a mapping belonging to a different tenant

**Covers:** (new DELETE route, same cross-tenant policy as AC5 in ep2-s2)

**Steps:**
1. This requires a direct API request (e.g. `curl`/Postman), not the normal UI, since the UI never shows mappings you don't own.
2. Submit a `DELETE` request for a mapping id known to belong to a different tenant.

**Expected outcome:**
> The request is rejected with 404 (not found) — no row is deleted anywhere.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This scenario is primarily covered by automated tests, not expected to be manually walked through in normal use.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Delivery view shows feature + metric values | | |
| Scenario 2 — "No features mapped" | | |
| Scenario 3 — "No metrics selected" | | |
| Scenario 4 — feature-not-found warning + Remove | | |
| Scenario 5 — view toggle, no network request | | |
| Scenario 6 — "No value recorded" | | |
| Edge case — cross-tenant delete rejection | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
