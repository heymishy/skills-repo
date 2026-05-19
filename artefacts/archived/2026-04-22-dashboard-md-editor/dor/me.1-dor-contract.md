# DoR Contract: me.1 — Dashboard full-screen markdown editor

**Story:** me.1
**Feature:** 2026-04-22-dashboard-md-editor

---

## Files to modify

| File | Change |
|---|---|
| `dashboards/pipeline.html` | Add `MdEditorOverlay` component; wire `editorOpen` state + Edit button into `ArtefactDrawer` |
| `dashboards/extra-views.css` | Add `.md-editor-overlay` and child element CSS rules |

## Files to create

| File | Purpose |
|---|---|
| `tests/check-me1-dashboard-editor.js` | Governance test for me.1 (T1–T9) |

## Files to update (bookkeeping)

| File | Change |
|---|---|
| `package.json` | Add `check-me1-dashboard-editor.js` to test chain |
| `CHANGELOG.md` | Add me.1 entry under `### Added` |

## Out-of-scope files (do not touch)

- `dashboards/md-renderer.js` — no change needed; `window.renderMarkdown` is consumed as-is
- `dashboards/artefact-fetcher.js` — no change needed
- `dashboards/artefact-content.js` — no change needed
- `dashboards/index.html` — no change needed
- `dashboards/pipeline-viz.html` — no change needed
- Any file under `artefacts/`, `.github/skills/`, `.github/templates/`, `standards/`
