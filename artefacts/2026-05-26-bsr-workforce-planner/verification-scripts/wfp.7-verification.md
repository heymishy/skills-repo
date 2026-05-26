# AC Verification Script: Dashboard Tabs 3 & 4 — Hiring gap view and leadership coverage

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.7.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.7-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script:
1. `workforce-map` complete — `workforce/initiative-map.json` must exist with at least one entry with `hiringGap: true`.
2. Prepare at least two gap entries: one with a `productGroup` field, one without.
3. Prepare at least one initiative with `computedFTE ≥ 3` and no role in LEADERSHIP_ROLES, and one with ≥3 FTE and a leader role present.
4. Open `dashboards/workforce.html` in a browser.

---

## Scenario 1 — AC1: Hiring gap rows show all required fields

**What to do:**
1. Navigate to Tab 3 "Hiring Gaps".
2. Look at the rows shown.

**What to look for:**
- Each row displays: initiative slug, required role, required tags (as individual badges or comma-separated), allocation mode label (e.g. "net-new" or "profile-match — no match"), and the phrase "No current capacity — hiring required".
- No field is blank or shows "undefined".

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC1: Net-new mode label is shown correctly

**What to do:**
Find an entry with `allocationMode: "net-new"` in the table.

**What to look for:**
- Mode label shown as "net-new".

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC2: Group filter hides rows from other groups

**What to do:**
1. Apply the Group filter to select "Platform".
2. One gap entry has `productGroup: "Platform"`; another has `productGroup: "Data"`.

**What to look for:**
- Only the "Platform" gap entry is shown.
- The "Data" entry is hidden.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC2: Entries without productGroup are always visible

**What to do:**
1. With "Platform" filter active, find the gap entry that has NO `productGroup` field.

**What to look for:**
- That entry IS still visible in the table, even though the filter is active.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC3: Leadership coverage shows initiatives with FTE ≥ 3

**What to do:**
1. Navigate to Tab 4 "Leadership Coverage".
2. Find the initiative with `computedFTE: 4` (direct + profile-match only).

**What to look for:**
- The initiative appears in the Leadership Coverage table with its allocated roles listed.
- A "leader present" or "leader absent" flag is shown.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC3: Initiatives with FTE < 3 do NOT appear in leadership coverage

**What to do:**
Look at the Leadership Coverage tab for the initiative with `computedFTE: 2`.

**What to look for:**
- That initiative does NOT appear in the Leadership Coverage tab.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — AC4: Leadership gap badge shown when FTE ≥ 3 and no leader role

**What to do:**
1. Find the initiative with `computedFTE: 4` and no person with a role in LEADERSHIP_ROLES.
2. View Tab 4.

**What to look for:**
- A "Leadership gap" badge is displayed for that initiative.
- The badge uses BOTH a colour indicator (amber/red) AND the text "Leadership gap" — it is not colour-only.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 8 — AC4: No leadership gap badge when a leader role IS present

**What to do:**
1. Find an initiative with `computedFTE: 3` that includes a person with a role in LEADERSHIP_ROLES (e.g. "Product Owner").
2. View Tab 4.

**What to look for:**
- No "Leadership gap" badge on that row.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 9 — AC5: FTE < 3 initiative shown without badge in leadership coverage

**What to do:**
(This scenario is relevant only if the sub-threshold initiative is shown at all — by AC3 it should not appear. Confirm it is absent.)

**What to look for:**
- Initiative with FTE=2 is completely absent from Tab 4.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 10 — AC6: Empty state message when no hiring gaps

**What to do:**
1. Prepare a `workforce/initiative-map.json` with no entries having `hiringGap: true`.
2. Reload the dashboard and navigate to Tab 3.

**What to look for:**
- A message is displayed: "No hiring gaps recorded — all initiatives have capacity or are not yet mapped" (or similar).
- No empty table without explanation.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 10 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
