# AC Verification Script: Map workforce to initiative allocation by direct assignment

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.3.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.3-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script:
1. `workforce/roster.json` must exist (from wfp.1).
2. `workforce/cost-model.json` must exist with at least one populated `quarterlyRateNZD` value.
3. `workforce/allocation-input.json` must exist — one entry per initiative with `allocationMode: "direct"` and a `people` array listing names.
4. Portfolio demand files at `portfolio/[initiative-slug].json` must exist for at least 2 initiatives.
5. The `workforce-map` CLI must be runnable.

---

## Scenario 1 — AC1: Direct allocation entry created in initiative-map.json

**What to do:**
1. Set up `allocation-input.json` with one direct entry: `{ "slug": "platform-migration", "allocationMode": "direct", "people": ["Alex Rahi", "Jordan Tane"] }`.
2. Set up `portfolio/platform-migration.json` with `{ "fte_demand": 3 }`.
3. Run: `workforce-map`

**What to look for:**
- `workforce/initiative-map.json` is created.
- One entry has `slug: "platform-migration"` and `allocationMode: "direct"`.
- It has `people: ["Alex Rahi", "Jordan Tane"]`.
- `computedFTE: 2` (two people listed).
- `claimedFTE: 3` (from portfolio file's `fte_demand`).
- `fteDelta: -1` (2 − 3 = −1).
- `gap: true` (delta is negative).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC2: Retired person excluded from computedFTE

**What to do:**
1. Mark one of the people in the allocation (e.g. Jordan Tane) as `retired: true` in `workforce/platform.json`.
2. Run `workforce-map`.

**What to look for:**
- Jordan Tane does NOT appear in the `people` array of the output entry.
- `computedFTE` is decremented by 1 (now 1, not 2).
- `fteDelta` updated accordingly.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC2: Missing portfolio file → claimedFTE is null, not an error

**What to do:**
1. Remove `portfolio/platform-migration.json`.
2. Run `workforce-map`.

**What to look for:**
- `workforce-map` completes without error.
- The entry for `platform-migration` has `claimedFTE: null` and `fteDelta: null`.
- A warning message is printed (e.g. "No portfolio file for platform-migration — claimedFTE set to null").
- No exception or crash.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC3: Cost computed per person using their role rate

**What to do:**
1. Ensure `workforce/cost-model.json` has `{ "role": "Engineer", "quarterlyRateNZD": 30000 }`.
2. Both Alex Rahi and Jordan Tane have `role: "Engineer"` in roster.json.
3. Run `workforce-map`.

**What to look for:**
- `computedCostPerQuarterNZD: 60000` on the entry (2 engineers × 30,000).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC3: Cost 0 for unmapped role

**What to do:**
1. Add a person with a role NOT in `cost-model.json` (e.g. "UX Designer") to the allocation.
2. Run `workforce-map`.

**What to look for:**
- The person IS counted in `computedFTE`.
- `computedCostPerQuarterNZD` is not inflated (the UX Designer contributes 0 to cost).
- No error is thrown for the unmapped role.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC4: gap:true only when fteDelta is negative

**What to do:**
1. Scenario A: `computedFTE: 2`, `claimedFTE: 1` → fteDelta is +1.
2. Scenario B: `computedFTE: 2`, `claimedFTE: 2` → fteDelta is 0.
3. Run `workforce-map` for each.

**What to look for:**
- Scenario A: `gap: false` (or absent).
- Scenario B: `gap: false` (or absent).
- Only entries with negative delta have `gap: true`.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — AC5: Second run produces identical output (idempotent)

**What to do:**
1. Run `workforce-map`. Note the content of `initiative-map.json`.
2. Run `workforce-map` a second time without changing any input files.

**What to look for:**
- `initiative-map.json` is byte-for-byte identical to the first run, or at least semantically identical (same values on all fields, same ordering).
- No duplicate entries are appended.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 8 — NFR-PERF: Map command completes in under 5 seconds for 20 initiatives

**What to do:**
1. Set up `allocation-input.json` with 20 direct entries.
2. Time the invocation.

**What to look for:**
- Total wall time under 5 seconds.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 8 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
