# DoR Contract — wfp.11a: Interactive allocation assignment UI — server routes and initiative-centric view

**Story:** wfp.11a
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- `src/web-ui/routes/workforce.js` — new Node.js CommonJS file with four exported handler functions:
  - `handleGetWorkforceHtml(req, res)` — serves `200 text/html; charset=utf-8` with the complete single-file assignment UI (inline CSS + inline JS, no external deps)
  - `handleGetWorkforceData(req, res)` — serves `200 application/json` with shape `{ roster, initiativeMap, portfolioSlugs, allocationInput }`. Validates each portfolio slug filename against `/^[a-z0-9-]+$/` allowlist. Invalid slugs are omitted; warning written to stderr as `[workforce/data] rejected slug: <value>`. Missing optional files (`initiative-map.json`, `allocation-input.json`) returned as `null`.
  - `handlePostWorkforceAllocations(req, res)` — collects request body (max 1MB — returns 413 if exceeded); parses as JSON (returns 400 with `{ ok:false, error:"Invalid JSON body" }` on failure); writes atomically to `workforce/allocation-input.json` via `.tmp` → validate re-parse → rename. Returns `{ ok:true, path:"workforce/allocation-input.json" }` on success; `{ ok:false, error: <msg> }` with 500 on write failure. Tmp file removed on any failure.
  - `handlePostWorkforceRunMap(req, res)` — reads `WORKFORCE_MAP_CMD` env var (default: `node src/workforce/map.js`); splits into command and args; calls `child_process.spawn(cmd, args, { cwd: process.cwd() })`; collects stdout + stderr into a single string; on process exit returns `{ ok:true, exitCode:<n>, output:"<combined>" }`. Non-zero exitCode is surfaced in the response — not treated as an HTTP error.
  - The inline JavaScript in `handleGetWorkforceHtml` must declare `const OVER_ALLOCATION_THRESHOLD = 2;` at the top of the inline script block. Person and squad view tabs must be present in the HTML but rendered as disabled (`disabled` attribute or equivalent CSS) with label "coming in Phase 2". Do not implement person/squad view logic.

- `src/web-ui/server.js` — add exactly:
  - One import line at the top: `const { handleGetWorkforceHtml, handleGetWorkforceData, handlePostWorkforceAllocations, handlePostWorkforceRunMap } = require('./routes/workforce');`
  - Four `else if` branches in the existing routing chain (exact pattern below — must not be nested inside another handler, must not use a separate `if` statement):
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

- `tests/check-wfp11a-route-handlers.js` — 15 unit tests
- `tests/e2e/wfp11a-assignment-ui.spec.js` — 14 Playwright E2E tests
- `tests/fixtures/workforce/` — synthetic fixture directory:
  - `roster.json` — 5-person roster (Alice, Bob, Carol, Dave, Eve) as specified in test plan
  - `allocation-input.json` — 2 initiative entries; `_autoderived: true` at root
  - `allocation-input-draft.json` — entries with `_reviewRequired: true`
  - `allocation-input-empty.json` — empty allocation array
  - `initiative-map.json` — standard shape from wfp.3
  - `portfolio/pilot-platform.json` — `{ requiredTags: ["java","spring","kafka"], fte_demand: 1.5, productGroup: "Platform" }`
  - `portfolio/data-mesh-v2.json` — `{ requiredTags: ["python","spark"], fte_demand: 1.0, productGroup: "Data" }`
  - `portfolio/legacy-auth.json` — `{ fte_demand: 0.5, productGroup: "Security" }` (no requiredTags)
- `package.json` — append `&& node tests/check-wfp11a-route-handlers.js` to `scripts.test`

---

## What will NOT be built

- Person-centric view logic — wfp.11b scope
- Squad-centric view logic — wfp.11b scope
- New server files — all routes added to existing `server.js`
- Changes to `dashboards/workforce.html` — static dashboard unchanged
- Role-based access control beyond existing `authGuard`
- SSE streaming of `workforce-map` output
- LocalStorage persistence of unsaved changes
- `OVER_ALLOCATION_THRESHOLD` as a CLI flag or UI control
- Changes to `portfolio/[slug].json` files (read-only)
- Modification of `src/workforce/assign.js` — imported as a read-only dependency for `scoreSquadForSlug`

---

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — GET /workforce; authGuard; 200 text/html | Unit: mock req; assert status + content-type; Unit: server.js source text check | T1, T14 |
| AC2 — GET /workforce/data JSON shape; null for missing files; slug allowlist | Unit: four handler invocations with varied fixtures | T2, T3, T4, T5 |
| AC3 — POST /workforce/allocations: valid/invalid/fail/oversized | Unit: four handler invocations | T6, T7, T8, T9 |
| AC4 — Initiative-centric view default; filter; detail panel | E2E: page load + list assertions + filter interaction | E1, E2, E3 |
| AC5 — Add assignee staged; allocation mode selector; net-new fields | E2E: add action + mode selector + field visibility | E4, E5 |
| AC8 — Candidate ranking by score; % displayed; "No tag match" separator | E2E: load pilot-platform fixture; assert order and text | E6 |
| AC9 — Save POSTs; 200→dismissed; non-200→error; button disabled in-flight | E2E: three save scenarios | E7, E8, E9 |
| AC10 — Run-map button; spawn invocation; exitCode+output returned | Unit: T12, T13; E2E: E10, E11 | T12, T13, E10, E11 |
| AC11 — Unsaved changes banner shown/dismissed | E2E: stage + banner check; save + dismiss check | E4, E12 |
| AC12 — Draft badge for _autoderived / _reviewRequired entries | E2E: draft fixture + badge text assertion | E13 |
| AC13 — allocationInput pre-populated on load | E2E: fixture with existing assignments + detail panel check | E14 |
| AC14 — Path traversal slug rejected; warning logged to stderr | Unit: two invalid slug tests | T10, T11 |
| AC15 — POST /workforce/run-map first-class else-if branch in server.js | Unit: handler called + source text check | T12, T15 |

---

## Assumptions

- wfp.9 is DoD-complete: `src/workforce/assign.js` exists; `workforce/allocation-input.json` schema is established
- wfp.10 is DoD-complete: `scoreSquadForSlug(squad, requiredTags)` is exported from `src/workforce/assign.js` as a named function
- wfp.3 and wfp.4 are DoD-complete: `src/workforce/map.js` exists with a `run()` entry point
- `src/web-ui/server.js` uses an `if/else if` chain for routing; the implementer must read it before editing to follow the exact pattern
- `authGuard` is already imported in `server.js` at the point where the new branches are added

---

## Required touchpoints (MUST be in implementation)

- `src/web-ui/routes/workforce.js` — create new file; export all four handlers
- `src/web-ui/server.js` — add import + four `else if` route registrations
- `tests/check-wfp11a-route-handlers.js` — create new file; add to `npm test` chain
- `tests/e2e/wfp11a-assignment-ui.spec.js` — create new file
- `tests/fixtures/workforce/` — create fixture directory and files
- `package.json` — append `&& node tests/check-wfp11a-route-handlers.js` to `scripts.test`

---

## Out-of-scope constraints (MUST NOT touch)

- `dashboards/workforce.html` — MUST NOT be modified (static read-only dashboard)
- `src/workforce/assign.js` — MUST NOT be modified (read-only import of `scoreSquadForSlug`)
- `src/workforce/map.js` — MUST NOT be modified (invoked as child process only)
- Any other file under `src/workforce/` — MUST NOT be modified; wfp.11a is a web-ui concern only
- Any file under `artefacts/` — MUST NOT be created or modified by the coding agent
