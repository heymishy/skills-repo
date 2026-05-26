# AC Verification Script: Dashboard Tab 1 — Roster view with filters and search

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.5.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.5-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script:
1. `workforce-intake` complete (wfp.1) — `workforce/roster.json` must exist.
2. The workforce planning dashboard must be accessible — open `dashboards/workforce.html` in a browser (file:// or local server).
3. The browser must load roster data. If the dashboard loads from `workforce/roster.json` on the local file system, ensure the file is present.

---

## Scenario 1 — AC1: Roster table shows all current (non-retired) people with correct columns

**What to do:**
1. Open the dashboard. Navigate to Tab 1 "Roster".
2. Look at the table rows.

**What to look for:**
- Table has columns: Name, Group, Type, Role, Start Date, Skills (minimum — additional columns are fine).
- Retired people (those with `retired: true`) do NOT appear in the table.
- Active people appear with their values populated.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC2: Group filter narrows visible rows

**What to do:**
1. Click (or select) the "Group" dropdown/filter control.
2. Select "Platform" (or whichever group name exists in your data).

**What to look for:**
- Only rows belonging to the "Platform" group are shown.
- Other group rows are hidden.
- Row count changes accordingly.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC2: Type filter narrows visible rows

**What to do:**
1. Select a value from the "Type" filter (e.g. "permanent").

**What to look for:**
- Only rows with matching employmentType are shown.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC2: Combined Group + Type filter

**What to do:**
1. Select both "Platform" for Group and "permanent" for Type.

**What to look for:**
- Only rows that match BOTH conditions are shown (i.e. AND logic).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC3: Name search filters rows in real time

**What to do:**
1. Type a partial name into the search box (e.g. "al").

**What to look for:**
- Rows update as you type (no submit button required).
- Only rows where the person's name contains "al" (case-insensitive) remain visible.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC4: People with no start date are hidden from the active roster

**What to do:**
1. Prepare a `roster.json` entry with `startDate: null`.
2. Reload the dashboard.

**What to look for:**
- The person with no start date does NOT appear in the roster table.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — AC5: Clear/Reset filters restores the full active roster

**What to do:**
1. Apply a group filter.
2. Click the "Reset filters" or "Clear" control.

**What to look for:**
- All active (non-retired) people appear again.
- All filters are reset to their default (no selection).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 8 — AC6: Error state shown when roster.json is absent

**What to do:**
1. Rename or remove `workforce/roster.json`.
2. Reload the dashboard.

**What to look for:**
- A user-friendly error message is displayed — not a blank page, not a browser error, and not a JSON parse exception in the console being the only signal.
- The message should include something about "roster" not being found.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 9 — NFR-A11Y: Colour contrast (manual visual check)

**What to do:**
1. Open the dashboard with the default theme.
2. Look at the roster table text against its background.

**What to look for:**
- Text is clearly readable. If you have a colour contrast checker browser extension, run it on the table — result should be ≥ 4.5:1 for normal text.

**Note:** This is a manual visual check only — there is no automated test for this.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 9 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
