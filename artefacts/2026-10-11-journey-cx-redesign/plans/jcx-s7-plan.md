## Implementation Plan: jcx-s7

**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s7-test-plan.md
**Contract:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s7-dor-contract.md

### Task 1 — RED: write `tests/check-jcx-s7-panel-feedback-and-polish.js`
All 8 unit-test scenarios from the test plan (AC1a, AC1b, AC1c, AC2, AC3a, AC3b, AC4, AC5), confirmed failing against the current code before any implementation change.

### Task 2 — GREEN: AC1 — save-indicator states, distinct error color, sequence-token race fix
Add a `Saving…` state on request start; give the error branch its own distinct danger-colored class; add a per-indicator save-sequence counter so a stale success-clear timeout can never hide a later state.

### Task 3 — GREEN: AC2 — DOM-patch on stage-add success, no reload
Replace `window.location.reload()` in the `addBtn` success handler with an in-place DOM patch using the response's own `{id, name, position}`.

### Task 4 — GREEN: AC3 — bigger single-click target, no double-fire
Add a click listener on the swimlane grid header cell (and the drawflow node) that calls the existing `openPanel`; confirm clicking the nested `.sw-stage-edit` link still produces exactly one open.

### Task 5 — GREEN: AC4 — muted empty-state treatment
Shared CSS class for empty field cells and an empty/default stage name; `.trim()`-based emptiness check.

### Task 6 — GREEN: AC5 — 8px spacing normalization
`padding:10px 0`→`8px 0`; `column-gap:12px`→`8px`/`16px`.

### Task 7 — E2E: `tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js`
AC3's visual/size portion.

### Task 8 — Full suite + live Chrome re-verify
Run full repo suite, confirm no regressions; live-verify on staging once deployed (per this session's own established practice).
