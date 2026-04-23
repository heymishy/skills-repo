# Definition of Done: cv.1 — Canvas artefact relationship views

**PR:** commit `5f58cb3` (merged directly to master 2026-04-22 — "feat: cross-dashboard UX consistency — site-nav, save, filter persistence")
**Story:** artefacts/2026-04-22-canvas-views/stories/cv.1-canvas-views.md
**Test plan:** artefacts/2026-04-22-canvas-views/test-plans/cv.1-test-plan.md
**DoR artefact:** artefacts/2026-04-22-canvas-views/dor/cv.1-canvas-views-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-23

> **Retrospective note:** Implementation was committed directly to master (commit `5f58cb3`) on 2026-04-22 without a formal feature branch/PR cycle. DoR artefact was created retrospectively on 2026-04-23 before this DoD. All 20 governance tests pass on master (confirmed 2026-04-23).

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — canvas.html exists, React 18, dual-URL | ✅ | T1 PASS: file exists; T2 PASS: react@18 CDN; T3 PASS: dual-URL strings present | Automated governance test (check-cv1-canvas-views.js) | None |
| AC2 — four-tab view bar | ✅ | T4 PASS: "Story Map"; T5 PASS: "Artefact Tree"; T6 PASS: "Timeline"; T7 PASS: "Dependency" | Automated governance test | None |
| AC3 — Patton story map with backbone + bands | ✅ | T14 PASS: SM_BANDS present; T15 PASS: sm-activity-cell present | Automated governance test | None |
| AC4 — Artefact Tree with presence indicators | ✅ | T9 PASS: artefact-fetcher.js referenced; T8 PASS: renderMarkdown present | Automated governance test | None |
| AC5 — Timeline view | ✅ | T6 PASS: "Timeline" tab label present | Automated governance test | None |
| AC6 — SVG Dependency Graph | ✅ | T7 PASS: "Dependency" tab; T11 PASS: SVG/createElementNS present | Automated governance test | None |
| AC7 — Side reader panel with renderMarkdown | ✅ | T8 PASS: renderMarkdown call present | Automated governance test | None |
| AC8 — ← Pipeline nav link | ✅ | T10 PASS: index.html link present | Automated governance test | None |
| AC9 — Live Server compatible, ArtefactFetcher | ✅ | T3 PASS: dual-URL fallback; T9 PASS: artefact-fetcher.js referenced | Automated governance test | None |
| AC10 — Governance test passes | ✅ | All 20 tests PASS (20/20) on master 2026-04-23 | Automated governance test | None |
| AC11 — Filter bar with chips | ✅ | T12 PASS: FilterBar component + filter-chip class; T13 PASS: inferProgramme helper | Automated governance test | None |
| AC12 — Filter localStorage persistence | ✅ | T16 PASS: localStorage usage confirmed | Automated governance test | None |
| AC13 — Filter overflow dropdown | ✅ | T17 PASS: filter-select element present | Automated governance test | None |
| AC14 — SidePanel MdEditorOverlay with Save | ✅ | T18 PASS: REVIEW_SERVER constant; T19 PASS: site-nav present; T20 PASS: md-editor-overlay present | Automated governance test | None |

**ACs satisfied: 14/14**
**Deviations: None**

---

## Scope Deviations

None. All four views delivered as specified in discovery. AC11–AC14 (FilterBar, localStorage, overflow dropdown, MdEditorOverlay) are within the discovery MVP scope and consistent with the story ACs.

---

## Test Plan Coverage

**Tests from plan implemented:** 20/20
**Tests passing in CI:** 20/20 (confirmed `node tests/check-cv1-canvas-views.js` → 20 passed, 0 failed, 2026-04-23)

| Test | Implemented | Passing |
|------|-------------|---------|
| T1 — canvas-html-exists | ✅ | ✅ |
| T2 — canvas-react-cdn | ✅ | ✅ |
| T3 — dual-url-loader | ✅ | ✅ |
| T4 — tab-story-map | ✅ | ✅ |
| T5 — tab-artefact-tree | ✅ | ✅ |
| T6 — tab-timeline | ✅ | ✅ |
| T7 — tab-dependency-graph | ✅ | ✅ |
| T8 — render-markdown | ✅ | ✅ |
| T9 — artefact-fetcher | ✅ | ✅ |
| T10 — pipeline-nav-link | ✅ | ✅ |
| T11 — svg-dependency-view | ✅ | ✅ |
| T12 — filter-bar-component | ✅ | ✅ |
| T13 — infer-programme-helper | ✅ | ✅ |
| T14 — story-map-release-bands | ✅ | ✅ |
| T15 — patton-backbone-structure | ✅ | ✅ |
| T16 — filter-localstorage-persistence | ✅ | ✅ |
| T17 — filter-overflow-dropdown | ✅ | ✅ |
| T18 — canvas-review-server-integration | ✅ | ✅ |
| T19 — canvas-site-nav | ✅ | ✅ |
| T20 — canvas-md-editor-overlay | ✅ | ✅ |

**Gaps:** None.

---

## NFR Status

No NFRs defined for this story. Pure dashboard HTML extension — no performance SLA, no compliance scope, no sensitive data.

✅ **NFR check: No NFRs defined** — confirmed not applicable 2026-04-23.

---

## Metric Signal

No `metrics` array defined for the `2026-04-22-canvas-views` feature in pipeline-state.json. This is a short-track dashboard extension; no formal benefit metric was defined at discovery.

**Observable outcome:** `dashboards/canvas.html` is live on master and accessible to all pipeline users. The four views (Story Map, Artefact Tree, Timeline, Dependency Graph) are functional. This directly addresses the discovery problem statement: "The pipeline dashboard presents features as flat cards. This hides the hierarchical and sequential structure that product managers, BAs, and architects care about."

---

## Outcome

**Definition of done: COMPLETE ✅**

ACs satisfied: 14/14
Deviations: None
Test gaps: None
NFR gaps: None (no NFRs in scope)
