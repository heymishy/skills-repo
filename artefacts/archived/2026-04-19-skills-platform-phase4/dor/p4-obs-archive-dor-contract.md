# DoR Contract: p4-obs-archive — Story/epic archive toggle for viz

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-obs-archive.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-obs-archive-dor.md
Signed: 2026-04-20
Oversight: Medium — peer review required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `scripts/archive-completed-features.js` | Extend — add `archiveStories()` export; do not alter existing exports |
| `dashboards/pipeline-viz.html` | Inline toggle logic — archived badge, expand/collapse, `?showArchived=true` support |
| `.github/pipeline-state.schema.json` | Add `archivedStoryCount` field |
| `tests/check-p4-obs-archive.js` | New test file — 12 tests covering all ACs |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `dashboards/artefact-content.js` | Not related |
| `dashboards/artefact-fetcher.js` | Not related |
| `dashboards/extra-data.js` | Not related |
| `dashboards/md-renderer.js` | Not related |
| `dashboards/pipeline-adapter.js` | Not related |
| Any new `dashboards/*.js` file | Architecture constraint — no new external JS files in dashboards/ |
| `dashboards/extra-views.css` | No new external CSS files |
| `.github/pipeline-state.json` | State data — coding agent does not modify production state |
| `artefacts/`, `.github/skills/`, `standards/` | Pipeline artefacts — no changes |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| psa.1 (`archive-completed-features.js`) | DoD-complete ✅; `archive()` and `mergeState()` exports present |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | `archiveStories` moves DoD-complete stories; active state gets `archivedStoryCount` | T1, T2, T3 |
| AC2 | `mergeState()` reconstitutes archived stories with `archived: true` | T4, T5 |
| AC3 | Viz: badge shows N archived; rows hidden by default; toggle expands/collapses | T6, T7 |
| AC4 | `?showArchived=true` shows archived rows with muted style | T8, T9 |
| AC5 | 50+ story fixture renders and toggles without error | T10 |

---

## Architecture Constraints (binding)

- ADR-001: CommonJS for script extension
- Single-file HTML: all new viz JS/CSS inline in `pipeline-viz.html` only — no new external files
- Schema: `archivedStoryCount` added to `pipeline-state.schema.json` alongside implementation
- CSS class names: kebab-case (`story-row-archived`, `epic-archive-badge`)
- MC-SEC-02: no credentials in archive payload
