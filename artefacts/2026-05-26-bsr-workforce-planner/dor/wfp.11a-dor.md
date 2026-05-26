# Definition of Ready — Interactive allocation assignment UI: server routes and initiative-centric view

**Story:** wfp.11a
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Interactive allocation assignment UI — Story A: server routes and initiative-centric view
**Review:** PASS — wfp.11a run 1, 0 HIGH findings; 1-M1 MEDIUM (H-E2E trigger — Playwright E2E spec named in test plan); 1-L1 LOW (spawn path — specified in contract below)
**Test plan:** 15 unit tests + 14 E2E tests covering all 12 ACs and key NFRs
**Verification scenarios:** 5 scenarios (see Step 5 below)

---

## Step 2 — Contract Proposal

**What will be built:**
- `src/web-ui/routes/workforce.js` — new file with four exported route handler functions:
  - `handleGetWorkforceHtml(req, res)` — returns `200 text/html` serving the single-file assignment UI (inline CSS + inline JS)
  - `handleGetWorkforceData(req, res)` — returns `200 application/json` with `{ roster, initiativeMap, portfolioSlugs, allocationInput }`. Validates each portfolio slug against `/^[a-z0-9-]+$/` before file read; rejects invalid slugs with a stderr warning. Missing optional files returned as `null`.
  - `handlePostWorkforceAllocations(req, res)` — atomically writes the request body to `workforce/allocation-input.json` (write to `.tmp`, validate JSON, rename). Returns `{ ok: true, path }` on success, `{ ok: false, error }` on failure (400 on invalid JSON, 413 on body > 1MB, 500 on write error).
  - `handlePostWorkforceRunMap(req, res)` — calls `child_process.spawn('node', ['src/workforce/map.js'], { cwd: process.cwd() })`, collects stdout+stderr, and on process exit returns `{ ok: true, exitCode: <n>, output: "<combined>" }`. The spawn command is configurable via `WORKFORCE_MAP_CMD` env var for test environments (default: `node src/workforce/map.js`).
- `src/web-ui/server.js` — add four `else if` route registrations in the existing `if/else if` chain:
  ```js
  } else if (pathname === '/workforce' && req.method === 'GET') {
    authGuard(req, res, async () => { await handleGetWorkforceHtml(req, res); });
  } else if (pathname === '/workforce/data' && req.method === 'GET') {
    authGuard(req, res, async () => { await handleGetWorkforceData(req, res); });
  } else if (pathname === '/workforce/allocations' && req.method === 'POST') {
    authGuard(req, res, async () => { await handlePostWorkforceAllocations(req, res); });
  } else if (pathname === '/workforce/run-map' && req.method === 'POST') {
    authGuard(req, res, async () => { await handlePostWorkforceRunMap(req, res); });
  }
  ```
  Plus one import line at the top: `const { handleGetWorkforceHtml, handleGetWorkforceData, handlePostWorkforceAllocations, handlePostWorkforceRunMap } = require('./routes/workforce');`
- `tests/check-wfp11a-route-handlers.js` — 15 unit tests
- `tests/e2e/wfp11a-assignment-ui.spec.js` — 14 Playwright E2E tests
- `tests/fixtures/workforce/` — synthetic fixture files (roster.json, allocation-input.json, allocation-input-draft.json, allocation-input-empty.json) and `portfolio/` sub-directory
- `package.json` — append `&& node tests/check-wfp11a-route-handlers.js` to `scripts.test`

**What will NOT be built:**
- Person-centric view logic (wfp.11b scope)
- Squad-centric view logic (wfp.11b scope)
- Changes to `dashboards/workforce.html`
- Role-based access control beyond existing `authGuard`
- SSE streaming for workforce-map output
- LocalStorage persistence of unsaved changes
- `OVER_ALLOCATION_THRESHOLD` as a UI control or server config
- Changes to `portfolio/[slug].json` files (read-only)
- Changes to `src/workforce/assign.js` — imported read-only for `scoreSquadForSlug`

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — GET /workforce route registered; 200 text/html | Unit: T1 (handleGetWorkforceHtml), T14 (server.js source check) | Unit |
| AC2 — GET /workforce/data JSON shape; null for missing files | Unit: T2, T3, T4, T5 | Unit |
| AC3 — POST /workforce/allocations: valid/invalid/fail cases | Unit: T6, T7, T8, T9 | Unit |
| AC4 — Initiative list default view; filter; detail panel | E2E: E1, E2, E3 | E2E |
| AC5 — Add/remove staged; allocation mode selector | E2E: E4, E5 | E2E |
| AC8 — Candidate ranking by score; percentage display | E2E: E6 | E2E |
| AC9 — Save POSTs; 200→banner dismissed; non-200→error; button disabled | E2E: E7, E8, E9 | E2E |
| AC10 — Run-map button; spawn; exitCode+output returned | Unit: T12, T13; E2E: E10, E11 | Unit + E2E |
| AC11 — Unsaved changes banner shown/dismissed | E2E: E4 (shown), E12 (dismissed) | E2E |
| AC12 — Draft badge for _autoderived / _reviewRequired | E2E: E13 | E2E |
| AC13 — Existing allocationInput pre-populated on load | E2E: E14 | E2E |
| AC14 — Path traversal slug rejected; warning logged | Unit: T10, T11 | Unit |
| AC15 — POST /workforce/run-map first-class else-if branch | Unit: T12, T15 | Unit |

**RISK-ACCEPT — B2 CSS-layout ACs:**
ACs requiring verification of 1280px no-horizontal-scroll layout and CSS custom property usage cannot be verified by automated tests. These aspects are addressed by a post-implementation manual smoke test step (Verification Scenario 5 below). RISK-ACCEPT: proceed; manual verification is proportionate for an internal-only tool with a single supported viewport.

**RISK-ACCEPT — WORKFORCE_MAP_CMD environment variable:**
The `handlePostWorkforceRunMap` handler reads `WORKFORCE_MAP_CMD` env var (default: `node src/workforce/map.js`) to allow E2E test environments to stub the spawn target without modifying the handler. In production use (no env var set), the default invocation applies. RISK-ACCEPT: the env var is not a security boundary (wfp.11a is an authenticated-only internal tool); it does not accept user input; it is only set in the CI/test environment.

**Assumptions:**
- wfp.9 is DoD-complete — `workforce/allocation-input.json` schema established
- wfp.10 is DoD-complete — `scoreSquadForSlug(squad, requiredTags)` exported from `src/workforce/assign.js`
- wfp.3 and wfp.4 are DoD-complete — `src/workforce/map.js` with `run()` function exists
- `src/web-ui/server.js` uses an `if/else if` routing chain; implementer must read it before adding new branches
- `authGuard` is already imported and callable at the point where routes are added

**Estimated touch points:**
- `src/web-ui/routes/workforce.js` — new file
- `src/web-ui/server.js` — add 4 route registrations + 1 import
- `tests/check-wfp11a-route-handlers.js` — new
- `tests/e2e/wfp11a-assignment-ui.spec.js` — new
- `tests/fixtures/workforce/` — new fixture directory
- `package.json` — append to scripts.test

---

## Step 3 — Contract review

Contract review passed — four handlers in one new module; all 12 ACs covered by named tests; no new npm dependencies; atomic write pattern established; path traversal guard explicit; spawn abstracted via env var for testability; B2 layout gap addressed via RISK-ACCEPT with manual step.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering" |
| H2 — three or more ACs in Given / When / Then | PASS | 12 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 12 ACs covered (unit or E2E) per AC verification table |
| H4 — out-of-scope populated | PASS | 8 explicit exclusions including person/squad views, dashboards/workforce.html, SSE streaming, localStorage |
| H5 — benefit linkage to named metric | PASS | M1 and M2; mechanism sentences specific (removes hand-authored JSON friction; full assignment-to-reconciliation loop in browser) |
| H6 — complexity rated | PASS | Rating: 3; rationale present |
| H7 — no unresolved HIGH findings | PASS | 0 HIGH findings; 1-M1 MEDIUM resolved (Playwright E2E spec named); 1-L1 LOW resolved (spawn command specified in contract) |
| H8 — no uncovered ACs | PASS | All 12 ACs have named tests in test plan |
| H8-ext — cross-story schema check | PASS | No pipeline-state schema field dependency |
| H9 — architecture constraints populated | PASS | No new deps, authGuard wrapping, inline HTML/JS/CSS, atomic write, path traversal guard, spawn not require, dashboards/workforce.html unchanged |
| H-E2E — web UI change requiring E2E | PASS | GET /workforce serves browser-rendered HTML → H-E2E triggered; addressed by Playwright spec at tests/e2e/wfp11a-assignment-ui.spec.js (14 E2E tests). B2 layout ACs addressed by RISK-ACCEPT with manual smoke test. |
| H-NFR — NFR profile exists | PASS | nfr-profile.md present; wfp.11a NFRs to be added (see pipeline-state update) |
| H-NFR2 — compliance NFRs have sign-off | PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | PASS | Internal / Private — same classification as wfp.9/wfp.10 |
| H-NFR-profile — NFRs registered in nfr-profile.md | PASS | NFRs added to nfr-profile.md alongside pipeline-state update for this story |
| H-GOV — Approved By populated | PASS | Hamish King 2026-05-27 |
| H-ADAPTER — injectable adapters introduced | PASS | No new injectable adapters. `scoreSquadForSlug` is imported directly (not an injectable). `WORKFORCE_MAP_CMD` env var is a test-only escape hatch, not an injectable adapter in the D37 sense — it does not have a `setX()` setter and has no default-throw stub. |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or "None" | No warning — NFRs in architecture constraints: performance (<2s GET /workforce/data), scale (200 persons, 40 squads, 40 initiatives), security (path traversal guard, 1MB body limit), compatibility (1280px) |
| W2 — scope stability declared | No warning — Stable; architecture constraints frozen at four routes |
| W3 — MEDIUM review findings acknowledged | No warning — 1-M1 resolved (Playwright E2E spec named in test plan); 1-L1 resolved (spawn command specified in contract) |
| W4 — verification script reviewed by domain expert | Warning — scenarios written below; not yet reviewed by Hamish King |
| W5 — no UNCERTAIN items in test plan | No warning |

**W4 acknowledgement:** Internal engineering tool. Operator proceeds.

---

## Step 5 — Verification scenarios

Manual scenarios to run post-implementation before DoD:

1. **Route registration smoke test:** Start `src/web-ui/server.js` locally. Navigate to `/workforce` — page loads with initiative-centric view. Navigate to `/workforce/data` — returns valid JSON with `roster`, `portfolioSlugs`, and correct `allocationInput` (null if file absent).
2. **Assignment round-trip:** Select an initiative with `requiredTags` defined. Observe candidate list ranked by score with percentages. Add Alice as an assignee. Confirm "You have unsaved changes" banner appears. Click "Save assignments". Confirm `workforce/allocation-input.json` updated with the new assignment. Confirm banner dismissed.
3. **Run workforce-map:** After saving an allocation, click "Run workforce-map". Confirm the output block appears with either a success or error message from the script. If `exitCode` > 0 confirm the block has error styling.
4. **Draft badge:** Manually set `_autoderived: true` in `workforce/allocation-input.json`. Reload the page. Confirm at least one initiative shows the "Draft — needs review" badge.
5. **Layout smoke test (B2 — manual):** Open the assignment UI in Chrome and Firefox at 1280px viewport width. Confirm no horizontal scrollbar is present. Confirm the initiative list, detail panel, and candidate list are visible simultaneously without overlap.

---

## Oversight level

**Medium** — from parent epic wfp-planning-dashboard.md. File writes to disk (`allocation-input.json`) and child-process execution (`workforce-map` script) elevate this above Low. Requires operator review before DoD sign-off.

---

## Coding Agent Instructions

### Story
Interactive allocation assignment UI — Story A: server routes and initiative-centric view — wfp.11a

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.11a-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.11a-test-plan.md`
15 unit tests + 14 E2E tests — all must pass.

### Test files
- `tests/check-wfp11a-route-handlers.js` — unit tests. Add `&& node tests/check-wfp11a-route-handlers.js` to `npm test` chain in `package.json`.
- `tests/e2e/wfp11a-assignment-ui.spec.js` — Playwright E2E. Run via `npm run test:e2e`.

### What to build

**Task 1 — Create `src/web-ui/routes/workforce.js` with four exported handler functions:**

```js
// src/web-ui/routes/workforce.js
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { scoreSquadForSlug } = require('../../../src/workforce/assign');

const SLUG_ALLOWLIST = /^[a-z0-9-]+$/;
const MAX_BODY_BYTES = 1024 * 1024; // 1MB

async function handleGetWorkforceHtml(req, res) { /* serve inline HTML */ }
async function handleGetWorkforceData(req, res) { /* return JSON */ }
async function handlePostWorkforceAllocations(req, res) { /* atomic write */ }
async function handlePostWorkforceRunMap(req, res) { /* spawn */ }

module.exports = { handleGetWorkforceHtml, handleGetWorkforceData, handlePostWorkforceAllocations, handlePostWorkforceRunMap };
```

Key implementation notes:
- `handleGetWorkforceData`: use `path.resolve(process.cwd(), 'portfolio')` as base; validate each entry filename against `SLUG_ALLOWLIST` before reading; `stderr.write('[workforce/data] rejected slug: ' + slug + '\n')` on rejection.
- `handlePostWorkforceAllocations`: collect body chunks into a Buffer; reject if total > MAX_BODY_BYTES (413); parse as JSON (400 on failure); write to `workforce/allocation-input.json.tmp`; re-parse written file; rename to target; remove tmp on any failure.
- `handlePostWorkforceRunMap`: read `WORKFORCE_MAP_CMD` env var; default is `node src/workforce/map.js`; split into `[cmd, ...args]`; spawn; collect stdout+stderr into a single string; on exit return `{ ok: true, exitCode, output }`.
- `handleGetWorkforceHtml`: return a full single-file HTML page with initiative-centric view. The `OVER_ALLOCATION_THRESHOLD` constant must be declared at the top of the inline script as `const OVER_ALLOCATION_THRESHOLD = 2;` (it will be used by wfp.11b; declare it now but only reference it in person/squad views later). Person and squad view tabs must be present in the HTML but must be disabled or labelled "coming in Phase 2".

**Task 2 — Update `src/web-ui/server.js`:**
Add one import line at the top of the file alongside existing route imports:
```js
const { handleGetWorkforceHtml, handleGetWorkforceData, handlePostWorkforceAllocations, handlePostWorkforceRunMap } = require('./routes/workforce');
```
Add four `else if` branches in the routing chain (exact text as shown in Step 2 above). Read `src/web-ui/server.js` in full before making any edits — follow the exact indentation and `authGuard` pattern already established.

**Task 3 — Create unit test file `tests/check-wfp11a-route-handlers.js`:**
Implement all 15 unit tests from the test plan (T1–T15). Use the fixtures in `tests/fixtures/workforce/`. For handler tests that need `fs`, inject a mock fs or use a temp directory. For T14 and T15, read `src/web-ui/server.js` as text and assert string presence.

**Task 4 — Create Playwright E2E spec `tests/e2e/wfp11a-assignment-ui.spec.js`:**
Implement all 14 E2E tests (E1–E14) from the test plan. Add a `globalSetup` that starts the server on a free port using the test fixture `workforce/` directory and sets the `WORKFORCE_MAP_CMD` env var to a no-op echo script. Tear down in `globalTeardown`.

**Task 5 — Create fixture files under `tests/fixtures/workforce/`:**
Create `roster.json`, `allocation-input.json`, `allocation-input-draft.json`, `allocation-input-empty.json` per the test data strategy in the test plan. Create `portfolio/pilot-platform.json`, `portfolio/data-mesh-v2.json`, `portfolio/legacy-auth.json`.

**Task 6 — Update `package.json` test chain:**
Append `&& node tests/check-wfp11a-route-handlers.js` to `scripts.test`.

### Dependencies
- wfp.9 must be DoD-complete (`src/workforce/assign.js` with the allocation schema established)
- wfp.10 must be DoD-complete (`scoreSquadForSlug` exported from `src/workforce/assign.js`)
- wfp.3 and wfp.4 must be DoD-complete (`src/workforce/map.js` exists)
- Read `src/web-ui/server.js` before modifying — follow existing route pattern exactly

### Definition of done for this story
- `node tests/check-wfp11a-route-handlers.js` exits 0 with 15 passing
- `npx playwright test tests/e2e/wfp11a-assignment-ui.spec.js` exits 0 with 14 passing
- `npm test` exits 0
- All 5 verification scenarios pass (4 automated, 1 manual layout)
- `GET /workforce` returns 200 text/html with initiative-centric view
- Person and squad tabs present but disabled in the HTML

### Proceed: Yes

---

**Definition of ready: PROCEED — Interactive allocation assignment UI — Story A: server routes and initiative-centric view (wfp.11a)**
