# Implementation Plan: wuce.7 — Programme manager pipeline status view

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.7
**Date:** 2026-05-03
**Oversight:** High

---

## Loaded

**Story:** Programme manager pipeline status view
**ACs:** 5 | **Tests:** 19 (14 unit, 3 integration, 2 NFR) | **Arch constraints:** ADR-012 (getPipelineStatus adapter), ADR-003 (no new pipeline-state.json fields), server-side read access validation

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `tests/fixtures/github/pipeline-state-feature.json` | Create | General feature fixture with stories (reused across wuce.5–wuce.7) |
| `tests/fixtures/github/pipeline-state-done-feature.json` | Create | Done-feature fixture: all stories prStatus:merged + traceStatus:passed |
| `tests/fixtures/github/pipeline-state-trace-findings.json` | Create | Trace-findings fixture: at least one story traceStatus:has-findings |
| `tests/fixtures/github/pipeline-state-awaiting-dispatch.json` | Create | Awaiting-dispatch fixture: dorStatus:signed-off + prStatus:none |
| `src/web-ui/adapters/pipeline-status.js` | Create | getPipelineStatus(featureSlug, token) — reads pipeline-state.json via SCM adapter; validates access |
| `src/web-ui/utils/status-board.js` | Create | deriveBlockerIndicator, deriveFeatureStatusLabel, isFeatureDone, renderStatusBoard |
| `src/web-ui/utils/status-export.js` | Create | exportStatusAsMarkdown — returns markdown table string |
| `src/web-ui/routes/status.js` | Create | GET /status + GET /status/export route handlers |
| `src/web-ui/server.js` | Extend | Mount /status and /status/export routes in router |
| `tests/check-wuce7-programme-status-view.js` | Create | 19 AC-verification tests (T1–T6, IT1–IT3, NFR1–NFR2) |

---

## Task 1 — Create test fixtures (RED: fixtures don't exist yet)

### T1A: `tests/fixtures/github/pipeline-state-feature.json`

```json
{
  "slug": "2026-05-02-test-feature",
  "stage": "test-plan",
  "updatedAt": "2026-05-02T10:00:00Z",
  "lastActivityDate": "2026-05-02T10:00:00Z",
  "stories": [
    { "id": "tf.1", "prStatus": "draft",  "dorStatus": "signed-off", "traceStatus": "not-run" },
    { "id": "tf.2", "prStatus": "none",   "dorStatus": "not-started", "traceStatus": "not-run" }
  ]
}
```

### T1B–T1D: three additional wuce.7 fixtures (done, trace-findings, awaiting-dispatch)

See fixture content in implementation below.

**TDD step:** Running `node tests/check-wuce7-programme-status-view.js` before creating any source files produces: `Cannot find module '../src/web-ui/adapters/pipeline-status'`.

---

## Task 2 — Create `src/web-ui/adapters/pipeline-status.js` (RED → GREEN for T1.x)

Exports: `getPipelineStatus(featureSlug, token)`, `validateRepositoryAccess(featureSlug, token)`, `setFetcher(fn)`.

- `validateRepositoryAccess` returns `false` when token is falsy — no data served.
- `getPipelineStatus` calls validator first; throws `Error('Access denied')` on failure.
- `setFetcher(fn)` injects test fetcher — returns fixture data in tests.

**Run command:** `node tests/check-wuce7-programme-status-view.js`
**Expected (after this task):** T1.x pass; remaining tests still fail.

---

## Task 3 — Create `src/web-ui/utils/status-board.js` (RED → GREEN for T2.x, T3.x, T4.x, T6.x)

Exports: `deriveBlockerIndicator(feature)`, `deriveFeatureStatusLabel(stories)`, `isFeatureDone(feature)`, `renderStatusBoard(features)`.

Key invariants:
- `deriveBlockerIndicator` returns `"Trace findings"` (exact text) for `traceStatus:"has-findings"`, `null` otherwise.
- `deriveFeatureStatusLabel` returns `"Awaiting implementation dispatch"` (exact text) when any story has `dorStatus:"signed-off"` + `prStatus:"none"`.
- `isFeatureDone` requires ALL stories `prStatus:"merged"` AND `traceStatus:"passed"`; empty stories array → `false`.
- `renderStatusBoard` emits amber indicator class + text label (WCAG: colour not sole indicator); done features in `.done-section` separate from `.in-progress-section`.

**Run command:** `node tests/check-wuce7-programme-status-view.js`
**Expected:** T2.x, T3.x, T4.x, T6.x pass.

---

## Task 4 — Create `src/web-ui/utils/status-export.js` (RED → GREEN for T5.x)

Exports: `exportStatusAsMarkdown(features)`.
- Returns markdown table string with `| Feature | Stage | Last Activity | Status |` header.
- Empty array → header row + "No features" row; no throw.

**Run command:** `node tests/check-wuce7-programme-status-view.js`
**Expected:** T5.x pass.

---

## Task 5 — Create `src/web-ui/routes/status.js` + extend server.js (RED → GREEN for IT1–IT3, NFR1–NFR2)

Exports: `handleGetStatus(req, res)`, `handleGetStatusExport(req, res)`, `setLogger(logger)`.
- `GET /status`: requires session/auth → 401 if not; calls `getPipelineStatus`; logs `status_board_access` with userId + featureCount + timestamp.
- `GET /status/export`: requires auth; returns `Content-Type: text/markdown`.
- Server.js: add pathname checks for `/status` and `/status/export`.

**Run command:** `node tests/check-wuce7-programme-status-view.js`
**Expected:** All 19 tests pass.

---

## Commit message

```
feat: wuce.7 — Programme manager pipeline status view

- src/web-ui/adapters/pipeline-status.js: getPipelineStatus adapter with
  validateRepositoryAccess; setFetcher() injection for tests
- src/web-ui/utils/status-board.js: deriveBlockerIndicator ("Trace findings"),
  deriveFeatureStatusLabel ("Awaiting implementation dispatch"), isFeatureDone
  (all merged+passed), renderStatusBoard (amber+text, done section separated)
- src/web-ui/utils/status-export.js: exportStatusAsMarkdown (table)
- src/web-ui/routes/status.js: GET /status + GET /status/export (auth-gated,
  audit-logged)
- src/web-ui/server.js: mount /status routes
- tests/check-wuce7-programme-status-view.js: 19 AC-verification tests
- tests/fixtures/github/pipeline-state-*.json: 4 fixtures (feature, done,
  trace-findings, awaiting-dispatch)
- ADR-003: no new pipeline-state.json fields
- ADR-012: getPipelineStatus adapter pattern
```
