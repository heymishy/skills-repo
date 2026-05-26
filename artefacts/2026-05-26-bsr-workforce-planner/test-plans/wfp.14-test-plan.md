# Test Plan: Temporal risk (rolloff) view — intelligence server

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.14.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | temporal-risk-data JSON — 4 quarters, rolloffCount, remainingCount, coverageRiskFlag | 4 tests | 1 test | — | — | — | 🟢 |
| AC2 | temporal-risk HTML — quarter columns, team rows, risk indicators | 2 tests | — | — | — | — | 🟢 |
| AC3 | secondary panel — initiative coverage breakdown per team-quarter | 2 tests | — | — | 1 scenario (visual expand) | CSS-layout-dependent | 🟡 |
| AC4 | AC4: postRolloffCoverage derived via computeHeatMapData (pure function cross-reference) | 2 tests | — | — | — | — | 🟢 |
| AC5 | no endDate treated as permanent (excluded from rolloff counts) | 2 tests | — | — | — | — | 🟢 |
| AC6 | retired members excluded from all quarters | 2 tests | — | — | — | — | 🟢 |
| AC7 | all-rolloffs-zero scenario — no risk indicators shown | 1 test | — | — | — | — | 🟢 |
| AC8 | missing initiative-map — coverage columns omitted gracefully | 1 test | — | — | — | — | 🟢 |
| NFR-DATE | `_nowOverride` query param accepted in NODE_ENV=test for deterministic results | 2 tests | — | — | — | — | 🟢 |
| NFR-PERF | GET /api/intelligence/temporal-risk-data responds within 500ms at scale | — | 1 test | — | — | — | 🟢 |
| NFR-SEC | Both routes require authGuard; `_nowOverride` blocked in production mode | 2 tests | — | — | — | — | 🟢 |
| NFR-COMPAT | 1280px viewport — no horizontal scroll for 4 quarter columns | — | — | — | 1 scenario | CSS-layout-dependent | 🔴 RISK-ACCEPT |

---

## Coverage gaps

| Gap | AC | Gap type | Handling |
|-----|----|-----------|---------| 
| Secondary panel expand/collapse animation | AC3 | CSS-layout-dependent | Manual scenario 3b |
| 1280px horizontal scroll | NFR-COMPAT | CSS-layout-dependent | RISK-ACCEPT in decisions |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity:** No — fake names, fake teams, fake dates
**`_nowOverride` essential for deterministic quarter window tests.** All AC1 tests pin `nowDate` to a fixed ISO date (e.g. `2026-01-01`) so quarter boundaries are predictable.

### Quarter boundary logic

Given `nowDate = 2026-01-01`:
- Q1: 2026-01-01 to 2026-03-31
- Q2: 2026-04-01 to 2026-06-30
- Q3: 2026-07-01 to 2026-09-30
- Q4: 2026-10-01 to 2026-12-31

### Data requirements per AC

| AC | Data needed | Notes |
|----|-------------|-------|
| AC1 | Roster members with `endDate` in each of the 4 quarter windows | Pin nowDate for determinism |
| AC5 | Roster member with no `endDate` field | Must not appear in any quarter |
| AC6 | Roster member with `status: "retired"` or `endDate < nowDate` | Must not appear in any quarter |
| AC7 | All roster members have no endDate or endDate = null | |
| AC8 | No initiative-map.json | |

---

## Unit Tests

### computeTemporalRiskData — member with endDate in Q1 window counted in Q1

- **Verifies:** AC1
- **Precondition:** Alice (team-alpha) has `endDate: "2026-02-15"`; `nowDate = 2026-01-01`
- **Action:** Call `computeTemporalRiskData(teams, roster, initiativeMap, new Date("2026-01-01"))`
- **Expected result:** `quarters["Q1-2026"]["team-alpha"].rolloffCount === 1` (Alice counted)
- **Edge case:** No

### computeTemporalRiskData — member does not appear in quarter outside their endDate window

- **Verifies:** AC1
- **Precondition:** Alice has `endDate: "2026-02-15"` (falls in Q1); `nowDate = 2026-01-01`
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** Alice NOT in Q2, Q3, Q4 rolloff counts
- **Edge case:** No

### computeTemporalRiskData — remainingCount = teamSize - rolloffCount for that quarter

- **Verifies:** AC1
- **Precondition:** team-alpha has 5 active members; 2 roll off in Q2
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** `quarters["Q2-2026"]["team-alpha"].remainingCount === 3`
- **Edge case:** No

### computeTemporalRiskData — coverageRiskFlag when remainingCount < threshold

- **Verifies:** AC1
- **Precondition:** team-alpha has 5 members; 4 roll off in Q2 → remainingCount = 1; POST_ROLLOFF_COVERAGE_THRESHOLD = 0.5 → 1/5 = 0.2 < 0.5 → risk
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** `quarters["Q2-2026"]["team-alpha"].coverageRiskFlag === true`
- **Edge case:** No

### temporal-risk HTML contains quarter columns

- **Verifies:** AC2
- **Precondition:** Server running with fixture; `_nowOverride = 2026-01-01`
- **Action:** GET /intelligence/temporal-risk?_nowOverride=2026-01-01 (test mode, authenticated); parse HTML
- **Expected result:** HTML contains column headers for all 4 quarter labels (Q1-2026 through Q4-2026); contains team name rows; risk flags visually indicated
- **Edge case:** No

### temporal-risk HTML marks teams with coverageRiskFlag visually

- **Verifies:** AC2
- **Precondition:** team-alpha has coverageRiskFlag=true in Q2
- **Action:** GET /intelligence/temporal-risk
- **Expected result:** HTML element for team-alpha Q2 cell has a risk CSS class or indicator attribute (e.g. `data-risk="true"` or class containing "risk")
- **Edge case:** No

### secondary breakdown panel structure in HTML

- **Verifies:** AC3
- **Precondition:** team-alpha allocated to initiative-x; Alice (team-alpha) rolls off Q2
- **Action:** GET /intelligence/temporal-risk; inspect HTML for panel
- **Expected result:** Panel element (hidden by default) containing initiative-x and postRolloffCoverage data present for team-alpha Q2 cell
- **Edge case:** No

### secondary breakdown panel toggle function

- **Verifies:** AC3
- **Precondition:** Extract inline JS toggle function from HTML
- **Action:** Invoke toggle for team-alpha Q2 cell
- **Expected result:** Panel display changes from hidden to visible; panel body contains initiative slugs and post-rolloff coverage percentages
- **Edge case:** No

### postRolloffCoverage derived via computeHeatMapData invocation (AC4)

- **Verifies:** AC4
- **Precondition:** Spy on `computeHeatMapData` import; provide fixture with Alice rolling off (she covers `"java"` on initiative-x)
- **Action:** Call `computeTemporalRiskData` so it processes Q2 rolloff for team-alpha
- **Expected result:** `computeHeatMapData` was called with the post-rolloff roster (Alice removed from team-alpha) to derive coverage; result `postRolloffCoverage["initiative-x"].coveragePct` reflects reduced coverage
- **Edge case:** No

### postRolloffCoverage decreases when sole tag holder rolls off

- **Verifies:** AC4
- **Precondition:** initiative-x requires `"java"`; only Alice (rolls off Q2) holds `"java"` on team-alpha
- **Action:** Call `computeTemporalRiskData` with `nowDate = 2026-01-01`
- **Expected result:** `quarters["Q2-2026"]["team-alpha"].initiatives["initiative-x"].postRolloffCoverage < 100`
- **Edge case:** Yes — sole tag holder edge case

### member with no endDate treated as permanent (not counted in any quarter)

- **Verifies:** AC5
- **Precondition:** Bob has no `endDate` field; all other members have endDates in Q1
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** Bob does NOT appear in any quarter rolloffCount; his skills remain in remainingCount for all 4 quarters
- **Edge case:** No

### member with null endDate treated as permanent

- **Verifies:** AC5
- **Precondition:** Carol has `endDate: null`
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** Carol not in any rolloff count
- **Edge case:** Yes — null vs absent

### retired member excluded from all quarter calculations

- **Verifies:** AC6
- **Precondition:** Dan has `status: "retired"` and `endDate: "2026-03-15"` in Q1 window
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** Dan does NOT appear in Q1 rolloffCount; his skills NOT counted in any teamSize
- **Edge case:** No

### already-rolled-off member (endDate before nowDate) excluded

- **Verifies:** AC6
- **Precondition:** Eve has `endDate: "2025-12-01"` (before `nowDate = 2026-01-01`)
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** Eve absent from all quarters
- **Edge case:** No

### all-rolloffs-zero scenario — no coverageRiskFlag set

- **Verifies:** AC7
- **Precondition:** All roster members have no endDate
- **Action:** Call `computeTemporalRiskData`
- **Expected result:** `coverageRiskFlag === false` for all team-quarter combinations; rolloffCount === 0 for all
- **Edge case:** No

### missing initiative-map — coverage columns omitted

- **Verifies:** AC8
- **Precondition:** No initiative-map.json; teams and roster present
- **Action:** Call `computeTemporalRiskData` with `initiativeMap = null` or `undefined`
- **Expected result:** Response still has quarter/team rolloff counts; `initiatives` key absent or empty for all quarter-team entries
- **Edge case:** No

### _nowOverride accepted in test mode

- **Verifies:** NFR-DATE
- **Precondition:** `NODE_ENV=test`; request includes `?_nowOverride=2026-06-01`
- **Action:** GET /api/intelligence/temporal-risk-data?_nowOverride=2026-06-01 in test mode
- **Expected result:** Quarter windows start at 2026-06-01 (Q1 = June-August 2026); rolloff dates relative to 2026-06-01 are counted correctly
- **Edge case:** No

### _nowOverride rejected in production mode

- **Verifies:** NFR-DATE, NFR-SEC
- **Precondition:** `NODE_ENV=production`; request includes `?_nowOverride=2026-01-01`
- **Action:** GET /api/intelligence/temporal-risk-data?_nowOverride=2026-01-01 in production mode
- **Expected result:** Parameter ignored; quarter windows derived from real `Date.now()`; no error thrown
- **Edge case:** Yes — security/test-mode boundary

### authGuard blocks unauthenticated request to temporal-risk-data endpoint

- **Verifies:** NFR-SEC
- **Precondition:** No session
- **Action:** GET /api/intelligence/temporal-risk-data without auth
- **Expected result:** Non-200 response
- **Edge case:** No

### authGuard blocks unauthenticated request to temporal-risk HTML

- **Verifies:** NFR-SEC
- **Precondition:** No session
- **Action:** GET /intelligence/temporal-risk without auth
- **Expected result:** Non-200 response
- **Edge case:** No

---

## Integration Tests

### GET /api/intelligence/temporal-risk-data at 200-person scale responds within 500ms

- **Verifies:** AC1, NFR-PERF
- **Components involved:** HTTP server, computeTemporalRiskData, computeHeatMapData, fs.readFileSync
- **Precondition:** 200 members across 40 teams; 40 initiatives; `_nowOverride = 2026-01-01`; `NODE_ENV=test`
- **Action:** GET /api/intelligence/temporal-risk-data?_nowOverride=2026-01-01; record elapsed time
- **Expected result:** Status 200; body contains `quarters` with 4 entries; elapsed ≤ 500ms
