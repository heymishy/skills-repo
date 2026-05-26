# AC Verification Script — wfp.12 Skill coverage heat map

**Story:** wfp.12
**Run context:** After implementation is complete, before opening PR
**Estimated duration:** ~5 minutes (excluding scale test)
**Test file:** `tests/workforce/check-wfp12-heat-map.js`

---

## Pre-conditions

- `npm run workforce` starts the intelligence server on a test port (e.g. 3002) without crashing
- `workforce/teams.json`, `workforce/roster.json`, `workforce/initiative-map.json` exist (real or fixture)
- `src/workforce-ui/server.js` exports or is startable in test mode

---

## Scenario 1 — JSON endpoint returns required shape

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario json-shape
```

**Steps:**
1. Start server in test mode, mock fs.readFileSync with fixture data
2. Issue GET /api/intelligence/heat-map-data with authenticated session
3. Parse JSON response

**Expected:**
- Status 200
- Body has top-level keys: `tags`, `initiatives`, `cells`, `coverageByInitiative`, `coverageByProductGroup`
- `tags` is an array of strings sorted alphabetically
- `initiatives` is an array of strings (initiative slugs)
- `cells` is an object keyed by `"tag|initiative"` pairs

**Pass/Fail indicator:** `[wfp.12-AC1] PASS` or `[wfp.12-AC1] FAIL: <reason>`

---

## Scenario 2a — HTML endpoint returns valid grid

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario html-structure
```

**Steps:**
1. Start server in test mode with fixture data
2. GET /intelligence/heat-map with authenticated session
3. Check response HTML string

**Expected:**
- Status 200
- Response is HTML (`Content-Type: text/html`)
- Contains a grid/table element with header row containing initiative names
- Contains row labels with tag names
- No external CDN script or CSS (`<script src="http` absent)
- Nav link `<a href="/workforce-chat">` present

**Pass/Fail indicator:** `[wfp.12-AC2] PASS` or `[wfp.12-AC2] FAIL: <reason>`

---

## Scenario 2b — Visual colour rendering (manual)

⚠️ **Manual step — CSS-layout-dependent.** Cannot be automated in Node assertions.

1. Start `npm run workforce`
2. Open browser at `http://localhost:<port>/intelligence/heat-map` (logged in)
3. Verify:
   - Fully covered cells (100% tag coverage) show a filled/green indicator
   - Zero-coverage cells show an unfilled/grey indicator
   - Partial coverage cells show intermediate shading
   - Initiatives with `missingPortfolioFile: true` show a striped or hatched column header

**Outcome:** Record PASS / FAIL with screenshot in PR comment.

---

## Scenario 3 — Cell drill-down panel

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario drill-down
```

**Steps:**
1. Get heat-map HTML and extract onclick handler JavaScript
2. Invoke handler with a covered cell coordinate; capture rendered panel HTML
3. Invoke handler with an uncovered cell coordinate

**Expected:**
- Covered cell: panel contains member names, skill list; no "No allocated team member" message
- Uncovered cell: panel contains "No allocated team member holds this tag"; shows allocated team members and their skills

**Pass/Fail indicator:** `[wfp.12-AC3] PASS` or `[wfp.12-AC3] FAIL: <reason>`

---

## Scenario 4 — Initiative filter

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario filter
```

**Steps:**
1. Get heat-map HTML with 2 product groups in fixture
2. Invoke filter function for product group A
3. Check which initiative columns are visible; check tag rows

**Expected:**
- Initiatives in product group B are hidden (display:none or removed)
- Initiatives in product group A are visible
- Tag rows (count) unchanged

**Pass/Fail indicator:** `[wfp.12-AC4] PASS` or `[wfp.12-AC4] FAIL: <reason>`

---

## Scenario 5 — Missing initiative-map graceful fallback

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario missing-map
```

**Steps:**
1. Start server with `initiative-map.json` absent (temp dir without it)
2. GET /intelligence/heat-map (authenticated)

**Expected:**
- Status 200
- Body HTML contains a message indicating no allocation map found (e.g. "No allocation map" or "run workforce-map")

**Pass/Fail indicator:** `[wfp.12-AC5] PASS` or `[wfp.12-AC5] FAIL: <reason>`

---

## Scenario 6 — Missing portfolio file → vacuous coverage + warning flag

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario missing-portfolio
```

**Steps:**
1. initiative-map.json has slug `no-portfolio-initiative` with no corresponding `portfolio/no-portfolio-initiative.json`
2. Call `computeHeatMapData` with this fixture
3. Check `coverageByInitiative["no-portfolio-initiative"]`

**Expected:**
- `missingPortfolioFile === true`
- `coveragePct === 100` (vacuous)
- `requiredCount === 0`
- Warning written to stderr containing the slug

**Pass/Fail indicator:** `[wfp.12-AC6] PASS` or `[wfp.12-AC6] FAIL: <reason>`

---

## Scenario 7 — Auth guard on both routes

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario auth-guard
```

**Steps:**
1. Issue GET /api/intelligence/heat-map-data with no session cookie
2. Issue GET /intelligence/heat-map with no session cookie

**Expected:**
- Both responses are non-200 (302 redirect or 401)
- No JSON data or HTML grid in response body

**Pass/Fail indicator:** `[wfp.12-SEC] PASS` or `[wfp.12-SEC] FAIL: <reason>`

---

## Scenario 8 — Scale performance (SKIP_SCALE_TESTS=1 to skip)

**Command:**
```bash
node tests/workforce/check-wfp12-heat-map.js --scenario scale-perf
```

**Steps:**
1. Generate in-memory fixture: 40 teams, 200-person roster, 40 initiatives, 40 portfolio files
2. Write to temp dir
3. GET /api/intelligence/heat-map-data; record time

**Expected:**
- Elapsed ≤ 500ms

**Pass/Fail indicator:** `[wfp.12-NFR-PERF] PASS` or `[wfp.12-NFR-PERF] FAIL: <elapsed>ms`

---

## Scenario 9 — Compatibility: 1280px no horizontal scroll (manual — RISK-ACCEPT)

⚠️ **Manual step — CSS-layout-dependent. RISK-ACCEPT logged in decisions.md.**

1. Open browser at `http://localhost:<port>/intelligence/heat-map` (logged in)
2. Set browser viewport to exactly 1280px wide
3. Load heat map with ≤20 initiatives

**Expected:** No horizontal scrollbar appears on the main content area.

**Outcome:** Record PASS / FAIL with screenshot.

---

## Summary

```
Automated scenarios: 1, 2a, 3, 4, 5, 6, 7, 8
Manual scenarios: 2b (visual colour), 9 (RISK-ACCEPT)
All automated scenarios must PASS before opening PR.
Manual scenarios recorded in PR comment.
```
