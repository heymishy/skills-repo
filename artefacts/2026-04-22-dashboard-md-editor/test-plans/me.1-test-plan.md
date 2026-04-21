# Test plan: me.1 — Dashboard full-screen markdown editor

**Story:** me.1
**Feature:** 2026-04-22-dashboard-md-editor

---

## Tests

**T1 — editor-file-exists**
`pipeline.html` exists in `dashboards/`. Fail if absent.

**T2 — editor-overlay-marker**
`dashboards/pipeline.html` contains the string `md-editor-overlay`. Fail if absent.

**T3 — copy-button-present**
`dashboards/pipeline.html` contains the string `Copy`. Fail if absent.

**T4 — download-button-present**
`dashboards/pipeline.html` contains the string `Download`. Fail if absent.

**T5 — escape-key-handler**
`dashboards/pipeline.html` contains `Escape` (key handler for closing the overlay). Fail if absent.

**T6 — editor-css-rule**
`dashboards/extra-views.css` contains `.md-editor-overlay`. Fail if absent.

**T7 — edit-button-present**
`dashboards/pipeline.html` contains `editorOpen` (state variable that controls the overlay). Fail if absent.

**T8 — clipboard-api**
`dashboards/pipeline.html` contains `navigator.clipboard` (clipboard copy implementation). Fail if absent.

**T9 — download-impl**
`dashboards/pipeline.html` contains `createObjectURL` (download implementation). Fail if absent.

**T10 — pipeline-html-syntax-clean**
`node --check dashboards/pipeline.html` (JS syntax check). Pass if exit 0. Note: pipeline.html contains JSX so this test is advisory; the check-dashboard-viz.js already runs JS-only files.

---

## Test script

`tests/check-me1-dashboard-editor.js`
