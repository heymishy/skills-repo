# AC Verification Script: Extend workforce-map with profile-match and net-new modes

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.4.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.4-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script:
1. `workforce/roster.json` populated (from wfp.1).
2. `workforce/cost-model.json` populated with rates (from wfp.1).
3. `workforce-map` available and working for direct mode (wfp.3 complete).
4. Test allocation entries prepared as described in each scenario.

---

## Scenario 1 — AC1: Profile-match finds people with all required tags

**What to do:**
1. In roster.json, add two people: Person A with `skills: ["react", "node"]` and Person B with `skills: ["react"]`.
2. Add to `allocation-input.json`: `{ "slug": "frontend-platform", "allocationMode": "profile-match", "requiredTags": ["react", "node"] }`.
3. Run `workforce-map`.

**What to look for:**
- The entry for `frontend-platform` in initiative-map.json contains only Person A (has both required tags).
- Person B is NOT in the people list (missing "node" tag).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC1: Partial tag match does not qualify

**What to do:**
Using the same fixture above, confirm that Person B (skills: `["react"]`, missing "node") is absent from the people list.

**What to look for:**
- `people` array does NOT include Person B.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC2: Profile-match excludes people already directly allocated to the same initiative

**What to do:**
1. Initiative "frontend-platform" has `allocationMode: "profile-match"` AND another allocation entry `{ "slug": "frontend-platform", "allocationMode": "direct", "people": ["Alex Rahi"] }`.
2. Alex Rahi ALSO matches the required tags for the profile-match step.
3. Run `workforce-map`.

**What to look for:**
- Alex Rahi does NOT appear in the profile-match people list for "frontend-platform".
- Alex DOES appear in the direct allocation list.
- No double-counting.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC3: Profile-match person allocated to another initiative still qualifies

**What to do:**
1. Person C is directly allocated to initiative "data-platform" (different initiative).
2. Person C matches the required tags for "frontend-platform" profile-match.
3. Run `workforce-map`.

**What to look for:**
- Person C appears in the profile-match people list for "frontend-platform".
- This is expected — cross-initiative profile matching is permitted.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC4: Net-new entry appears with computedFTE=0

**What to do:**
1. Add to allocation-input.json: `{ "slug": "future-data-lake", "allocationMode": "net-new", "requiredRole": "Data Engineer", "requiredTags": ["spark", "kafka"] }`.
2. Run `workforce-map`.

**What to look for:**
- Entry for `future-data-lake` in initiative-map.json has `allocationMode: "net-new"`.
- `computedFTE: 0` (no current people — this is a demand signal only).
- `hiringGap: true`.
- `requiredRole: "Data Engineer"` is present.
- `requiredTags: ["spark", "kafka"]` are present.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC5: Net-new FTE not counted in aggregate total

**What to do:**
1. Initiative A (direct, 3 people) and Initiative B (net-new, 0 FTE) both in allocation-input.json.
2. Run `workforce-map` and inspect if an aggregate total is computed.

**What to look for:**
- Any total/summary field that exists reflects only 3 FTE (from Initiative A).
- Net-new entry's 0 FTE is not double-counted, and if any gap report is generated, Initiative B appears separately as a hiring need.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — AC6: Gap report lists all unfilled roles

**What to do:**
1. Set up at least one profile-match entry with no qualifying candidates and one net-new entry.
2. Run `workforce-map`.

**What to look for:**
- Both entries appear in a gap summary (either a section in initiative-map.json or a separate `workforce/gap-report.json`).
- Profile-match entry that found no people has `hiringGap: true` and a message similar to "No current capacity".
- Net-new entry has `hiringGap: true`.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 8 — NFR-PERF: Mixed-mode map completes in under 5 seconds for 20 initiatives

**What to do:**
Set up 20 entries mixing all three modes. Time the invocation.

**What to look for:**
- Total wall time under 5 seconds.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 8 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
