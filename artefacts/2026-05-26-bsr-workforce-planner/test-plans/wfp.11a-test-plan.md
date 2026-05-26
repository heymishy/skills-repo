# Test Plan — wfp.11a: Interactive allocation assignment UI — server routes and initiative-centric view

**Story:** wfp.11a
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**Review:** PASS — wfp.11a run 1, 0 HIGH findings; 1-M1 MEDIUM (H-E2E trigger — Playwright E2E tests specified below); 1-L1 LOW (spawn path — specified in DoR contract)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | GET /workforce route registered; authGuard + handleGetWorkforceHtml called; 200 text/html | ✅ | — | — | — | None | Low |
| AC2 | GET /workforce/data returns correct JSON shape; missing files return null; path traversal slugs omitted | ✅ | — | — | — | None | Low |
| AC3 | POST /workforce/allocations: valid → 200 + atomic write; invalid JSON → 400; write fail → 500 | ✅ | — | — | — | None | Low |
| AC4 | Initiative-centric view default on load; list shows slug/product-group/allocation-status; filter controls; selecting initiative shows detail | — | — | ✅ | — | None | Low |
| AC5 | Add/remove assignee staged in memory; allocation mode selector; net-new reveals fields; no disk write until save | — | — | ✅ | — | None | Low |
| AC8 | Candidates ranked by skill-tag score; % displayed; "No tag match" separator for 0-score candidates | — | — | ✅ | — | None | Low |
| AC9 | Save button POSTs to /workforce/allocations; 200 → banner dismissed, staged state becomes baseline; non-200 → error shown; button disabled in-flight | — | — | ✅ | — | None | Low |
| AC10 | Run workforce-map button POSTs /workforce/run-map; server spawns script; returns exitCode+output; UI renders output block | ✅ | — | ✅ | — | None | Low |
| AC11 | Unsaved changes banner shown after staging; dismissed only on successful save | — | — | ✅ | — | None | Low |
| AC12 | _autoderived:true or _reviewRequired:true → Draft badge shown; badge removed after explicit edit+save | — | — | ✅ | — | None | Low |
| AC13 | allocationInput pre-populated on load; initiative shows "fully assigned" / "partially assigned" from loaded data | — | — | ✅ | — | None | Low |
| AC14 | Path traversal slug rejected; no file read attempted; warning logged to stderr | ✅ | — | — | — | None | Low |
| AC15 | POST /workforce/run-map route registered; first-class else-if branch; authGuard applied; handler called | ✅ | — | — | — | None | Low |
| NFR-ATOMIC | Atomic write: tmp written, JSON re-parsed, then renamed; on failure tmp removed and 500 returned | ✅ | — | — | — | None | Low |
| NFR-SIZE | POST /workforce/allocations: body > 1MB rejected with 413 | ✅ | — | — | — | None | Low |
| NFR-LAYOUT | 1280px no horizontal scroll; CSS variables used | — | — | — | ✅ (RISK-ACCEPT) | Untestable-by-automation | Low |

---

## Coverage gaps

**NFR-LAYOUT** — The 1280px no-horizontal-scroll layout constraint and CSS custom property usage cannot be verified by any automated test without visual regression infrastructure. Classified under B2: RISK-ACCEPT with a post-implementation manual smoke test step (see verification scenarios in DoR).

---

## Test Data Strategy

**Shared fixtures** (used across unit and E2E tests; synthetic data only, no PII):

```
tests/fixtures/workforce/
  roster.json              — 5 people, 3 squads, 2 product groups, varied skill arrays
  allocation-input.json    — 2 initiative entries (one fully assigned, one unassigned); _autoderived: true at root
  allocation-input-draft.json — all entries have _reviewRequired: true
  allocation-input-empty.json — empty array; used where no pre-existing assignments needed
portfolio/
  pilot-platform.json      — requiredTags: ["java","spring","kafka"]; fte_demand: 1.5; productGroup: "Platform"
  data-mesh-v2.json        — requiredTags: ["python","spark"]; fte_demand: 1.0; productGroup: "Data"
  legacy-auth.json         — no requiredTags; fte_demand: 0.5; productGroup: "Security"
workforce/
  initiative-map.json      — standard map output shape from wfp.3/wfp.4; used for data endpoint tests
```

**Fixture roster members** (sufficient to exercise scoring edge cases):
- Alice: squad "Platform Eng", skills: ["java","spring","kafka","docker"]; productGroup: "Platform"
- Bob: squad "Platform Eng", skills: ["java","k8s"]; productGroup: "Platform"
- Carol: squad "Data Eng", skills: ["python","spark","sql"]; productGroup: "Data"
- Dave: squad "Data Eng", skills: []; productGroup: "Data"
- Eve: squad "Security", skills: ["python","auth","iam"]; productGroup: "Security"

**Portfolio slug scores against `pilot-platform` (requiredTags: ["java","spring","kafka"]):**
- Alice: intersection=["java","spring","kafka"] → 3/3 = 1.0
- Bob: intersection=["java"] → 1/3 = 0.33
- Carol, Dave, Eve: intersection=[] → 0.0

**No real PII** — all names are placeholders. No production roster data used in tests.

---

## Unit tests

Test file: `tests/check-wfp11a-route-handlers.js`
Run command: `node tests/check-wfp11a-route-handlers.js`
Source under test: `src/web-ui/routes/workforce.js` (handlers); `src/web-ui/server.js` (route registration)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `get-workforce-returns-200-html` | AC1 | Mock GET /workforce with seeded session → call handleGetWorkforceHtml | Status 200; Content-Type contains `text/html`; body is non-empty string |
| 2 | `get-workforce-data-all-files-present` | AC2 | Fixture dir with roster, initiative-map, allocation-input, portfolio slugs → handleGetWorkforceData | Response JSON has `roster`, `initiativeMap`, `portfolioSlugs` (array), `allocationInput` all non-null |
| 3 | `get-workforce-data-missing-initiative-map` | AC2 | Fixture dir without initiative-map.json → handleGetWorkforceData | `initiativeMap: null`; no error thrown; `roster` and `portfolioSlugs` still present |
| 4 | `get-workforce-data-missing-allocation-input` | AC2 | Fixture dir without allocation-input.json → handleGetWorkforceData | `allocationInput: null`; other keys present |
| 5 | `get-workforce-data-portfolio-slug-structure` | AC2 | portfolio/ with two valid slug files → handleGetWorkforceData | `portfolioSlugs` is array of `{ slug, data }` objects; length = 2 |
| 6 | `post-allocations-valid-json-writes-atomically` | AC3 | POST body = valid JSON string → handlePostWorkforceAllocations | Status 200; `{ ok: true, path: "workforce/allocation-input.json" }`; tmp file removed after rename; target file contains posted data |
| 7 | `post-allocations-invalid-json-returns-400` | AC3 | POST body = "not json" → handlePostWorkforceAllocations | Status 400; `{ ok: false, error: "Invalid JSON body" }` |
| 8 | `post-allocations-write-failure-returns-500` | NFR-ATOMIC | Spy on `fs.rename` to throw → handlePostWorkforceAllocations | Status 500; `{ ok: false, error: <non-empty string> }`; tmp file removed |
| 9 | `post-allocations-oversized-body-returns-413` | NFR-SIZE | POST body > 1MB → handlePostWorkforceAllocations | Status 413 |
| 10 | `path-traversal-slug-omitted-with-warning` | AC14 | portfolio/ dir, slug name = `../etc/passwd` → handleGetWorkforceData | Slug not present in `portfolioSlugs`; stderr output contains "[workforce/data] rejected slug:" |
| 11 | `path-traversal-absolute-path-rejected` | AC14 | slug name = `/etc/passwd` or `%2Fetc%2Fpasswd` → handleGetWorkforceData | Slug not present in `portfolioSlugs`; warning logged |
| 12 | `post-run-map-handler-called-returns-json` | AC15 | Mock POST /workforce/run-map with seeded session; stub child_process.spawn to emit exitCode 0, stdout "ok" | Status 200; response JSON has `{ ok: true, exitCode: 0, output: "ok" }` |
| 13 | `post-run-map-nonzero-exit-included-in-response` | AC10 | Stub child_process.spawn to emit exitCode 1, stderr "error detail" | Status 200; `{ ok: true, exitCode: 1, output: "error detail" }` — non-zero exit is surfaced, not masked |
| 14 | `server-js-registers-get-workforce-route` | AC1 | Read server.js source as text | Source contains `pathname === '/workforce' && req.method === 'GET'` |
| 15 | `server-js-registers-post-run-map-route` | AC15 | Read server.js source as text | Source contains `pathname === '/workforce/run-map' && req.method === 'POST'`; appears as `else if` branch (not nested inside another handler) |

---

## E2E tests

Test file: `tests/e2e/wfp11a-assignment-ui.spec.js`
Run command: `npx playwright test tests/e2e/wfp11a-assignment-ui.spec.js`
Requires: Test server started via global setup fixture (spawns `src/web-ui/server.js` on test port with fixture `workforce/` directory).

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| E1 | `initiative-view-loads-by-default` | AC4 | Navigate to GET /workforce | Initiative-centric view panel is visible; other view tabs (person, squad) present but disabled or labelled "coming in Phase 2" |
| E2 | `initiative-list-shows-slug-and-allocation-status` | AC4 | Load page with fixture allocationInput | Initiative with an entry in allocationInput shows "fully assigned"; initiative with no entry shows "unassigned"; initiative with empty people array shows "partially assigned" |
| E3 | `initiative-filter-by-product-group` | AC4 | Select "Platform" from product-group filter | Only Platform initiatives visible in list |
| E4 | `add-assignee-staged-in-memory` | AC5 | Select initiative → add Alice from candidate list | Alice appears in assignee list; "You have unsaved changes" banner visible; no POST to /workforce/allocations triggered |
| E5 | `allocation-mode-net-new-reveals-fields` | AC5 | Change allocation mode selector to "net-new" | `requiredRole` and `requiredTags` input fields become visible |
| E6 | `candidate-ranking-descending-by-score` | AC8 | Load page with pilot-platform fixture (requiredTags: ["java","spring","kafka"]) | Alice ranked first (100% match); Bob ranked second (33% match); "No tag match" separator present above Carol/Dave/Eve |
| E7 | `save-assignments-posts-to-allocations` | AC9 | Stage a change → click "Save assignments" | POST to /workforce/allocations sent with current state; on 200 response banner dismissed |
| E8 | `save-button-disabled-while-in-flight` | AC9 | Intercept POST /workforce/allocations with a delay → observe button state | Save button has `disabled` attribute while request is in flight |
| E9 | `save-failure-shows-error-banner` | AC9 | Intercept POST /workforce/allocations → respond 500 | Error message visible inline; staged changes preserved; banner still showing |
| E10 | `run-map-output-displayed-in-block` | AC10 | Stub /workforce/run-map response to `{ ok:true, exitCode:0, output:"Done." }` → click "Run workforce-map" | Output block appears with text "Done." |
| E11 | `run-map-nonzero-exit-renders-error-style` | AC10 | Stub /workforce/run-map response to `{ ok:true, exitCode:1, output:"Error: ..." }` | Output block has error styling (e.g. red border or error class) |
| E12 | `unsaved-changes-banner-dismissed-on-save` | AC11 | Stage change → save → 200 response | Banner no longer visible after successful save |
| E13 | `draft-badge-shown-for-autoderived-entry` | AC12 | Load page with allocation-input-draft.json fixture (_autoderived:true at root) | At least one initiative row carries "Draft" or "needs review" badge text |
| E14 | `existing-allocation-prepopulated-on-load` | AC13 | Load page with allocation-input.json (has one fully-assigned initiative) | That initiative shows its assignees pre-populated in the detail panel |

---

## Notes on test file format

```js
// tests/check-wfp11a-route-handlers.js
const assert = require('assert');
let passed = 0, failed = 0;
function test(label, fn) {
  try { fn(); console.log('  PASS', label); passed++; }
  catch (e) { console.log('  FAIL', label, e.message); failed++; }
}
// ... async tests use async/await or Promises with try/catch
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

The Playwright spec (`tests/e2e/wfp11a-assignment-ui.spec.js`) follows the existing Playwright config (`playwright.config.js`) pattern already in the repo. Global setup starts the server with fixture data; global teardown stops it.
