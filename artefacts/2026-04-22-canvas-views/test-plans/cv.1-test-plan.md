# Test plan: cv.1 — Canvas artefact relationship views

**Story:** cv.1
**Feature:** 2026-04-22-canvas-views

---

## Tests

**T1 — canvas-html-exists**
`dashboards/canvas.html` exists. Fail if absent.

**T2 — canvas-react-cdn**
`dashboards/canvas.html` contains `react@18` (CDN script tag). Fail if absent.

**T3 — dual-url-loader**
`dashboards/canvas.html` contains `pipeline-state.json` AND `../.github/pipeline-state.json` (dual-URL candidate strings). Fail if either is absent.

**T4 — tab-story-map**
`dashboards/canvas.html` contains the string `Story Map` (tab label). Fail if absent.

**T5 — tab-artefact-tree**
`dashboards/canvas.html` contains the string `Artefact Tree` (tab label). Fail if absent.

**T6 — tab-timeline**
`dashboards/canvas.html` contains the string `Timeline` (tab label). Fail if absent.

**T7 — tab-dependency-graph**
`dashboards/canvas.html` contains the string `Dependency` (tab label — covers "Dependency Graph"). Fail if absent.

**T8 — render-markdown**
`dashboards/canvas.html` contains `renderMarkdown` (side-panel reader call). Fail if absent.

**T9 — artefact-fetcher**
`dashboards/canvas.html` contains `artefact-fetcher.js` (script src reference). Fail if absent.

**T10 — pipeline-nav-link**
`dashboards/canvas.html` contains `index.html` (← Pipeline link). Fail if absent.

**T11 — svg-dependency-view**
`dashboards/canvas.html` contains `<svg` or `createElementNS` (SVG dependency graph rendering). Fail if absent.

**T12 — filter-bar-component**
`dashboards/canvas.html` contains `FilterBar` (filter bar React component) and `filter-chip` (CSS class applied to individual filter buttons). Fail if either is absent.

**T13 — infer-programme-helper**
`dashboards/canvas.html` contains `inferProgramme` (the helper function that derives programme grouping from feature slugs). Fail if absent.

**T14 — story-map-release-bands**
`dashboards/canvas.html` contains `SM_BANDS` (the release-slice band definitions: Shipped / In Flight / Backlog). Fail if absent.

**T15 — patton-backbone-structure**
`dashboards/canvas.html` contains `sm-activity-cell` (the CSS class marking the Feature/Activity row in the Patton backbone). Fail if absent.

**T16 — filter-localstorage-persistence**
`dashboards/canvas.html` contains `localStorage` (filter state is persisted and restored across page loads via `localStorage` key `cv-filter`). Fail if absent.

**T17 — filter-overflow-dropdown**
`dashboards/canvas.html` contains `filter-select` (the `<select>` element rendered in overflow mode when `features.length > 8`). Fail if absent.

**T18 — canvas-review-server-integration**
`dashboards/canvas.html` contains `REVIEW_SERVER` (the server base URL constant for `callSave`). Fail if absent.

**T19 — canvas-site-nav**
`dashboards/canvas.html` contains `site-nav` (the cross-page `<nav className="site-nav">` navigation bar linking all four dashboard pages). Fail if absent.

**T20 — canvas-md-editor-overlay**
`dashboards/canvas.html` contains `md-editor-overlay` (`MdEditorOverlay` component rendered inside `SidePanel` when Edit is clicked). Fail if absent.

## Test script

`tests/check-cv1-canvas-views.js`
