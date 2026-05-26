# AC Verification Script — wfp.13 Skill bottleneck analysis

**Story:** wfp.13
**Run context:** After implementation, before PR
**Estimated duration:** ~4 minutes (excluding scale test)
**Test file:** `tests/workforce/check-wfp13-bottlenecks.js`

---

## Pre-conditions

- Intelligence server starts without crashing
- `computeBottlenecksData` exported from shared module
- `workforce/teams.json`, `workforce/roster.json`, `workforce/initiative-map.json` exist

---

## Scenario 1 — Tag universe from portfolio, not roster

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario tag-universe
```

**Steps:**
1. Load fixture: roster member has skill `"ux-research"` not in any portfolio file; portfolio files have requiredTags `["java", "kafka"]`
2. Call `computeBottlenecksData`

**Expected:**
- `tagUniverse` includes `"java"` and `"kafka"`
- `tagUniverse` does NOT include `"ux-research"`

**Pass/Fail indicator:** `[wfp.13-AC1] PASS` or `[wfp.13-AC1] FAIL: <reason>`

---

## Scenario 2 — Concentration and coverage scores

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario scores
```

**Steps:**
1. Fixture: team-alpha (10 members), 2 hold `"java"` → holderCount=2, coveragePct=20
2. Call `computeBottlenecksData`; read `teamBottlenecks["team-alpha"]["java"]`

**Expected:**
- `holderCount === 2`
- `coveragePct === 20`

**Pass/Fail indicator:** `[wfp.13-AC2] PASS` or `[wfp.13-AC2] FAIL: <reason>`

---

## Scenario 3 — Bottlenecks HTML structure

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario html-structure
```

**Steps:**
1. GET /intelligence/bottlenecks (authenticated) with fixture
2. Assert HTML structure

**Expected:**
- Status 200
- HTML contains team name rows with bottleneck tags
- HTML contains initiative ownership context per team
- No external CDN links
- Nav link `<a href="/workforce-chat">` present

**Pass/Fail indicator:** `[wfp.13-AC3] PASS` or `[wfp.13-AC3] FAIL: <reason>`

---

## Scenario 4a — Expandable team panel structure

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario expand-structure
```

**Steps:**
1. GET /intelligence/bottlenecks; inspect HTML for toggle mechanism
2. Assert panel element presence and inline JS toggle function

**Expected:**
- Toggle button or element present for each team
- Hidden panel with member skill list present in HTML
- Toggle function changes display on invocation

**Pass/Fail indicator:** `[wfp.13-AC4] PASS` or `[wfp.13-AC4] FAIL: <reason>`

---

## Scenario 4b — Expand animation (manual — CSS-layout-dependent)

⚠️ **Manual step — CSS-layout-dependent.**

1. Start `npm run workforce`
2. Open browser at `/intelligence/bottlenecks`
3. Click a team expand button
4. Verify: panel expands smoothly; team member skills visible in expanded panel

**Outcome:** Record PASS / FAIL.

---

## Scenario 5 — TEAM_BOTTLENECK_THRESHOLD boundary

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario threshold
```

**Steps:**
1. Fixture: `"java"` held by 3 people → flagged; `"kafka"` held by 4 people → not flagged
2. Call `computeBottlenecksData`; read bottleneck flags

**Expected:**
- `"java"` in bottleneckTags for the team
- `"kafka"` NOT in bottleneckTags

**Pass/Fail indicator:** `[wfp.13-AC5] PASS` or `[wfp.13-AC5] FAIL: <reason>`

---

## Scenario 6 — Missing initiative-map graceful fallback

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario missing-map
```

**Steps:**
1. No `initiative-map.json` in workforce dir
2. GET /intelligence/bottlenecks (authenticated)

**Expected:**
- Status 200
- HTML contains graceful message

**Pass/Fail indicator:** `[wfp.13-AC6] PASS` or `[wfp.13-AC6] FAIL: <reason>`

---

## Scenario 7 — Unallocated teams excluded

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario unallocated-excluded
```

**Steps:**
1. Fixture: team-alpha allocated to initiative-x; team-beta not in initiative-map.json
2. Call `computeBottlenecksData`

**Expected:**
- team-beta absent from `teamBottlenecks`
- team-alpha present in `teamBottlenecks`

**Pass/Fail indicator:** `[wfp.13-AC7] PASS` or `[wfp.13-AC7] FAIL: <reason>`

---

## Scenario 8 — Auth guard on both routes

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario auth-guard
```

**Steps:**
1. GET /api/intelligence/bottlenecks-data — no session
2. GET /intelligence/bottlenecks — no session

**Expected:** Both return non-200

**Pass/Fail indicator:** `[wfp.13-SEC] PASS` or `[wfp.13-SEC] FAIL: <reason>`

---

## Scenario 9 — Scale performance (SKIP_SCALE_TESTS=1 to skip)

**Command:**
```bash
node tests/workforce/check-wfp13-bottlenecks.js --scenario scale-perf
```

**Steps:**
1. 40 teams, 200-person roster, 40 initiatives, 40 portfolio files
2. GET /api/intelligence/bottlenecks-data; record time

**Expected:** Elapsed ≤ 300ms

**Pass/Fail indicator:** `[wfp.13-NFR-PERF] PASS` or `[wfp.13-NFR-PERF] FAIL: <elapsed>ms`

---

## Scenario 10 — Compatibility: 1280px (manual — RISK-ACCEPT)

⚠️ **Manual — RISK-ACCEPT logged in decisions.md.**

1. Open `/intelligence/bottlenecks` at 1280px viewport
2. Check no horizontal scrollbar

**Outcome:** Record PASS / FAIL.

---

## Summary

```
Automated scenarios: 1, 2, 3, 4a, 5, 6, 7, 8, 9
Manual scenarios: 4b (expand animation), 10 (RISK-ACCEPT)
All automated scenarios must PASS before opening PR.
```
