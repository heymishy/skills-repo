## Test Plan: Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label

**Story reference:** artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/stories/cmba-s1-fix-readonly-maximise-and-stuck-button-label.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Diagram-maximise button works on read-only/historical views, no console error | 2 tests | — | — | — | — | 🔴 |
| AC2 | Artefact-panel fullscreen toggle works on read-only/historical views | 1 test | — | — | — | — | 🔴 |
| AC3 | No regression to live (non-read-only) session maximise/fullscreen behaviour | 1 test | — | — | — | — | 🟢 |
| AC4 | Bulk-assign button label resets after a successful assign | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs have direct test coverage. AC1/AC2 marked 🔴 since this is the live, currently-broken `ReferenceError` bug operators hit today.

---

## Test Data Strategy

**Source:** Synthetic — minimal `renderChat()` data fixtures (design/ideate skill shapes, `readOnly: true`/`false`/omitted), following the exact fixture pattern already established in `tests/check-cdpl-s1-canvas-panel-layout-fix.js`.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in a new file, `tests/check-cmba-s1-readonly-maximise-and-stuck-label.js`, following this repo's plain-Node `renderChat()`-direct-call pattern (no server, no fixtures) established by `check-cdpl-s1-canvas-panel-layout-fix.js`/`check-inc4-canvas-panel.js`, plus a targeted string check against `src/web-ui/routes/products.js`'s rendered HTML for AC4.

### AC1a: `swToggleCanvasFs`/`swExpandCanvas` are defined in a read-only render

- **Verifies:** AC1.
- **Action:** `renderChat({...designData, readOnly: true})`. Search the returned HTML for `function swToggleCanvasFs` and `function swExpandCanvas` definitions (reusing the `extractFnBody` helper already defined in `check-cdpl-s1-canvas-panel-layout-fix.js` — copy the helper into the new test file, matching this repo's convention of small per-file test helpers over a shared test-utils module).
- **Expected result:** Both functions are present and non-null in the read-only-rendered HTML. Today (pre-fix) they are absent, since the entire `scriptHtml` block — including these two functions — is suppressed when `data.readOnly` is true.
- **Edge case:** Written to fail against the current code — this is the primary regression case.

### AC1b: the maximise-diagrams button markup references the now-available function

- **Verifies:** AC1.
- **Action:** Same read-only render. Confirm `<button id="sw-canvas-fs-btn" ... onclick="swToggleCanvasFs()"` (and the ideate layout's `<button id="sw-expand-canvas" ... onclick="swExpandCanvas()"`) are present in the HTML (already true today — the button markup itself was never gated on `readOnly`) AND that the function they call (from AC1a) is actually defined in the same render output — i.e. the wiring is real, not just present syntactically.
- **Expected result:** Button markup + function definition both present in the same read-only render.

### AC2: `swToggleArtefactFs` is defined in a read-only render

- **Verifies:** AC2.
- **Action:** Same read-only render (`design`/`definition` skill data, which uses the `sw-artefact-pane` layout). Confirm `function swToggleArtefactFs` is present via `extractFnBody`.
- **Expected result:** Present. Today (pre-fix) it is absent for the same root-cause reason as AC1.

### AC3: live (non-read-only) session behaviour is unchanged

- **Verifies:** AC3 — regression guard.
- **Action:** `renderChat({...designData, readOnly: false})` (and the existing default/omitted-`readOnly` case, matching pre-existing test coverage). Confirm: (a) `swToggleCanvasFs`, `swExpandCanvas`, `swToggleArtefactFs` are all still present (as they always were for live sessions); (b) the live-session-only script content NOT meant to run on a read-only page (the SSE-pump condition-item append logic, the Cmd/Ctrl+Enter submit-form keydown handler) is also still present for live sessions; (c) the `<footer>` input form is still rendered (untouched by this story, but confirms the surrounding `readOnly` branching elsewhere in the file wasn't accidentally disturbed).
- **Expected result:** All three hold — this is the exact live-session behaviour already passing today, must remain unchanged after the fix moves the three toggle functions into their own always-emitted block.

### AC4: bulk-assign button label resets after a successful assign

- **Verifies:** AC4.
- **Action:** Call the module-view rendering function in `src/web-ui/routes/products.js` that emits `bmauAssignToModule`'s client-side script (the same function `check-bmau-s1-bulk-assign-checkbox-ui.js` already exercises — reuse its existing setup, do not re-derive a new fixture). Extract `bmauAssignToModule`'s function body (via the same `extractFnBody`-style helper). Locate the `.then(function(){...})` success-handler block (after `bmauUpdateSelection();`, before the `.catch(...)`) and assert it contains `btn.disabled=false` and `btn.textContent=origText` — the same reset already present in the `.catch()` block.
- **Expected result:** The reset statements are present in the success handler. Today (pre-fix) they are only in `.catch()`.
- **Edge case:** Written to fail against the current code.

---

## Integration Tests

None beyond the existing regression suites confirmed unaffected (see AC3 above, which itself doubles as the integration-level regression check for this story's own file).

---

## E2E Tests

None. This story's own Architecture Constraints scope the fix to string/DOM-content-level changes verifiable via direct function calls against the rendering modules — matching the precedent `bmau-s1`'s own test plan set (AC3 there, a visually-observable re-render, was routed to a dedicated Playwright spec; AC4 here is a plain string/logic check on the success-handler body, not a rendered-DOM visual assertion, so no E2E tooling is required).

---

## NFR Tests

None named — the story's own NFR section states "None identified" for all four categories (Performance, Security, Accessibility, Audit).

---

## Out of Scope for This Test Plan

- Any change to the diagram-rendering mechanism, artefact-panel content, or `bulkAssignFeaturesToModule` endpoint contract — story's own Out of Scope, all reused as-is and untested here (already covered by their own existing suites).
- A broader audit for the same readOnly-suppressed-script pattern recurring elsewhere in the codebase — story's own Out of Scope; scoped to the three named functions only.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
