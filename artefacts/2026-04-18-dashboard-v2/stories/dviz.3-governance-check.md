# Story: dviz.3 — Governance: extend viz-check to dashboards/

**Feature:** `2026-04-18-dashboard-v2`
**Story ID:** `dviz.3`
**Epic:** Dashboard v2 — live data wiring
**Type:** Governance/tooling
**Complexity:** 1
**Oversight level:** Low

---

## User story

As a platform maintainer,
I want the `npm test` suite to catch JS syntax errors in `dashboards/*.js` files (including `pipeline-adapter.js`),
So that a broken dashboard is caught at pre-commit / CI before it ships to GitHub Pages.

---

## Background / context

`.github/scripts/check-viz-syntax.js` (the `viz-check` step in `npm test`) currently only checks `.github/pipeline-viz.html` inline script blocks. It does not cover `dashboards/pipeline-adapter.js`, `dashboards/extra-data.js`, `dashboards/artefact-content.js`, or `dashboards/md-renderer.js`.

This story adds a new `tests/check-dashboard-viz.js` governance check script that:
1. Locates all `*.js` files under `dashboards/`
2. Runs `node --check` on each
3. Passes (exit 0) when all files are syntax-clean
4. Fails (exit 1) on the first syntax error, emitting the filename and error

The new test is added to the `npm test` chain in `package.json`.

---

## Acceptance criteria

**AC1:** A file `tests/check-dashboard-viz.js` exists. Running `node tests/check-dashboard-viz.js` from the repo root exits 0 when all `dashboards/*.js` files are syntax-clean.

**AC2:** `node tests/check-dashboard-viz.js` exits 1 and prints an actionable error message (filename + Node syntax error) when any `dashboards/*.js` file contains a deliberate syntax error. The test itself does NOT need a live broken file; the test script's logic must demonstrate this path via code inspection (i.e. the test suite `tests/check-dashboard-viz.test.js` verifies the exit-0 / exit-1 paths).

**AC3:** `package.json` `scripts.test` chain includes `node tests/check-dashboard-viz.js` (positioned after `viz-check`).

**AC4:** `npm test` passes with the new check included against the actual `dashboards/*.js` files (all currently syntax-clean).

**AC5:** `check-dashboard-viz.js` does not hardcode a list of filenames — it scans the `dashboards/` directory at runtime (so new `.js` files added later are covered automatically without changing the script).

---

## Out of scope

- Coverage of `dashboards/index.html` inline `<script type="text/babel">` blocks — Babel JSX in a `text/babel` script cannot be syntax-checked by `node --check` directly. This is explicitly excluded; a separate story can address it if warranted.
- Modifying the existing `check-viz-syntax.js` script.
- End-to-end browser rendering tests.
