# DoR Contract — wfp.11b: Interactive allocation assignment UI — Story B: person-centric and squad-centric views

**Story:** wfp.11b
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- `src/web-ui/routes/workforce.js` — MODIFY ONLY. Extend the inline HTML/JS template string within `handleGetWorkforceHtml`. Specifically:
  - Enable the person-centric view tab (remove `disabled` attribute and "coming in Phase 2" label established by wfp.11a)
  - Implement person-centric view panel with 4-dimension filter bar and detail pane (see DoR task 1 for full specification)
  - Enable the squad-centric view tab; implement squad-centric view panel with filter, detail, and idempotent bulk-assign action
  - All mutations update the single shared in-memory allocation state object already established by the initiative view
  - `OVER_ALLOCATION_THRESHOLD` is already declared as `const OVER_ALLOCATION_THRESHOLD = 2;` in the inline script. **DO NOT redeclare it.**
  - No changes to any of the four exported handler function bodies (`handleGetWorkforceHtml` function signature, `handleGetWorkforceData`, `handlePostWorkforceAllocations`, `handlePostWorkforceRunMap`) outside of the HTML template string

- `tests/e2e/wfp11b-person-squad-views.spec.js` — new Playwright spec; 15 tests (E1–E15)

- `tests/fixtures/workforce/roster.json` — EXTEND: add Frank, Grace, Hana as specified in the test plan's fixture extension section. Alice (already in fixture from wfp.11a) belongs to squad "Platform Eng", productGroup "Platform". Frank and Grace also in "Platform Eng". Hana in "Data Eng", productGroup "Data". Bob, Carol, Dave, Eve retain their original squad assignments.

- `tests/fixtures/workforce/allocation-input-overallocated.json` — new fixture: Alice assigned to three separate initiatives (e.g. `pilot-platform`, `data-mesh-v2`, `legacy-auth`), all with `staged: true`. This causes Alice's assignment count to exceed `OVER_ALLOCATION_THRESHOLD = 2`.

---

## What will NOT be built

- New route handlers — all routes (`GET /workforce`, `GET /workforce/data`, `POST /workforce/allocations`, `POST /workforce/run-map`) are established in wfp.11a. This story does not add or modify handler logic outside of the HTML template string.
- Changes to `src/web-ui/server.js` — four route registrations are already in place from wfp.11a
- Changes to `dashboards/workforce.html` — MUST NOT be modified
- LocalStorage persistence of unsaved changes
- `OVER_ALLOCATION_THRESHOLD` as a UI slider, server config, or API param
- Real-time collaboration or SSE streaming
- Any change to `package.json` — wfp.11b is E2E only; E2E is run via `npm run test:e2e`, not appended to `npm test`
- Any new Node.js modules or server-side imports

---

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC6 — Person view: list; 4 filter dims; per-person detail; over-allocation flag (> OVER_ALLOCATION_THRESHOLD); shared state mutations | E2E: 8 tests | E1, E2, E3, E4, E5, E6, E7, E8 |
| AC7 — Squad view: list; product-group filter; per-squad detail; bulk assign → idempotent | E2E: 4 tests | E9, E10, E11, E12 |
| AC11 — Cross-view: staged changes preserved on view switch; banner consistent; count consistent; browser reload loses all staged | E2E: 3 tests | E13, E14, E15 |

---

## Assumptions

- wfp.11a is DoD-complete prior to implementation of wfp.11b. The implementer must verify that `handleGetWorkforceHtml` exists in `src/web-ui/routes/workforce.js` and that `OVER_ALLOCATION_THRESHOLD = 2` is already declared in the inline script.
- The implementer must read the full content of `handleGetWorkforceHtml` before modifying it to understand the existing shared state structure, tab HTML, and the "coming in Phase 2" disabled labels.
- Tests/fixtures/workforce/ exists (created by wfp.11a) — the implementer extends roster.json in place and adds one new fixture file.
- E2E test setup (playwright global setup, server start) is shared with wfp.11a — the implementer must not create a conflicting server port or setup step.

---

## Required touchpoints (MUST be in implementation)

- `src/web-ui/routes/workforce.js` — MODIFY: extend `handleGetWorkforceHtml` HTML/JS only; enable person and squad tabs
- `tests/e2e/wfp11b-person-squad-views.spec.js` — CREATE new file; 15 E2E tests
- `tests/fixtures/workforce/roster.json` — EXTEND: append Frank, Grace, Hana entries
- `tests/fixtures/workforce/allocation-input-overallocated.json` — CREATE new fixture

---

## Out-of-scope constraints (MUST NOT touch)

- `src/web-ui/server.js` — MUST NOT be modified (all route registrations exist from wfp.11a)
- `src/workforce/assign.js` — MUST NOT be modified
- `src/workforce/map.js` — MUST NOT be modified
- `dashboards/workforce.html` — MUST NOT be modified
- `package.json` — MUST NOT be modified (no test chain entry for wfp.11b)
- Any other handler function body in `src/web-ui/routes/workforce.js` outside the HTML/JS template string in `handleGetWorkforceHtml`
- Any file under `artefacts/` — MUST NOT be created or modified by the coding agent
