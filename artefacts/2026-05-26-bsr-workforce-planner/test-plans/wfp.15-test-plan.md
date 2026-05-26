# Test Plan: Scenario modelling — intelligence server

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.15.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27
**Prerequisite note:** Tests for AC4–AC7 (overlay computation with computeHeatMapData, computeBottlenecksData, computeTemporalRiskData) depend on those exports being DoD-complete (wfp.12, wfp.13, wfp.14).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | POST /api/intelligence/scenario validates type — reject unknown types | 2 tests | — | — | — | — | 🟢 |
| AC2 | hire scenario overlay — adds member to team copy, recomputes intelligence | 3 tests | — | — | — | — | 🟢 |
| AC3 | departure scenario overlay — removes member from team copy, error if not found | 3 tests | — | — | — | — | 🟢 |
| AC4 | new-team scenario overlay — adds team to copy, error if team already exists | 3 tests | — | — | — | — | 🟢 |
| AC5 | reallocation scenario overlay — moves member between teams, error if not allocated | 3 tests | — | — | — | — | 🟢 |
| AC6 | scenarios HTML — form to input scenario parameters with type selector | 2 tests | — | — | — | — | 🟢 |
| AC7 | combined scenarios array — each overlay applied independently against fresh baseline | 3 tests | — | — | — | — | 🟢 |
| AC8 | read-only guarantee — no file writes after POST /api/intelligence/scenario | 2 tests | — | — | — | — | 🟢 |
| NFR-SEC | authGuard both routes; body size ≤ 64KB; no file paths in warnings | 3 tests | — | — | — | — | 🟢 |
| NFR-PERF | POST /api/intelligence/scenario responds within 1s for single scenario | — | 1 test | — | — | — | 🟢 |
| NFR-COMPAT | 1280px viewport — no horizontal scroll on scenarios page | — | — | — | 1 scenario | CSS-layout-dependent | 🔴 RISK-ACCEPT |

---

## Coverage gaps

| Gap | AC | Gap type | Handling |
|-----|----|-----------|---------| 
| 1280px horizontal scroll | NFR-COMPAT | CSS-layout-dependent | RISK-ACCEPT in decisions |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**Isolation:** Each test creates its own in-memory roster/teams/initiative-map deep copy so overlays do not bleed between tests
**Key invariant to test:** `AC7 — independent overlays` means each scenario in a `scenarios[]` array is applied to a FRESH COPY of the on-disk baseline, not the result of the previous scenario

---

## Unit Tests

### POST body type validation — accept valid scenario types

- **Verifies:** AC1
- **Precondition:** POST body has `type: "hire"` (valid)
- **Action:** Call route handler with each valid type: `hire`, `departure`, `new-team`, `reallocation`
- **Expected result:** No 400 response for any valid type; processing continues
- **Edge case:** No

### POST body type validation — reject unknown type with 400

- **Verifies:** AC1
- **Precondition:** POST body has `type: "mass-hire"` (unknown)
- **Action:** Call route handler
- **Expected result:** HTTP 400; response body contains `"unknown scenario type"` or similar message; no computation performed
- **Edge case:** No

### hire scenario — adds new member to the target team copy

- **Verifies:** AC2
- **Precondition:** Baseline has team-alpha with 5 members; POST body: `{ type: "hire", teamId: "team-alpha", member: { name: "Alice New", skills: ["java"] } }`
- **Action:** POST /api/intelligence/scenario
- **Expected result:** Response `result.teams["team-alpha"].members.length === 6`; new member present; original on-disk baseline unchanged
- **Edge case:** No

### hire scenario — recomputes heat-map data with new member included

- **Verifies:** AC2
- **Precondition:** initiative-x requires `"golang"`; no existing team member has it; new hire has `skills: ["golang"]`
- **Action:** POST /api/intelligence/scenario with hire overlay
- **Expected result:** `result.heatMapData.cells["golang|initiative-x"].covered === true`
- **Edge case:** No

### hire scenario — post-hire team absent from bottleneck list for that tag

- **Verifies:** AC2
- **Precondition:** `"golang"` held by 3 people in team-alpha (at TEAM_BOTTLENECK_THRESHOLD); new hire also has `"golang"` → 4 holders → not a bottleneck
- **Action:** POST hire scenario
- **Expected result:** `result.bottlenecksData.teamBottlenecks["team-alpha"]["golang"]` either absent from bottleneckTags or flagged as not-bottleneck
- **Edge case:** Yes — threshold boundary after hire

### departure scenario — removes named member from team copy

- **Verifies:** AC3
- **Precondition:** Bob (id: "bob-jones") is in team-alpha; POST body: `{ type: "departure", teamId: "team-alpha", memberId: "bob-jones" }`
- **Action:** POST /api/intelligence/scenario
- **Expected result:** `result.teams["team-alpha"].members` does not contain Bob; other members present; original on-disk baseline unchanged
- **Edge case:** No

### departure scenario — recomputes intelligence with member removed

- **Verifies:** AC3
- **Precondition:** Bob is the sole `"java"` holder on team-alpha; initiative-x requires `"java"`
- **Action:** POST departure scenario for Bob
- **Expected result:** `result.heatMapData.cells["java|initiative-x"].covered === false`; `result.temporalRiskData` reflects reduced coverage
- **Edge case:** No

### departure scenario — error 422 when member not found

- **Verifies:** AC3
- **Precondition:** POST body: `{ type: "departure", teamId: "team-alpha", memberId: "nonexistent-person" }`
- **Action:** POST /api/intelligence/scenario
- **Expected result:** HTTP 422; error message contains member id; no file writes; no server crash
- **Edge case:** Yes — invalid input

### new-team scenario — adds team to teams copy

- **Verifies:** AC4
- **Precondition:** POST body: `{ type: "new-team", team: { teamId: "team-gamma", name: "Team Gamma", members: [] } }`
- **Action:** POST /api/intelligence/scenario
- **Expected result:** `result.teams["team-gamma"]` present; existing teams unchanged; original on-disk baseline unchanged
- **Edge case:** No

### new-team scenario — with members, recomputes bottlenecks including new team

- **Verifies:** AC4
- **Precondition:** New team has 5 members; 2 hold `"java"` (below bottleneck threshold); `"java"` in tag universe
- **Action:** POST new-team scenario
- **Expected result:** `result.bottlenecksData.teamBottlenecks` contains `"team-gamma"` with `"java"` holderCount = 2
- **Edge case:** No

### new-team scenario — error 422 when teamId already exists

- **Verifies:** AC4
- **Precondition:** POST body: `{ type: "new-team", team: { teamId: "team-alpha" } }` (team-alpha already exists)
- **Action:** POST /api/intelligence/scenario
- **Expected result:** HTTP 422; error message contains duplicate team id; no computation
- **Edge case:** Yes — duplicate team

### reallocation scenario — moves member from source team to target team

- **Verifies:** AC5
- **Precondition:** Bob in team-alpha; POST body: `{ type: "reallocation", memberId: "bob-jones", fromTeamId: "team-alpha", toTeamId: "team-beta" }`
- **Action:** POST /api/intelligence/scenario
- **Expected result:** Bob absent from team-alpha; Bob present in team-beta; total member count unchanged
- **Edge case:** No

### reallocation scenario — recomputes intelligence with member in new team

- **Verifies:** AC5
- **Precondition:** Bob (sole `"java"` holder) reallocated from team-alpha to team-beta; initiative-y allocated to team-beta and requires `"java"`
- **Action:** POST reallocation scenario
- **Expected result:** `result.heatMapData.cells["java|initiative-y"].covered === true`; `cells["java|initiative-x"].covered === false` (Alice's old initiative, assuming initiative-x only allocated to team-alpha)
- **Edge case:** No

### reallocation scenario — error 422 when member not allocated to fromTeamId

- **Verifies:** AC5
- **Precondition:** Bob is in team-alpha; POST body has `fromTeamId: "team-gamma"` (Bob not in team-gamma)
- **Action:** POST /api/intelligence/scenario
- **Expected result:** HTTP 422; error message contains member id and fromTeamId; no computation
- **Edge case:** Yes — invalid input

### scenarios HTML contains form with type selector and input fields

- **Verifies:** AC6
- **Precondition:** GET /intelligence/scenarios (authenticated)
- **Action:** GET /intelligence/scenarios; parse HTML
- **Expected result:** HTML contains a `<select>` or radio group with `hire`, `departure`, `new-team`, `reallocation` options; contains appropriate input fields (e.g. teamId, member skills); no external CDN
- **Edge case:** No

### scenarios HTML form submission uses POST /api/intelligence/scenario

- **Verifies:** AC6
- **Precondition:** GET /intelligence/scenarios
- **Action:** Parse HTML; check form action and method
- **Expected result:** Form action is `/api/intelligence/scenario` (or AJAX POST via inline JS); method is POST
- **Edge case:** No

### combined scenarios — each overlay applied to fresh baseline

- **Verifies:** AC7
- **Precondition:** POST body: `{ scenarios: [ { type: "hire", teamId: "team-alpha", member: {...} }, { type: "departure", teamId: "team-alpha", memberId: "bob-jones" } ] }`
- **Action:** POST /api/intelligence/scenario
- **Expected result:** Result has two independent computation outputs — one for hire overlay, one for departure overlay; hire result does NOT include the departed Bob; departure result does NOT include the new hire; each applied to fresh baseline
- **Edge case:** Yes — critical independence invariant

### combined scenarios — hire followed by hire (two separate hires, each from baseline)

- **Verifies:** AC7
- **Precondition:** POST body: `{ scenarios: [ hire-Alice, hire-Bob ] }` (two separate hire scenarios)
- **Action:** POST /api/intelligence/scenario
- **Expected result:** Result[0] shows baseline + Alice only (not Bob); Result[1] shows baseline + Bob only (not Alice); baseline has neither
- **Edge case:** Yes — key distinction from chained evaluation

### combined scenarios — results array length matches scenarios array length

- **Verifies:** AC7
- **Precondition:** POST body with 3 scenarios
- **Action:** POST /api/intelligence/scenario
- **Expected result:** `result.scenarios.length === 3`
- **Edge case:** No

### no file writes after POST — spy on fs.writeFileSync

- **Verifies:** AC8
- **Precondition:** Spy on `fs.writeFileSync` and `fs.writeFile`
- **Action:** POST /api/intelligence/scenario with valid hire body
- **Expected result:** `fs.writeFileSync` was never called during the request; `fs.writeFile` was never called; response 200
- **Edge case:** No

### no file writes on error path (422 for unknown type)

- **Verifies:** AC8
- **Precondition:** Spy on `fs.writeFileSync`; POST body has unknown type
- **Action:** POST /api/intelligence/scenario
- **Expected result:** `fs.writeFileSync` never called; HTTP 400/422 returned
- **Edge case:** No

### authGuard blocks unauthenticated GET /intelligence/scenarios

- **Verifies:** NFR-SEC
- **Precondition:** No session
- **Action:** GET /intelligence/scenarios without auth
- **Expected result:** Non-200 response
- **Edge case:** No

### authGuard blocks unauthenticated POST /api/intelligence/scenario

- **Verifies:** NFR-SEC
- **Precondition:** No session
- **Action:** POST /api/intelligence/scenario without auth
- **Expected result:** Non-200 response
- **Edge case:** No

### body size limit — 413 for request body exceeding 64KB

- **Verifies:** NFR-SEC
- **Precondition:** POST body is 65KB+ (e.g. large skills arrays)
- **Action:** POST /api/intelligence/scenario
- **Expected result:** HTTP 413 (request entity too large)
- **Edge case:** Yes — security boundary

### warning messages contain no file paths

- **Verifies:** NFR-SEC
- **Precondition:** Departure scenario with non-existent memberId
- **Action:** POST /api/intelligence/scenario; check response body
- **Expected result:** Error message contains memberId (from request body); does NOT contain any filesystem path (no `/workforce/`, `../`, absolute paths)
- **Edge case:** Yes — security constraint

---

## Integration Tests

### POST /api/intelligence/scenario for hire responds within 1s at 200-person scale

- **Verifies:** NFR-PERF
- **Components involved:** HTTP server, computeHeatMapData, computeBottlenecksData, computeTemporalRiskData
- **Precondition:** 200-person roster, 40 teams, 40 initiatives; single hire scenario
- **Action:** POST /api/intelligence/scenario; record elapsed time
- **Expected result:** Status 200; elapsed ≤ 1000ms
