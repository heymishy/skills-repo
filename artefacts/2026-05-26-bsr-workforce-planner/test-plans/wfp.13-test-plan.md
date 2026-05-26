# Test Plan: Skill bottleneck analysis — intelligence server

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.13.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | bottlenecks-data JSON — tag universe is union of portfolio requiredTags, not roster skills | 3 tests | 1 test | — | — | — | 🟢 |
| AC2 | bottlenecks-data JSON — skill concentration and coverage scores per team-tag pair | 3 tests | — | — | — | — | 🟢 |
| AC3 | bottlenecks HTML — table/list of teams with bottleneck tags, concentration scores, ownership | 2 tests | — | — | — | — | 🟢 |
| AC4 | bottlenecks HTML — expandable team panel showing full skill inventory (vanilla JS) | 2 tests | — | — | 1 scenario (expand animation) | CSS-layout-dependent | 🟡 |
| AC5 | threshold flag — TEAM_BOTTLENECK_THRESHOLD constant at 3 | 2 tests | — | — | — | — | 🟢 |
| AC6 | missing initiative-map — graceful fallback on GET /intelligence/bottlenecks | — | 1 test | — | — | — | 🟢 |
| AC7 | only teams allocated to at least one initiative included in skill concentration | 2 tests | — | — | — | — | 🟢 |
| NFR-PERF | GET /api/intelligence/bottlenecks-data responds within 300ms at scale | — | 1 test | — | — | — | 🟢 |
| NFR-SEC | Both routes require authGuard; portfolio slug allowlist enforced | 2 tests | — | — | — | — | 🟢 |
| NFR-COMPAT | 1280px viewport — no horizontal scroll | — | — | — | 1 scenario | CSS-layout-dependent | 🔴 RISK-ACCEPT |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable | Handling |
|-----|----|-----------|--------------------|---------|
| Expand/collapse animation CSS | AC4 | CSS-layout-dependent | CSS transitions not computed in Node assertions | Manual scenario 4b 🟡 |
| 1280px horizontal scroll | NFR-COMPAT | CSS-layout-dependent | CSS layout not computed in Node | Manual — RISK-ACCEPT in decisions |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity:** No — fixture uses fake names/teams/skills
**Tags come from portfolio requiredTags, NOT from roster skills** — fixture must have portfolio files with explicit `requiredTags`

### Data requirements per AC

| AC | Data needed | Notes |
|----|-------------|-------|
| AC1 | portfolio/init-x.json (requiredTags), roster.json (members with skills NOT in requiredTags union) | Must prove tags from portfolio, not roster |
| AC2 | Teams with varying skill overlap against portfolio tags; count of unique-tag holders | |
| AC5 | One tag held by exactly 3 people → at threshold; one held by 2 → below threshold | |
| AC7 | Two teams: one allocated (in initiative-map.json), one not | |

---

## Unit Tests

### computeBottlenecksData — tag universe is union of portfolio requiredTags

- **Verifies:** AC1
- **Precondition:** Roster has members with skill `["ux-research"]` not in any portfolio requiredTags; portfolio files have requiredTags `["java", "kafka"]`
- **Action:** Call `computeBottlenecksData(teams, roster, initiativeMap, portfolioFiles)`
- **Expected result:** `tagUniverse` contains `"java"` and `"kafka"`; does NOT contain `"ux-research"` (which only appears in roster skills, not portfolio requiredTags)
- **Edge case:** Yes — critical distinction between tag universe sources

### computeBottlenecksData — tag universe deduplicates across portfolio files

- **Verifies:** AC1
- **Precondition:** Two portfolio files both list `"java"` in requiredTags; one also lists `"scala"`
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `tagUniverse` contains `"java"` once and `"scala"` once (no duplicates)
- **Edge case:** No

### computeBottlenecksData — empty portfolioFiles produces empty tag universe

- **Verifies:** AC1
- **Precondition:** No portfolio files provided
- **Action:** Call `computeBottlenecksData` with empty portfolioFiles
- **Expected result:** `tagUniverse` is `[]`; `teams[].bottleneckTags` is `[]` for all teams
- **Edge case:** Yes — empty input

### computeBottlenecksData — concentration count for team-tag pair

- **Verifies:** AC2
- **Precondition:** team-alpha has 5 members; 2 hold `"java"`; 4 hold `"kafka"`; tag universe includes both
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `teamBottlenecks["team-alpha"]["java"].holderCount === 2`; `teamBottlenecks["team-alpha"]["kafka"].holderCount === 4`
- **Edge case:** No

### computeBottlenecksData — coverage score = holderCount / teamSize

- **Verifies:** AC2
- **Precondition:** team-alpha has 5 members; 2 hold `"java"`
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `teamBottlenecks["team-alpha"]["java"].coveragePct === 40` (i.e. 2/5 × 100 = 40)
- **Edge case:** No

### computeBottlenecksData — zero holders for tag present in universe

- **Verifies:** AC2
- **Precondition:** `"scala"` in tag universe; no member of team-alpha has `"scala"`
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `teamBottlenecks["team-alpha"]["scala"].holderCount === 0`, `coveragePct === 0`
- **Edge case:** Yes — zero case

### bottlenecks HTML contains team rows with bottleneck tags

- **Verifies:** AC3
- **Precondition:** Server running; team-alpha is allocated; has bottleneck tags
- **Action:** GET /intelligence/bottlenecks (authenticated); parse HTML
- **Expected result:** HTML contains table/list rows with team names and their bottleneck tags listed; no external CDN
- **Edge case:** No

### bottlenecks HTML shows ownership context (allocated initiatives per team)

- **Verifies:** AC3
- **Precondition:** team-alpha allocated to `initiative-x`
- **Action:** GET /intelligence/bottlenecks
- **Expected result:** HTML contains `initiative-x` associated with team-alpha
- **Edge case:** No

### bottlenecks HTML contains expandable team panel structure

- **Verifies:** AC4
- **Precondition:** Server running; team-alpha has 3 members with various skills
- **Action:** GET /intelligence/bottlenecks; inspect HTML structure
- **Expected result:** HTML contains a toggle button/element with `data-team-id` or equivalent; hidden panel for team-alpha with member skill list; no `<script src="http` external CDN references
- **Edge case:** No

### expandable panel toggle function changes display state

- **Verifies:** AC4
- **Precondition:** Extract inline JS toggle function from HTML
- **Action:** Invoke toggle function with team-alpha id; check panel element display property
- **Expected result:** Panel display changes from hidden to visible (e.g. `display: none` removed or class changed to active)
- **Edge case:** No

### TEAM_BOTTLENECK_THRESHOLD — tag held by ≤3 people flagged as bottleneck

- **Verifies:** AC5
- **Precondition:** `"java"` held by exactly 3 members of team-alpha (team size 10) → at threshold
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `"java"` appears in `team-alpha.bottleneckTags` (or equivalent bottleneck-flagged collection)
- **Edge case:** Yes — boundary at threshold

### TEAM_BOTTLENECK_THRESHOLD — tag held by 4 people NOT flagged as bottleneck

- **Verifies:** AC5
- **Precondition:** `"kafka"` held by 4 members of team-alpha
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `"kafka"` NOT in `team-alpha.bottleneckTags`
- **Edge case:** Yes — just above threshold

### unallocated teams excluded from skill concentration

- **Verifies:** AC7
- **Precondition:** team-beta not in any initiative-map allocation; team-alpha is allocated
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `teamBottlenecks` does NOT contain a key for `team-beta`
- **Edge case:** No

### team with zero initiative allocations excluded

- **Verifies:** AC7
- **Precondition:** team-gamma listed in teams.json but assigned to 0 initiatives
- **Action:** Call `computeBottlenecksData`
- **Expected result:** `team-gamma` absent from bottleneck output
- **Edge case:** Yes — zero allocation case

### authGuard blocks unauthenticated request to bottlenecks-data endpoint

- **Verifies:** NFR-SEC
- **Precondition:** Request with no session cookie
- **Action:** GET /api/intelligence/bottlenecks-data without auth
- **Expected result:** Non-200 response (redirect or 401); no data in body
- **Edge case:** No

### authGuard blocks unauthenticated request to bottlenecks HTML

- **Verifies:** NFR-SEC
- **Precondition:** Request with no session
- **Action:** GET /intelligence/bottlenecks without auth
- **Expected result:** Non-200 response; no data in body
- **Edge case:** No

---

## Integration Tests

### GET /api/intelligence/bottlenecks-data returns 200 with full shape at 40-initiative scale

- **Verifies:** AC1, AC2, NFR-PERF
- **Components involved:** HTTP server, computeBottlenecksData, fs.readFileSync
- **Precondition:** 40 teams, 200-person roster, 40 initiatives, 40 portfolio files (generated in temp dir)
- **Action:** GET /api/intelligence/bottlenecks-data (authenticated); record elapsed time
- **Expected result:** Status 200; body has `tagUniverse`, `teamBottlenecks`; elapsed ≤ 300ms

### GET /intelligence/bottlenecks returns 200 HTML with graceful fallback when initiative-map.json absent

- **Verifies:** AC6
- **Components involved:** HTTP server, fs.readFileSync (absent file)
- **Precondition:** No initiative-map.json in workforce dir
- **Action:** GET /intelligence/bottlenecks (authenticated)
- **Expected result:** Status 200; HTML contains graceful message about missing allocation map
