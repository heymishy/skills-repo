# AC Verification Script: Multi-team initiative scope decomposition and rollup view

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.8.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.8-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script:
1. `workforce-map` complete (wfp.3/wfp.4) — base mapping working.
2. Prepare `allocation-input.json` with two entries sharing the same `parentSlug: "platform-migration"`, one with `scopeLabel: "API Layer"` and one with `scopeLabel: "Data Migration"`.
3. Prepare a `portfolio/platform-migration.json` with `{ "fte_demand": 5 }`.
4. Run `workforce-map` with this fixture and observe `workforce/initiative-map.json`.
5. Open `dashboards/workforce.html` in a browser for Tab 5 checks.

---

## Scenario 1 — AC1: Entries sharing parentSlug are rolled up into a single parent entry

**What to do:**
Inspect `workforce/initiative-map.json` after running `workforce-map` with the two-entry `platform-migration` fixture.

**What to look for:**
- There is exactly ONE entry at the top level with `slug: "platform-migration"`.
- It has `allocationMode: "rollup"`.
- It has `scopeItems: [...]` with length 2 — one for "API Layer" and one for "Data Migration".
- The two individual scope items do NOT appear as separate top-level entries.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC1: Rollup totals are summed correctly

**What to do:**
With the fixture above, where "API Layer" has computedFTE=2 and "Data Migration" has computedFTE=3:

**What to look for:**
- `totalComputedFTE: 5` on the parent rollup entry.
- `totalComputedCostPerQuarterNZD` is the sum of both scope items' costs.
- `claimedFTE: 5` from `portfolio/platform-migration.json`.
- `fteDelta: 0` (5 − 5 = 0).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC2: Entries WITHOUT parentSlug process exactly as before (backwards compatible)

**What to do:**
1. Add one entry to `allocation-input.json` that has NO `parentSlug` field.
2. Run `workforce-map`.

**What to look for:**
- That entry appears in `initiative-map.json` as a regular entry (as per wfp.3 output format).
- It has no `scopeItems`, no `allocationMode: "rollup"`, no `totalComputedFTE`.
- Its output is identical to what wfp.3 would produce for it.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC3: A single entry with parentSlug creates a rollup with one scope item

**What to do:**
1. Add a single allocation-input entry with `parentSlug: "solo-initiative"` and no other entry sharing that parentSlug.
2. Run `workforce-map`.

**What to look for:**
- A rollup entry exists for `slug: "solo-initiative"` with `allocationMode: "rollup"`.
- `scopeItems.length === 1`.
- No error or crash.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC4: Dashboard Tab 5 shows the rollup parent row

**What to do:**
1. Open the dashboard and navigate to Tab 5 "Initiative Rollup" (or equivalent label).
2. Load the fixture with the "platform-migration" rollup entry.

**What to look for:**
- The parent entry "platform-migration" is visible as a row.
- `totalComputedFTE` value is shown.
- `fteDelta` value is shown.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC4: Child rows are indented below the parent

**What to do:**
In Tab 5, look at the rows beneath "platform-migration".

**What to look for:**
- "API Layer" and "Data Migration" rows are shown below the parent row.
- They have a visual indication of being children (indented, smaller text, nesting indicator, or similar).
- The `scopeLabel` values ("API Layer", "Data Migration") are visible.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — AC4: scopeLabel used for child row display; fallback to slug if absent

**What to do:**
1. Confirm the fixture "API Layer" scope item has `scopeLabel: "API Layer"`.
2. Optionally: add a scope item WITHOUT a `scopeLabel` field to verify it falls back to the entry's slug.

**What to look for:**
- Items with `scopeLabel` show the scopeLabel value.
- Items without `scopeLabel` show the item's own slug as the display name.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 8 — AC5: Negative delta parent row has red/delta-negative indicator

**What to do:**
Set `portfolio/platform-migration.json` to `fte_demand: 7` (making fteDelta = 5 − 7 = −2). Reload.

**What to look for:**
- The parent "platform-migration" row FTE Delta cell has the `delta-negative` CSS class (red indicator).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 9 — AC5: Positive/zero delta has delta-ok indicator; null shows "no claim"

**What to do:**
1. Set `portfolio/platform-migration.json` back to `fte_demand: 5` (delta = 0). Reload.
2. Also check an entry without a portfolio file (claimedFTE = null).

**What to look for:**
- Zero/positive delta row has `delta-ok` CSS class (no red).
- null-delta row shows "no claim" text.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 10 — AC6: Empty state shown when no rollup entries in initiative-map.json

**What to do:**
1. Load an initiative-map.json that has entries, but none with `allocationMode: "rollup"`.
2. Navigate to Tab 5.

**What to look for:**
- An empty state message is shown — something indicating no rollup entries are present.
- No blank table without explanation.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 10 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
