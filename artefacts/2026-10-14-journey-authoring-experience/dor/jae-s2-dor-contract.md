# DoR Contract: jae-s2

**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s2.md
**Test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s2-test-plan.md

## What will be built

- Add `openPanel(resp.id)` to the end of the stage-add success handler's existing `.then(function(resp){...})` block (`src/web-ui/routes/journeys.js`), immediately after the existing DOM-patch logic.
- Modify `openPanel` itself to reset the save-indicator (`panelSaved`) at the start of every call: clear `textContent`, remove `sw-stage-panel-saved--error`, remove `sw-stage-panel-saved--visible` — before populating fields and opening the panel.

## What will NOT be built

- No change to the panel's own 8 fields, their save mechanism, or the per-field save-feedback logic itself (already correct from `jcx-s7`).
- No auto-open for template-seeded stages (`jae-s1`) — those go through a bulk server-side insert, not this client-side success handler.
- No forced field completion before the panel can be closed.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | jsdom: mock the stage-add fetch, assert `#sw-stage-panel` carries `--open` and `panelStageId` matches after save | unit |
| AC2 | Same setup, assert `document.activeElement` is `#sw-stage-field-description` | unit |
| AC3 | Same setup, press Escape, assert panel closes and stage card still shows its name, no extra PATCH fired | unit |
| AC4 | Same setup with Customer-experience view active, spy on `window.location.reload`, assert never called and view class unchanged | unit |
| AC5 | Sequential mocked fetches (stage A succeeds, stage B fails), open panel for a third, untouched stage, assert indicator is fully reset | unit |

## Assumptions

- `openPanel`'s own existing signature (`stageId` only) does not need to change — the reset logic is added inside the function body, not as a new parameter.
- No fake-timer library is needed for AC5's own test, since this story's own fix REMOVES the stale-timeout mechanism rather than adding timer-dependent logic to test around.

## Estimated touch points

Files: `src/web-ui/routes/journeys.js` (stage-add success handler, `openPanel`), `tests/check-jae-s2-guided-creation.js` (new)
Services: none
APIs: none changed (reuses the existing `POST /journeys/:id/stages` response shape)
