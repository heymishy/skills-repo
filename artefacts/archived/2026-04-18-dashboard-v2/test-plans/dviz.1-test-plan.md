# Test Plan: dviz.1 — Pipeline data adapter

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.1-pipeline-adapter`
**Status:** Failing (tests written to fail — TDD discipline)

---

## Test file

`tests/check-dviz1-adapter.js`

---

## Automated tests

### T1 — adapter file exists

**Type:** Static existence check
**Command:** `node tests/check-dviz1-adapter.js`
**Assertion:** File `dashboards/pipeline-adapter.js` exists.
**Fails now:** yes

---

### T2 — adapter syntax clean

**Type:** JS syntax check
**Command:** `node --check dashboards/pipeline-adapter.js`
**Assertion:** exits 0 (no syntax errors).
**Fails now:** yes (file doesn't exist)

---

### T3 — index.html loads pipeline-adapter.js before babel script

**Type:** Static analysis of HTML
**Assertion:** `dashboards/index.html` contains `<script src="pipeline-adapter.js">` and that `<script>` tag appears before the `<script type="text/babel"` block.
**Fails now:** yes

---

### T4 — CYCLES/EPICS references removed from babel script inline mock

**Type:** Static analysis of HTML
**Assertion:** The line `// CYCLES + EPICS + STORIES — realistic mock` is no longer present in `index.html` (the hardcoded inline mock arrays have been removed from the Babel script block and replaced with reads from `window.CYCLES`, `window.EPICS`).
**Fails now:** no (currently present — will fail once implemented)

---

### T5 — adapter exports window.CYCLES and window.EPICS

**Type:** Unit test (Node — jsdom or plain module execution)
**Assertion:** When `pipeline-adapter.js` is executed with a minimal `window.__PIPELINE_STATE__ = { features: [...] }` seed, `window.CYCLES` and `window.EPICS` are defined and non-empty arrays.
**Fails now:** yes

---

### T6 — stage→phase mapping covers all 12 pipeline stages

**Type:** Unit test
**Assertion:** For each of the 12 pipeline stage strings list in the story background (discovery, benefit-metric, definition, review, test-plan, definition-of-ready, issue-dispatch, subagent-execution, ci-assurance, definition-of-done, trace, improve), the adapter's `stageToPhaseKey()` returns a non-null value matching the PHASES constant keys.
**Fails now:** yes

---

### T7 — dodStatus:complete → state "done"

**Type:** Unit test
**Assertion:** `deriveStoryState({ dodStatus: "complete", health: "green", stage: "definition-of-done" })` returns `"done"`.
**Fails now:** yes

---

### T8 — health:red → state "blocked"

**Type:** Unit test
**Assertion:** `deriveStoryState({ health: "red", stage: "definition", dodStatus: null })` returns `"blocked"`.
**Fails now:** yes

---

### T9 — missing pipeline-state.json falls back to mock gracefully

**Type:** Static analysis
**Assertion:** `pipeline-adapter.js` contains a `catch` or fallback branch that assigns `window.CYCLES` from a `DEFAULT_MOCK` when `fetch` or the injected state is unavailable. No uncaught promise rejection.
**Fails now:** yes

---

### T10 — no credentials in adapter

**Type:** Static analysis (security — MC-SEC-02)
**Assertion:** `pipeline-adapter.js` does not contain any string matching `/api[_-]?key|token|secret|password|credential/i`.
**Fails now:** yes (file doesn't exist — will pass once file created correctly)

---

## Manual / acceptance verification

**MVS-1:** Open `dashboards/index.html` via a local static server (`python -m http.server 8080`) with `pipeline-state.json` accessible. Confirm the feature names match those in `pipeline-state.json`.

**MVS-2:** Rename `pipeline-state.json` temporarily. Reload the dashboard. Confirm it shows the mock data (or a graceful empty state) without a JS error in the console.

---

## Test data strategy

The adapter unit tests use a minimal in-process `window.__PIPELINE_STATE__` seed:

```json
{
  "features": [{
    "id": "test-feature-1",
    "name": "Test Feature",
    "slug": "2026-01-01-test",
    "stage": "definition",
    "health": "green",
    "updatedAt": "2026-01-01",
    "epics": [{
      "id": "e.t1",
      "name": "Epic One",
      "stage": "review",
      "health": "green",
      "stories": [
        { "slug": "t1.1", "stage": "review", "health": "green" },
        { "slug": "t1.2", "stage": "definition-of-done", "health": "green", "dodStatus": "complete" }
      ]
    }]
  }]
}
```

No real `pipeline-state.json` content is required for unit tests. The manual verification steps use the real file.
