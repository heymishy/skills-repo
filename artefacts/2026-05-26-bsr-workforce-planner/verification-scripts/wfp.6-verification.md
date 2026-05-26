# AC Verification Script: Dashboard Tab 2 — Initiative allocation matrix with FTE delta

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.6.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.6-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script:
1. `workforce-map` complete (wfp.3/wfp.4) — `workforce/initiative-map.json` must exist.
2. The workforce planning dashboard must be accessible.
3. Ensure your initiative-map.json has at least one entry with negative fteDelta, one with positive/zero, and one with `gap: true`.

---

## Scenario 1 — AC1: Allocation Matrix tab shows all required columns

**What to do:**
1. Open the dashboard. Navigate to Tab 2 "Allocation Matrix".

**What to look for:**
- Table includes columns for: Initiative, Allocation Mode, People Count, Computed FTE, Claimed FTE, FTE Delta, Computed Cost (NZD), Claimed Cost (NZD).
- All values are populated from initiative-map.json.
- No empty "undefined" or "[object Object]" values visible.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC1: Null claimedFTE shown as "—"

**What to do:**
1. Open (or arrange for) an initiative with `claimedFTE: null` in initiative-map.json.
2. View Tab 2.

**What to look for:**
- The Claimed FTE cell for that row shows "—" (an em dash or equivalent placeholder).
- It does NOT show "null", "undefined", or blank.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC1: Null claimedCostNZD shown as "—"

**What to do:**
Same as Scenario 2 but for the Claimed Cost column.

**What to look for:**
- The Claimed Cost cell shows "—".

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC2: Negative fteDelta row has a visual gap indicator

**What to do:**
1. Find a row where `fteDelta` is negative (e.g. −2).

**What to look for:**
- The FTE Delta cell has a visually distinct style — red background or bold red text or a coloured indicator.
- This must be distinguishable from zero or positive delta rows without relying on colour alone (a text label or downward arrow must also be present).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC2: Zero or positive fteDelta row has no red indicator

**What to do:**
1. Find a row where `fteDelta` is 0 or positive.

**What to look for:**
- No red styling on the FTE Delta cell.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC3: gap:true row shows a "Gap" badge

**What to do:**
1. Find an initiative with `gap: true` in initiative-map.json.
2. View its row in Tab 2.

**What to look for:**
- A visible "Gap" badge or label is shown somewhere in the row (not hidden).
- The badge is not solely a colour change — it should include the text "Gap".

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — AC4: Error state shows a message when initiative-map.json is missing

**What to do:**
1. Rename or remove `workforce/initiative-map.json`.
2. Reload the dashboard and navigate to Tab 2.

**What to look for:**
- A visible error message is displayed (e.g. "Initiative map not found — run workforce-map to generate workforce/initiative-map.json").
- No empty table without explanation.
- No unhandled browser exception as the only signal.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 7 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
