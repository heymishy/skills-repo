# AC Verification Script — wfp.14 Temporal risk (rolloff) view

**Story:** wfp.14
**Run context:** After implementation, before PR
**Estimated duration:** ~5 minutes (excluding scale test)
**Test file:** `tests/workforce/check-wfp14-temporal-risk.js`
**Key requirement:** All timing-sensitive tests MUST pass `_nowOverride=2026-01-01` (or another pinned date) to ensure deterministic quarter boundaries.

---

## Pre-conditions

- Intelligence server starts in test mode (`NODE_ENV=test`)
- `computeTemporalRiskData` exported from shared module
- `computeHeatMapData` importable (used in AC4 verification)

---

## Scenario 1 — Quarter window rolloff counting

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario quarters
```

**Steps:**
1. Fixture: Alice (endDate: 2026-02-15, Q1), Bob (endDate: 2026-05-20, Q2), no nowDate variation
2. Pin `nowDate = 2026-01-01` via `_nowOverride`
3. Call `computeTemporalRiskData`

**Expected:**
- Q1 rolloff contains Alice; Q2 rolloff contains Bob
- remainingCount for each quarter = teamSize − rolloffCount (cumulative or per-quarter — per story AC)
- coverageRiskFlag set where rolloff exceeds POST_ROLLOFF_COVERAGE_THRESHOLD

**Pass/Fail indicator:** `[wfp.14-AC1] PASS` or `[wfp.14-AC1] FAIL: <reason>`

---

## Scenario 2 — HTML quarter columns and risk indicators

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario html-structure
```

**Steps:**
1. GET /intelligence/temporal-risk?_nowOverride=2026-01-01 (authenticated)
2. Parse HTML

**Expected:**
- Status 200
- HTML contains 4 quarter column headers
- At-risk cells contain risk indicator attribute or class
- Nav link `<a href="/workforce-chat">` present
- No external CDN

**Pass/Fail indicator:** `[wfp.14-AC2] PASS` or `[wfp.14-AC2] FAIL: <reason>`

---

## Scenario 3a — Secondary breakdown panel

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario panel-structure
```

**Steps:**
1. GET /intelligence/temporal-risk?_nowOverride=2026-01-01
2. Find panel element for team-alpha Q2 cell
3. Invoke toggle function

**Expected:**
- Panel hidden by default
- On toggle: panel visible with initiative slugs and postRolloffCoverage values

**Pass/Fail indicator:** `[wfp.14-AC3] PASS` or `[wfp.14-AC3] FAIL: <reason>`

---

## Scenario 3b — Visual expand animation (manual — CSS-layout-dependent)

⚠️ **Manual step.**

1. Start `npm run workforce`; open `/intelligence/temporal-risk`
2. Click a team-quarter cell with a rolloff
3. Verify: initiative breakdown panel expands smoothly; postRolloffCoverage percentages visible

**Outcome:** Record PASS / FAIL.

---

## Scenario 4 — postRolloffCoverage uses computeHeatMapData

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario post-rolloff-coverage
```

**Steps:**
1. Fixture: Alice (sole `"java"` holder on team-alpha) rolls off Q2; initiative-x requires `"java"`
2. Pin `nowDate = 2026-01-01`; call `computeTemporalRiskData`
3. Read `quarters["Q2-2026"]["team-alpha"].initiatives["initiative-x"].postRolloffCoverage`

**Expected:**
- `postRolloffCoverage` for `"java"` tag on initiative-x decreases after Q2 (Alice removed)
- `computeHeatMapData` was invoked with post-rolloff roster (spy/intercept confirms)

**Pass/Fail indicator:** `[wfp.14-AC4] PASS` or `[wfp.14-AC4] FAIL: <reason>`

---

## Scenario 5 — Permanent members excluded from rolloffs

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario permanent-members
```

**Steps:**
1. Fixture: Carol has no `endDate`; Dan has `endDate: null`
2. Call `computeTemporalRiskData`

**Expected:**
- Carol and Dan absent from all quarterly rolloffCounts
- Both counted in remainingCount for all 4 quarters

**Pass/Fail indicator:** `[wfp.14-AC5] PASS` or `[wfp.14-AC5] FAIL: <reason>`

---

## Scenario 6 — Retired members excluded

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario retired-excluded
```

**Steps:**
1. Fixture: Eve has `status: "retired"`, `endDate: "2026-03-15"` (Q1 window)
2. Fixture: Frank has `endDate: "2025-12-01"` (before nowDate 2026-01-01 — already departed)
3. Call `computeTemporalRiskData`

**Expected:**
- Eve and Frank absent from all quarters
- teamSize for their team does NOT include them

**Pass/Fail indicator:** `[wfp.14-AC6] PASS` or `[wfp.14-AC6] FAIL: <reason>`

---

## Scenario 7 — All-rolloffs-zero produces no risk flags

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario zero-rolloffs
```

**Steps:**
1. All roster members have no endDate
2. Call `computeTemporalRiskData`

**Expected:**
- All rolloffCounts === 0
- All coverageRiskFlags === false

**Pass/Fail indicator:** `[wfp.14-AC7] PASS` or `[wfp.14-AC7] FAIL: <reason>`

---

## Scenario 8 — Missing initiative-map coverage columns omitted

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario missing-map
```

**Steps:**
1. Call `computeTemporalRiskData` with `initiativeMap = null`
2. Check output shape

**Expected:**
- Quarter/team rolloff counts still computed
- `initiatives` key absent or empty for all team-quarter entries (no coverage columns)

**Pass/Fail indicator:** `[wfp.14-AC8] PASS` or `[wfp.14-AC8] FAIL: <reason>`

---

## Scenario 9 — _nowOverride test hook

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario now-override
```

**Steps:**
1. `NODE_ENV=test`; GET /api/intelligence/temporal-risk-data?_nowOverride=2026-06-01
2. Check that Q1 window starts 2026-06-01

**Expected:**
- Quarter labels reflect 2026-06-01 as start
- _nowOverride in production mode is ignored (separate test run with `NODE_ENV=production`)

**Pass/Fail indicator:** `[wfp.14-NFR-DATE] PASS` or `[wfp.14-NFR-DATE] FAIL: <reason>`

---

## Scenario 10 — Auth guard

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario auth-guard
```

**Steps:**
1. GET /api/intelligence/temporal-risk-data — no session
2. GET /intelligence/temporal-risk — no session

**Expected:** Both non-200

**Pass/Fail indicator:** `[wfp.14-SEC] PASS` or `[wfp.14-SEC] FAIL: <reason>`

---

## Scenario 11 — Scale performance (SKIP_SCALE_TESTS=1 to skip)

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp14-temporal-risk.js --scenario scale-perf
```

**Steps:**
1. 200-person roster, 40 teams, 40 initiatives; _nowOverride=2026-01-01
2. GET /api/intelligence/temporal-risk-data; record time

**Expected:** Elapsed ≤ 500ms

**Pass/Fail indicator:** `[wfp.14-NFR-PERF] PASS` or `[wfp.14-NFR-PERF] FAIL: <elapsed>ms`

---

## Scenario 12 — Compatibility: 1280px (manual — RISK-ACCEPT)

⚠️ **Manual — RISK-ACCEPT logged in decisions.md.**

1. Open `/intelligence/temporal-risk` at 1280px viewport
2. Check no horizontal scrollbar with 4 quarters visible

**Outcome:** Record PASS / FAIL.

---

## Summary

```
Automated scenarios: 1, 2, 3a, 4, 5, 6, 7, 8, 9, 10, 11
Manual scenarios: 3b (expand animation), 12 (RISK-ACCEPT)
All automated scenarios must PASS before opening PR.
```
