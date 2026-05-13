# Test Plan: dviz.3 — Governance: extend viz-check to dashboards/

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.3-governance-check`
**Status:** Failing (tests written to fail — TDD discipline)

---

## Test file

`tests/check-dviz3-dashboard-governance.js`

---

## Automated tests

### T1 — check-dashboard-viz.js exists

**Type:** Static existence check
**Assertion:** `tests/check-dashboard-viz.js` exists.
**Fails now:** yes

---

### T2 — check-dashboard-viz.js syntax clean

**Type:** JS syntax check
**Assertion:** `node --check tests/check-dashboard-viz.js` exits 0.
**Fails now:** yes (file doesn't exist)

---

### T3 — check-dashboard-viz.js scans dashboards/ directory dynamically

**Type:** Static analysis
**Assertion:** `tests/check-dashboard-viz.js` source does NOT contain a hardcoded array of filenames. It uses `fs.readdirSync` (or equivalent) to discover `*.js` files under `dashboards/`.
**Fails now:** yes

---

### T4 — check-dashboard-viz.js runs node --check on each file

**Type:** Static analysis
**Assertion:** `tests/check-dashboard-viz.js` calls `execFileSync(process.execPath, ['--check', filePath])` (or equivalent) for each discovered JS file.
**Fails now:** yes

---

### T5 — package.json includes check-dashboard-viz in test chain

**Type:** Static analysis of package.json
**Assertion:** `package.json` `scripts.test` string contains `node tests/check-dashboard-viz.js`.
**Fails now:** yes

---

### T6 — all current dashboards/*.js files are syntax-clean (integration)

**Type:** Integration
**Assertion:** Running `node tests/check-dashboard-viz.js` from the repo root exits 0 against the actual `dashboards/` directory (covering `pipeline-adapter.js`, `extra-data.js`, `artefact-content.js`, `md-renderer.js`).
**Note:** This test will fail until `pipeline-adapter.js` is created (dviz.1 dependency). A conditional skip is acceptable when the adapter does not yet exist.
**Fails now:** yes

---

### T7 — check-dashboard-viz.js emits actionable error on syntax failure

**Type:** Static analysis
**Assertion:** The error-path in `tests/check-dashboard-viz.js` emits `process.stderr.write(...)` before calling `process.exit(1)`. The emitted string includes the filename.
**Fails now:** yes

---

## Manual / acceptance verification

**MVS-1:** Introduce a deliberate syntax error in `dashboards/extra-data.js` (e.g. `const x = {;`). Run `node tests/check-dashboard-viz.js`. Confirm: exit code 1, error message names the file. Revert the change.

**MVS-2:** Run `npm test`. Confirm the full suite passes with the new `check-dashboard-viz` section showing `N passed, 0 failed`.

---

## Test data strategy

No external files required — the test script operates on the `dashboards/` directory in the repo itself. No mock files needed; the actual JS files are the test fixtures.
