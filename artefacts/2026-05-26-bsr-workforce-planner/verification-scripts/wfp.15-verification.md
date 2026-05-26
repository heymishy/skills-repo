# AC Verification Script — wfp.15 Scenario modelling

**Story:** wfp.15
**Run context:** After implementation, before PR
**Estimated duration:** ~6 minutes (excluding scale test)
**Test file:** `tests/workforce/check-wfp15-scenarios.js`
**Key invariant:** Each overlay in a `scenarios[]` array is applied to a FRESH COPY of the on-disk baseline — NOT chained. This must be verified explicitly (Scenario 7).

---

## Pre-conditions

- Intelligence server starts without crashing
- `computeHeatMapData`, `computeBottlenecksData`, `computeTemporalRiskData` exports DoD-complete (wfp.12, wfp.13, wfp.14)
- `workforce/teams.json`, `workforce/roster.json`, `workforce/initiative-map.json` exist

---

## Scenario 1 — Type validation

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario type-validation
```

**Steps:**
1. POST with `type: "hire"`, `"departure"`, `"new-team"`, `"reallocation"` → all should reach processing
2. POST with `type: "mass-hire"` → expect 400

**Expected:**
- Valid types: status 200
- Unknown type: status 400 with message containing "unknown scenario type" or equivalent

**Pass/Fail indicator:** `[wfp.15-AC1] PASS` or `[wfp.15-AC1] FAIL: <reason>`

---

## Scenario 2 — Hire overlay

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario hire
```

**Steps:**
1. Fixture: team-alpha 5 members, initiative-x requires `"golang"` (no current holder)
2. POST `{ type: "hire", teamId: "team-alpha", member: { name: "New Hire", skills: ["golang"] } }`

**Expected:**
- Status 200
- `result.teams["team-alpha"].members.length === 6`
- `result.heatMapData.cells["golang|initiative-x"].covered === true`
- On-disk `teams.json` unchanged (read timestamp same as before request)

**Pass/Fail indicator:** `[wfp.15-AC2] PASS` or `[wfp.15-AC2] FAIL: <reason>`

---

## Scenario 3 — Departure overlay

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario departure
```

**Steps:**
1. Fixture: Bob (id: bob-jones) sole `"java"` holder on team-alpha; initiative-x requires `"java"`
2. POST `{ type: "departure", teamId: "team-alpha", memberId: "bob-jones" }`

**Expected:**
- Status 200
- Bob absent from team-alpha members
- `result.heatMapData.cells["java|initiative-x"].covered === false`

**Step 3b:** POST with non-existent `memberId: "ghost-person"`

**Expected:**
- Status 422; error mentions `"ghost-person"`

**Pass/Fail indicator:** `[wfp.15-AC3] PASS` or `[wfp.15-AC3] FAIL: <reason>`

---

## Scenario 4 — New-team overlay

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario new-team
```

**Steps:**
1. POST `{ type: "new-team", team: { teamId: "team-gamma", name: "Team Gamma", members: [...] } }`

**Expected:**
- Status 200
- `result.teams["team-gamma"]` present
- Existing teams unchanged

**Step 4b:** POST with `teamId: "team-alpha"` (existing)

**Expected:**
- Status 422; error mentions duplicate team id

**Pass/Fail indicator:** `[wfp.15-AC4] PASS` or `[wfp.15-AC4] FAIL: <reason>`

---

## Scenario 5 — Reallocation overlay

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario reallocation
```

**Steps:**
1. POST `{ type: "reallocation", memberId: "bob-jones", fromTeamId: "team-alpha", toTeamId: "team-beta" }`

**Expected:**
- Status 200
- Bob absent from team-alpha; present in team-beta

**Step 5b:** POST with `fromTeamId: "team-gamma"` (Bob not in team-gamma)

**Expected:**
- Status 422; error mentions memberId and fromTeamId

**Pass/Fail indicator:** `[wfp.15-AC5] PASS` or `[wfp.15-AC5] FAIL: <reason>`

---

## Scenario 6 — HTML form structure

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario html-form
```

**Steps:**
1. GET /intelligence/scenarios (authenticated); parse HTML

**Expected:**
- Status 200
- HTML has type selector with all 4 types
- Form fields for teamId, member parameters
- No external CDN; no `<script src="http`
- Nav link `<a href="/workforce-chat">` present

**Pass/Fail indicator:** `[wfp.15-AC6] PASS` or `[wfp.15-AC6] FAIL: <reason>`

---

## Scenario 7 — Independent overlays (critical)

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario independent-overlays
```

**Steps:**
1. POST `{ scenarios: [ hire-Carol, departure-Bob ] }` (two separate scenario items)
2. Check: result[0] (hire) does NOT include departure of Bob
3. Check: result[1] (departure) does NOT include new hire Carol
4. Check: both results derived from fresh on-disk baseline

**Expected:**
- `result.scenarios[0].teams["team-alpha"].members` includes Carol; includes Bob (departure not applied)
- `result.scenarios[1].teams["team-alpha"].members` does NOT include Bob; does NOT include Carol (hire not applied)
- `result.scenarios.length === 2`

**Pass/Fail indicator:** `[wfp.15-AC7] PASS` or `[wfp.15-AC7] FAIL: cascading/chaining detected`

---

## Scenario 8 — No file writes

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario no-writes
```

**Steps:**
1. Note last-modified timestamp of `workforce/roster.json` before request
2. POST valid hire scenario
3. Read last-modified timestamp after request

**Expected:**
- `roster.json` mtime unchanged (no write occurred)
- `teams.json` mtime unchanged
- Status 200

**Pass/Fail indicator:** `[wfp.15-AC8] PASS` or `[wfp.15-AC8] FAIL: file was modified`

---

## Scenario 9 — Auth guard + security

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario auth-security
```

**Steps:**
1. GET /intelligence/scenarios — no session → expect non-200
2. POST /api/intelligence/scenario — no session → expect non-200
3. POST with 65KB+ body → expect 413
4. POST departure with non-existent memberId; check response body contains no filesystem paths

**Expected:**
- Steps 1, 2: non-200
- Step 3: 413
- Step 4: error message contains memberId; does NOT contain `/`, `../`, `workforce/`

**Pass/Fail indicator:** `[wfp.15-SEC] PASS` or `[wfp.15-SEC] FAIL: <reason>`

---

## Scenario 10 — Scale performance

**Command:**
```bash
node tests/workforce/check-wfp15-scenarios.js --scenario scale-perf
```

**Steps:**
1. 200-person roster, 40 teams, 40 initiatives
2. POST single hire scenario; record time

**Expected:** Elapsed ≤ 1000ms

**Pass/Fail indicator:** `[wfp.15-NFR-PERF] PASS` or `[wfp.15-NFR-PERF] FAIL: <elapsed>ms`

---

## Scenario 11 — Compatibility: 1280px (manual — RISK-ACCEPT)

⚠️ **Manual — RISK-ACCEPT logged in decisions.md.**

1. Open `/intelligence/scenarios` at 1280px viewport
2. Check no horizontal scrollbar

**Outcome:** Record PASS / FAIL.

---

## Summary

```
Automated scenarios: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
Manual scenarios: 11 (RISK-ACCEPT)
All automated scenarios must PASS before opening PR.
Scenario 7 (independent overlays) is the highest-risk check — verify carefully.
```
