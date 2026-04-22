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

**T11 — index-html-overlay-marker**
`dashboards/index.html` contains `md-editor-overlay`. Fail if absent.

**T12 — index-html-editor-open**
`dashboards/index.html` contains `editorOpen` (state variable that controls the overlay in MdViewer). Fail if absent.

**T13 — index-html-clipboard**
`dashboards/index.html` contains `navigator.clipboard`. Fail if absent.

**T14 — index-html-download**
`dashboards/index.html` contains `createObjectURL`. Fail if absent.

**T15 — pipeline-review-server-integration**
`dashboards/pipeline.html` contains `REVIEW_SERVER` constant (server integration for save). Fail if absent.

**T16 — pipeline-server-up-state**
`dashboards/pipeline.html` contains `serverUp` (server health state variable). Fail if absent.

**T17 — index-review-server-integration**
`dashboards/index.html` contains `REVIEW_SERVER` constant. Fail if absent.

**T18 — index-server-up-state**
`dashboards/index.html` contains `serverUp`. Fail if absent.

**T19 — index-mdviewer-fullscreen**
`dashboards/index.html` contains `inset:0` or `inset: 0` (full-screen MdViewer overlay CSS). Fail if absent.

**T20 — index-mdviewer-link-intercept**
`dashboards/index.html` contains `artefacts/` and `preventDefault` in proximity — i.e. the traceability link-click interception handler. Check that both strings are present in the file. Fail if either is absent.

---

## Test script

`tests/check-me1-dashboard-editor.js`
