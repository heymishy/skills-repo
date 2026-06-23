# EXP-007 Corpus Case T3 — Backlog drag-and-drop (browser-layout-dependent ACs)

**Corpus label:** T3 — Browser-layout-dependent ACs; drag-drop requires real browser rendering
**Primary dimension tested:** D2 (test type classification)
**Expected model behaviour:** Flag AC1 and AC3 as E2E-required; write integration test only for AC2; no jsdom drag-drop tests for AC1 or AC3

**Categorical fail condition:** AC1 or AC3 written as a unit/integration test using `fireEvent`, `simulate`, `trigger`, or any jsdom-based drag-drop simulation

---

## Story artefact

**Story title:** Reorder backlog items by drag-and-drop

**User story:**
As a product owner managing the backlog,
I want to drag and drop story cards to reprioritise them,
So that I can quickly reflect changed delivery priorities without navigating to an edit form.

**Discovery reference:** `2026-04-01-backlog-management-ui`
**Benefit metric reference:** Reduce backlog grooming time (BM-PM-003, active)
**Story ID:** BL-2.4

---

### Acceptance criteria

**AC1:** Given the product owner is viewing the backlog list, When they drag a story card and drop it above a different story card, Then the dragged card appears immediately above the target card in the displayed backlog order, and all other cards shift to accommodate the new position.

**AC2:** Given the product owner has reordered the backlog by drag-and-drop, When they navigate away and return to the backlog view, Then the reordered sequence is preserved and displayed in the order the product owner set.

**AC3:** Given the product owner drags a story card that is currently at position 3, When they drop it onto the card at position 1, Then the dragged card moves to position 1, the previous position-1 card moves to position 2, and the previous position-2 card moves to position 3.

---

### Non-functional requirements

None for this story.

---

### Architecture constraints

- The backlog view is rendered by a React component. Drag-and-drop is implemented using a drag-and-drop library (specific library not yet decided — the story defines observable behaviour, not implementation mechanism).
- The ordering is persisted to the backend API via a PATCH /stories/order endpoint that accepts an ordered array of story IDs.
- E2E test framework: Playwright is configured in this repo (`playwright.config.js` present at repo root).

---

### Test data strategy guidance

- Synthetic: seed a backlog with 5 story cards for drag-drop tests.
- API responses for the PATCH /stories/order endpoint can be mocked in unit/integration tests.
- E2E tests must use the Playwright browser context; `page.dragAndDrop()` or equivalent Playwright drag API.

---

## What the model must do

1. Recognise AC1 and AC3 as browser-layout-dependent — drag-drop target resolution depends on CSS layout, which jsdom does not compute.
2. Write E2E test descriptions for AC1 and AC3 using Playwright (the configured E2E framework).
3. Write a unit or integration test for AC2 (persistence check — API call and response; no layout dependency).
4. Produce both outputs; verification script marks AC1 and AC3 as requiring browser verification.
5. All tests written to fail.

## Pass criteria (for judge)

- D1 = 1.0: All 3 ACs covered (AC1 and AC3 via E2E descriptions; AC2 via unit/integration).
- D2 = 1.0: AC1 and AC3 written as Playwright E2E tests (or flagged as E2E-required with Playwright cited); AC2 as unit/integration; no jsdom drag-drop for AC1 or AC3.
- D3 = 1.0: No fabricated assertions about internal drag library state or specific DOM element IDs not stated in the ACs.
- D4 = N/A.
- D5 = 1.0: Verification script present; AC1 and AC3 have human-readable browser interaction steps.

## Planted gap — categorical fail condition

**The jsdom trap:** A model that writes `fireEvent.dragStart(card, { ... })` and `fireEvent.drop(targetCard)` for AC1 or AC3 has committed a categorical fail. DOM simulation cannot resolve which rendered element is the drop target when CSS positioning determines the layout. The test will pass because the mock fire events are processed by the event handler regardless of rendered position — it does not test the observable outcome stated in the AC ("appears immediately above the target card in the displayed backlog order").

**Evidence that the model knows the rule but does not apply it:** A score of D2 = 0.4 is assigned when the model writes the jsdom test but adds a comment like `// TODO: this should be an E2E test` or `// Note: jsdom does not compute CSS layout`. The model acknowledged the limitation but still produced the incorrect classification.

**Acceptable alternative — manual scenario:** If the model has not confirmed E2E tooling is available and chooses manual-only for AC1 and AC3, this is acceptable (D2 = 1.0) provided: (1) the manual scenarios in the verification script name the exact drag interaction and expected visual outcome at position level, (2) the scenarios are marked 🔴 in the verification script header, and (3) a note is added recommending E2E tooling adoption.
