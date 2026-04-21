# Definition of Ready: me.1 — Dashboard full-screen markdown editor

**Story:** me.1
**Feature:** 2026-04-22-dashboard-md-editor
**DoR sign-off:** 2026-04-22

---

## Hard blocks

- **H1 — Story exists and is scoped:** ✅ `artefacts/2026-04-22-dashboard-md-editor/stories/me.1-dashboard-md-editor.md`
- **H2 — Test plan exists:** ✅ `artefacts/2026-04-22-dashboard-md-editor/test-plans/me.1-test-plan.md`
- **H3 — No HIGH review findings:** ✅ (no external dependency, no security risk — read-only artefact viewer/editor with client-side-only copy/download)
- **H4 — Artefact-first rule met:** ✅ Artefact chain committed before implementation
- **H5 — Scope is clear:** ✅ 10 ACs, single file touchpoints defined in DoR contract

## Coding Agent Instructions

**Proceed: Yes**

### What to implement

Add a full-screen markdown editor overlay to `dashboards/pipeline.html` and add supporting CSS to `dashboards/extra-views.css`.

### Exact file touchpoints

See `dor/me.1-dor-contract.md` for the complete list.

### Implement in order

1. Add `.md-editor-overlay` CSS to `dashboards/extra-views.css`
2. Add `MdEditorOverlay` React component to `dashboards/pipeline.html` (before `ArtefactDrawer`)
3. Wire `editorOpen` state + "Edit" button into `ArtefactDrawer`
4. Add `tests/check-me1-dashboard-editor.js`
5. Add `check-me1-dashboard-editor.js` to `package.json` test chain
6. Run `npm test` — verify pass
7. Add CHANGELOG entry

### Key constraints

- No external dependencies
- No save-to-server functionality
- Download uses `URL.createObjectURL` + `<a download>` pattern
- Copy uses `navigator.clipboard.writeText`
- Must not break any existing tests
