## Test Plan: Collapse stage creation into one guided action — the edit panel opens automatically after naming a new stage

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s2.md
**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-guided-creation.md
**Review reference:** artefacts/2026-10-14-journey-authoring-experience/review/jae-review-2.md (PASS, run 2 — AC5 added to resolve 1-H1)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-14
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on E2E detection (Step 3a)

No AC describes drag-and-drop, pointer coordinates, or on-screen position. AC2's focus check (`document.activeElement`) is a real DOM focus-state assertion, not a visual/layout one — jsdom resolves element focus correctly without real CSS layout. No AC is flagged CSS-layout-dependent; no E2E test is required.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Panel opens automatically after a successful stage-name save | 1 test | — | — | — | — | 🟢 |
| AC2 | Focus moves to `description` on auto-open | 1 test | — | — | — | — | 🟢 |
| AC3 | Closing the auto-opened panel without further input leaves the stage saved with just its name | 1 test | — | — | — | — | 🟢 |
| AC4 | Active view unchanged; `window.location.reload()` never called | 1 test | — | — | — | — | 🟢 |
| AC5 | `openPanel` resets the save-indicator's stale text/classes on every open (resolves review 1-H1) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

No gaps.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; jsdom + mocked `window.fetch`, reusing `jcx-s7`'s own established `check-jcx-s7-panel-feedback-and-polish.js` conventions.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2, AC4 | Rendered canvas; mocked `fetch` resolving `{id, name, position}` for the stage-add POST | jsdom + mocked `window.fetch` | None | |
| AC3 | Same, plus a mocked PATCH response for the panel's own save | jsdom + mocked `window.fetch` | None | |
| AC5 | Two sequential mocked `fetch` outcomes: one success (a different, earlier stage), one failure (the stage under test) | jsdom + mocked `window.fetch` | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1: panel opens automatically after a successful stage-name save

- **Verifies:** AC1
- **Precondition:** Rendered canvas; mocked `fetch` resolving `{id: 's9', name: 'New stage', position: 3}` for the stage-add POST
- **Action:** Click "+ Add stage," type a name, trigger save (blur)
- **Expected result:** The stage panel (`#sw-stage-panel`) carries `sw-stage-panel--open` after the save resolves, with `panelStageId` equal to `'s9'` — no separate click on "Edit stage" required
- **Edge case:** No

### AC2: focus moves to the first editable field on auto-open

- **Verifies:** AC2
- **Precondition:** Same as AC1
- **Action:** Same as AC1
- **Expected result:** `document.activeElement` is `#sw-stage-field-description` immediately after the auto-open — asserted directly, not inferred from `openPanel`'s own behaviour elsewhere
- **Edge case:** No

### AC3: closing the auto-opened panel without further input leaves the stage saved with just its name

- **Verifies:** AC3
- **Precondition:** Same as AC1, panel now auto-open
- **Action:** Press Escape (or click the panel's own close button)
- **Expected result:** The panel loses `sw-stage-panel--open`; the stage's own card/cell still shows the name `'New stage'`; no additional PATCH request was ever made for this stage (no field was touched, so autosave never fired) — the stage is NOT in an incomplete or invalid state
- **Edge case:** No

### AC4: active view unchanged; reload never called

- **Verifies:** AC4
- **Precondition:** Same as AC1, with the Customer-experience view active before the save (non-default view, to make a regression to Canvas detectable); `window.location.reload` replaced with a spy
- **Action:** Same as AC1
- **Expected result:** `window.location.reload` is never called; the canvas root's own active-view class still reads `sw-journey-canvas--view-customer-experience` after the auto-open completes — this story must not regress `jcx-s7`'s own AC2
- **Edge case:** No

### AC5 (resolves review 1-H1): `openPanel` resets the save-indicator's stale state on every open

- **Verifies:** AC5
- **Precondition:** Rendered canvas with 2 existing stages (`s1`, `s2`); mocked `fetch` configured to resolve successfully for `s1`'s own field save and to reject for `s2`'s own field save
- **Action:** Open the panel for `s1`, trigger a successful field save (indicator shows `Saved`), close the panel; open the panel for `s2`, trigger a failing field save (indicator shows `Failed to save — Retry`), close the panel; open the panel for a THIRD, never-before-edited stage (`s3`)
- **Expected result:** When the panel opens for `s3`, the save-indicator's own text is empty and it carries neither `sw-stage-panel-saved--error` nor `sw-stage-panel-saved--visible` — no stale "Saved" or "Failed to save" text from `s1`/`s2` is ever shown for a stage that has never been edited
- **Edge case:** Yes — this IS the edge case; it is the review finding being closed

---

## NFR Tests

### Accessibility — AC2's focus-move is verified, not assumed

- **NFR addressed:** Accessibility (WCAG 2.1 AA)
- **Measurement method:** AC2's own unit test
- **Pass threshold:** `document.activeElement` is the first editable field, confirmed directly
- **Tool:** jsdom

---

## Gap table

No gaps.
