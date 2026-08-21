# Contract Proposal: Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label

**Story reference:** artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/stories/cmba-s1-fix-readonly-maximise-and-stuck-button-label.md
**Prepared by:** Claude (agent)
**Date:** 2026-08-21
**Status:** ✅ Reviewed — no mismatches

---

## What will be built

- `src/web-ui/views/chat-view.js`: split `swToggleCanvasFs`, `swExpandCanvas`, and `swToggleArtefactFs` out of the `data.readOnly ? '' : (...)`-gated `scriptHtml` block into their own always-emitted `<script>` block, so they exist regardless of `readOnly`. The rest of `scriptHtml` (SSE-pump condition-item append logic, the Cmd/Ctrl+Enter submit handler) stays gated on `readOnly` exactly as today — none of that applies to a historical page with no live session.
- `src/web-ui/routes/products.js`: `bmauAssignToModule()`'s success `.then()` handler gains `btn.disabled=false;btn.textContent=origText;` at the end (after `bmauUpdateSelection();`), mirroring the existing `.catch()` handler's reset.

## What will NOT be built

- No change to the diagram-rendering mechanism, artefact-panel content, or the `bulkAssignFeaturesToModule` endpoint's contract — all reused exactly as-is.
- No broader audit for the same readOnly-suppressed-script pattern elsewhere in the codebase — scoped to the three named functions only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (maximise-diagrams works read-only) | `renderChat({readOnly:true})`, assert `swToggleCanvasFs`/`swExpandCanvas` function bodies + button wiring present | unit |
| AC2 (artefact fullscreen toggle works read-only) | Same render, assert `swToggleArtefactFs` present | unit |
| AC3 (no regression to live-session behaviour) | `renderChat({readOnly:false})`, assert all 3 functions + live-only script content + footer form still present | unit (regression) |
| AC4 (bulk-assign label resets) | Extract `bmauAssignToModule`'s success-handler body, assert reset statements present | unit |

## Assumptions

- `renderChat()`'s exported signature and the `data.readOnly` flag's semantics are unchanged by this story — confirmed via direct code read of `chat-view.js` before writing the test plan.
- No other call site relies on the three toggle functions being absent when `readOnly` is true (confirmed: their absence today is purely a bug, not a deliberate feature-gate — the button markup that calls them renders unconditionally).

## Estimated touch points

- 2 files changed: `src/web-ui/views/chat-view.js`, `src/web-ui/routes/products.js`
- 1 new test file: `tests/check-cmba-s1-readonly-maximise-and-stuck-label.js`
- 0 new dependencies

---

**Contract review result:** ✅ Passed — proposed implementation aligns with all 4 ACs; no mismatches identified.
