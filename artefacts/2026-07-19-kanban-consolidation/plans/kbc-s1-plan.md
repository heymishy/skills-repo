# Implementation Plan: Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status

**Story:** kbc-s1
**Feature:** 2026-07-19-kanban-consolidation
**Test plan reference:** artefacts/2026-07-19-kanban-consolidation/test-plans/kbc-s1-test-plan.md
**DoR reference:** artefacts/2026-07-19-kanban-consolidation/dor/kbc-s1-dor.md

**Tasks: 11 | ACs covered: 6/6 | Estimated effort: Medium (3–4 hours)**

---

## File Map

| File | Operation | Reason |
|------|-----------|--------|
| `src/web-ui/views/kanban-view.js` | Modify | Generalize renderKanban function to accept generic columns/cards shape (AC1, AC6) |
| `src/web-ui/routes/products.js` | Modify | Update handleGetProductKanban and handleGetOrgKanban to return HTML, add tenant aggregation function (AC2, AC3, AC4) |
| `src/web-ui/routes/dashboard.js` | Modify | Add /dashboard?view=board route handler using tenant aggregation (AC4) |
| `src/web-ui/server.js` | Modify | Remove route registrations for /features, /actions, /status, /status/export (AC5) |
| `src/web-ui/routes/features.js` | Delete or Reduce | Remove handleGetFeatures and route-specific handlers, keep/extract any reused exports like _listArtefacts if used elsewhere (AC5) |
| `src/web-ui/routes/status.js` | Delete | Remove entirely after confirming no other routes depend on its exports (AC5) |
| `src/web-ui/routes/actions.js` | Delete | Remove entirely after confirming no other routes depend on its exports (AC5) |
| `tests/check-kanban-consolidation.js` | Create | New test file with U1–U9 unit tests + IT1–IT3 integration tests + NFR tests (AC1–AC6) |

---

## Implementation Tasks

### Task 1: Analyze current code and plan refactor
**Maps to:** AC1, AC6 (analysis phase)
**TDD:** N/A (analysis, no test needed)

**Step 1a — Read current implementations**

Read these files in full and document:
- `src/web-ui/views/kanban-view.js` — the current `renderKanban({ features, ideas })` function, its signature, output shape, and test coverage
- `src/web-ui/routes/products.js` — the current `handleGetProductKanban(req, res)` and `handleGetOrgKanban(req, res)` handlers (approx. lines 624 and 688), their data-shaping logic (STAGE_COLUMNS, health labels), and JSON response structure
- `src/web-ui/routes/features.js` — the current `handleGetFeatures(req, res)` handler and all its exports
- `src/web-ui/server.js` — all route registrations for GET /features, GET /actions, GET /status, POST /status/export

**Step 1b — Grep codebase for features.js exports**

Run: `grep -r "from.*features\.js\|require.*features\.js\|import.*from.*features" src/ tests/ --include="*.js"`

Verify: Which exports of features.js are still needed by other routes?

---

### Task 2: Generalize renderKanban function signature
**Maps to:** AC1, AC6
**TDD:** Failing test first

**Step 2a — Write failing unit test U1 (generic columns/cards shape)**

File: `tests/check-kanban-consolidation.js`

Test that renderKanban accepts `{ columns: [{ stage, cards: [] }], ideas?: [] }` shape

**Step 2b — Modify renderKanban signature in kanban-view.js**

Change from `function renderKanban({ features, ideas = [] })` to `function renderKanban({ columns = [], ideas = [] })`

Render HTML from generic columns, make ideas optional.

**Step 2c — Write and pass test U6 (backward compatibility)**

Test old `{ features, ideas }` signature still works via shape mapping.

**Step 2d — Write and pass test U7 (ideas optional)**

Test renders correctly without ideas array.

**Commit message:** `refactor: generalize renderKanban to accept generic {columns, ideas?} shape (AC1, AC6)`

---

### Task 3: Update product kanban route to render HTML
**Maps to:** AC2
**TDD:** Failing test first

**Step 3a — Write failing tests U2 and IT1**

Test that `handleGetProductKanban` now returns HTML (Content-Type: text/html) not JSON.

**Step 3b — Modify handleGetProductKanban in products.js**

Change from returning `res.json({ columns })` to `res.contentType('text/html').send(renderKanban({ columns }))`

Import `renderKanban` from `../views/kanban-view.js`

**Commit message:** `feat: product kanban route returns HTML via shared renderer (AC2)`

---

### Task 4: Update org kanban route to render HTML
**Maps to:** AC3
**TDD:** Failing test first

**Step 4a — Write failing tests U3 and IT2**

Test that `handleGetOrgKanban` now returns HTML, not JSON.

**Step 4b — Modify handleGetOrgKanban in products.js**

Same pattern as Task 3: return HTML, call shared renderer.

**Commit message:** `feat: org kanban route returns HTML via shared renderer (AC3)`

---

### Task 5: Create tenant board aggregation function
**Maps to:** AC4
**TDD:** Failing test first

**Step 5a — Write failing tests U4 and U5**

Test that tenant aggregation merges journeys from ALL tenant products, not just one.

**Step 5b — Implement buildTenantKanbanColumns in products.js**

Function aggregates columns across all products using Promise.all for parallelization.

**Commit message:** `feat: add tenant-scope kanban aggregation across all tenant products (AC4)`

---

### Task 6: Add /dashboard?view=board route
**Maps to:** AC4
**TDD:** Failing test first

**Step 6a — Write failing test IT3**

Test that `GET /dashboard?view=board` returns HTML board with journeys from multiple tenant products.

**Step 6b — Update handleGetDashboard in dashboard.js**

Add branch for `req.query.view === 'board'`: fetch products, aggregate journeys in parallel, render via shared renderer.

Register route in server.js: `app.get('/dashboard', handleGetDashboard)`

**Commit message:** `feat: add /dashboard?view=board tenant-level kanban aggregation (AC4)`

---

### Task 7: Remove /features, /actions, /status routes from server.js
**Maps to:** AC5
**TDD:** Verification test

**Step 7a — Identify and remove route registrations**

Find and remove all route registrations for /features, /actions, /status, /status/export.

Remove require/import statements for these handlers.

**Step 7b — Write verification test U8**

Test that server.js has zero references to handleGetFeatures, handleGetStatus, etc.

**Commit message:** `refactor: remove /features, /actions, /status route registrations from server.js (AC5)`

---

### Task 8: Delete status/actions handler modules
**Maps to:** AC5
**TDD:** Verification test

**Step 8a — Confirm no external dependencies**

Run: `grep -r "from.*status\.js\|require.*status\.js\|from.*actions\.js\|require.*actions\.js" src/ tests/`

**Step 8b — Delete files**

Delete `src/web-ui/routes/status.js` and `src/web-ui/routes/actions.js`

**Commit message:** `refactor: delete now-unused status.js and actions.js handler modules (AC5)`

---

### Task 9: Handle features.js removal or extraction
**Maps to:** AC5
**TDD:** Verification test

**Step 9a — Identify still-needed exports**

From Task 1: if any features.js exports (e.g., _listArtefacts, _readIdeas, handleGetIdeas) are used elsewhere, extract to shared utility file.

**Step 9b — Extract or delete**

If used elsewhere: create `src/web-ui/utils/shared-artefact-utils.js`, move functions, update imports.
If not used: delete `src/web-ui/routes/features.js` entirely.

**Step 9c — Write verification test U9**

Test that test suite has no references to /features, /actions, /status routes.

**Commit message:** `refactor: delete or extract features.js handlers, remove /features route tests (AC5)`

---

### Task 10: Add security escaping tests
**Maps to:** AC1, Security NFR
**TDD:** Failing test first

**Step 10a — Write escaping test**

Test that card titles with HTML special chars (`<`, `>`, `&`, `"`, `'`) are properly escaped in rendered output.

**Commit message:** `test: verify board rendering escapes HTML special chars (Security NFR)`

---

### Task 11: Add performance test for tenant aggregate
**Maps to:** AC4, Performance NFR
**TDD:** Performance assertion

**Step 11a — Write performance test**

Test that tenant board with 10 products aggregates in under 500ms.

**Commit message:** `test: verify tenant kanban aggregation meets performance target (Performance NFR)`

---

## Summary

- **11 tasks** — each maps to one or more ACs
- **All 6 ACs covered** — no gaps
- **All 14 tests covered** — U1–U9 (unit), IT1–IT3 (integration), 2 NFR
- **No scope creep** — only removes deprecated routes, generalizes one renderer
- **TDD discipline** — test-first approach for every task

Estimated 3–4 hours for full execution.
