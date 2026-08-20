## Story: Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label

**Epic reference:** None — short-track, closing two unrelated UI bugs found during the same live-Chrome verification pass
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator resuming a past `/design` or `/definition` conversation, or bulk-assigning stories to modules**,
I want **the diagram/artefact maximise buttons to actually work on historical views, and the bulk-assign button to correctly reset its label after use**,
So that **I can view diagrams full-screen after resuming a session, and the bulk-assign control doesn't look permanently stuck after its first successful use**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure) — closes two real, live-confirmed bugs found during retroactive DoD live-Chrome verification of `cdpl-s1` and `bmau-s1` (2026-08-21):
1. **Higher severity (`cdpl-s1`, AC3/AC4):** on any read-only/historical resumed conversation, clicking "Maximise diagrams" (or the ideate layout's "Maximise canvas") throws `ReferenceError: swToggleCanvasFs is not defined` (confirmed live, twice, via browser console) and does nothing. Root cause: `src/web-ui/views/chat-view.js:156` — `const scriptHtml = data.readOnly ? '' : (...)` — suppresses the entire script block containing `swToggleCanvasFs`/`swExpandCanvas`/`swToggleArtefactFs` for read-only views, but the button markup for all three is rendered unconditionally. This is a pre-existing pattern (`swToggleArtefactFs` has the identical bug, independently confirmed), not unique to `cdpl-s1` — `cdpl-s1` inherited it by correctly following its own architecture constraint to reuse the existing pattern.
2. **Lower severity, cosmetic (`bmau-s1`, related to AC2/AC3):** the "Assign to module" button's label stays stuck on "Assigning…" forever after the first successful bulk-assign in a session, even though the button remains functionally clickable and correctly re-enables/disables based on checkbox state. Root cause: `src/web-ui/routes/products.js`'s `bmauAssignToModule()` success handler never resets `btn.textContent`, unlike its `.catch()` error handler which does.

**How:** Both are real, reproducible, currently-open production bugs on user-facing controls — fixing them closes visible defects operators would otherwise hit on common paths (resuming a session to view a diagram; bulk-assigning more than once in a sitting).

## Architecture Constraints

- **For the readOnly script-suppression bug:** the fix must make `swToggleCanvasFs`, `swExpandCanvas`, and `swToggleArtefactFs` available regardless of `data.readOnly`, without re-enabling the rest of `scriptHtml`'s live-session-only behaviour (SSE pump wiring, condition-card appending, the Cmd/Ctrl+Enter submit handler) for read-only views, since those genuinely don't apply to a historical page with no live session. The cleanest fix is likely splitting these three toggle functions into their own always-emitted script block, separate from the rest of `scriptHtml` — not simply flipping the `readOnly` conditional off entirely (which would re-introduce a live-session-only SSE pump on a page with no SSE connection).
- **For the stuck-button-label bug:** add the same `btn.disabled=false;btn.textContent=origText;` reset already present in `bmauAssignToModule()`'s `.catch()` handler to the end of the success `.then()` chain, in `src/web-ui/routes/products.js`.
- Both fixes are narrow and additive — no change to the underlying `bulkAssignFeaturesToModule` endpoint or the diagram-rendering mechanism itself.

## Dependencies

- **Upstream:** `cdpl-s1` (merged, canvas-diagram-panel-layout-fix) and `bmau-s1` (merged, bulk-module-assignment-ui-gap) — this story fixes bugs found in each story's own delivered scope during retroactive DoD review.
- **Downstream:** None.

## Acceptance Criteria

**AC1 (higher severity):** Given a read-only/historical `/design`, `/definition`, or `/ideate` conversation view, When the operator clicks the diagram-maximise button ("Maximise diagrams" or "Maximise canvas"), Then the diagrams panel toggles to fullscreen with no console error — matching the already-working live-session behaviour.

**AC2 (higher severity):** Given the same read-only/historical view, When the operator clicks the artefact-panel's existing fullscreen toggle button, Then it toggles to fullscreen with no console error (closing the pre-existing `swToggleArtefactFs` gap this story's own investigation found, not just the new AC1 mechanism).

**AC3:** Given AC1/AC2's fix, When a live (non-read-only) session's maximise/fullscreen buttons are exercised, Then their existing working behaviour is completely unchanged — no regression to the live-session path.

**AC4 (cosmetic, lower severity):** Given a successful bulk-assign in the module-grouped product view, When the operation completes, Then the "Assign to module" button's label resets from "Assigning…" back to "Assign to module" — matching the existing reset behaviour already present on the error/failure path.

## Out of Scope

- Any change to the diagram-rendering mechanism, the artefact-panel content, or the `bulkAssignFeaturesToModule` endpoint's contract — all reused as-is.
- A broader audit for other onclick handlers with the same class of readOnly-suppressed-script bug — scoped to the three specific functions named in AC1/AC2; if this pattern recurs elsewhere, that's a separate finding.

## NFRs

- **Performance:** None identified — client-side script/DOM fixes only.
- **Security:** None identified.
- **Accessibility:** No change to existing `aria-label`/`title` attributes, which are already correct on all affected buttons.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2 — AC1/AC2's fix requires careful separation of the always-safe toggle functions from the live-session-only script block without breaking either path; AC4 is trivial.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
