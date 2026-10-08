# Story: Fix stage side panel's initial focus target and correct the E2E spec's wrap-test labels

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gap found below
**Benefit reference:** None — short-track skips benefit-metric; benefit stated directly below

## User Story

As an **outer loop practitioner opening a stage's side panel to edit it**,
I want **the panel's initial keyboard focus to land on the first editable field, not the dismiss button**,
So that **I can start typing immediately, matching the panel's own purpose (editing a stage), instead of landing on a control that only closes it**.

## Benefit Linkage

**Metric moved:** None formally tracked — short-track correctness fix. Direct benefit: a real, live-verified UX/accessibility defect in `ep1-s3` (merged PR #960) is closed, and a latent bug in that story's own E2E spec (which would have silently not tested what it claimed to test) is fixed before anyone relies on it.
**How:** Found 2026-10-08 by live Chrome verification against real staging data at the operator's own request ("Check all this feature's stories AC in chrome") — a real journey and stage were created via the real app, the panel was opened via a real click, and `document.activeElement.id` was read directly: it was `sw-stage-panel-close`, not any editable field. Root cause: `handleGetJourneyCanvas`'s own panel markup renders the close button inside `.sw-stage-panel-header`, physically *before* the field `<label>`s in DOM order; `openPanel()`'s own focus call (`getFocusable()[0].focus()`) picks whatever is first in DOM order, which is therefore the close button, not `description` as the code's own comment claimed ("move focus into the dialog... first focusable field"). The written-but-unexecuted E2E spec (`tests/e2e/ep1-s3-stage-panel-focus-management.spec.js`) inherited the same wrong assumption, labeling `#sw-stage-field-description` as `firstField` and `#sw-stage-panel-close` as `lastField` — the reverse of the true DOM order. Live-tested anyway (Tab/Shift+Tab from the actual DOM-order first/last elements): the trap wrap logic itself is correct (confirmed live, close→moment_of_truth→close wraps both directions), so AC5 is not broken — only AC1's initial-focus intent and the E2E spec's own element labeling are.

## Architecture Constraints

**Fix shape:**
1. In `handleGetJourneyCanvas`'s client script, change `openPanel()`'s focus call from `getFocusable()[0].focus()` to explicitly `document.getElementById('sw-stage-field-description').focus()` — the panel's own first editable field, regardless of the close button's DOM position. The focus-trap logic (`getFocusable()` used for Tab/Shift+Tab wrap calculation) is unchanged — it is correct as-is and does not need the close button moved.
2. Fix the E2E spec's own `firstField`/`lastField` locators to match the TRUE DOM order (`firstField = #sw-stage-panel-close`, `lastField = #sw-stage-field-moment_of_truth`), so its Tab/Shift+Tab assertions actually exercise the wrap-around case instead of coincidentally passing on ordinary adjacent-element tabbing.
3. No change to `server.js`, the `PATCH` handler, or any other file.

## Dependencies

- **Upstream:** `ep1-s3` (merged, PR #960) — this story fixes a defect in its own shipped code.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the side panel opens (a stage card's "Edit stage" link is clicked), When initial focus is set, Then `document.activeElement` is the `description` field (`#sw-stage-field-description`), not the close button.

**AC2:** Given the panel is open, When Tab is pressed from the close button (the panel's true first focusable element) repeated through to the `moment_of_truth` checkbox (the true last) and once more, Then focus wraps from `moment_of_truth` back to the close button — unchanged trap behaviour, confirmed to still work identically after this fix.

**AC3:** Given `tests/e2e/ep1-s3-stage-panel-focus-management.spec.js`'s own `firstField`/`lastField` locators, When read, Then `firstField` targets `#sw-stage-panel-close` and `lastField` targets `#sw-stage-field-moment_of_truth` — matching the real DOM order, so the spec's own wrap assertions test an actual wrap rather than ordinary adjacent tabbing.

## Out of Scope

Reordering the panel's DOM so the close button visually stays first but tab-wise comes last (a more conventional dialog pattern) — out of scope; the live-verified behaviour (close button first in both DOM and tab order) is accepted as-is, only the *initial focus target* and the *spec's own labels* are being corrected, not the trap's own wrap order.

## NFRs

- **Accessibility:** This IS the accessibility fix — AC1 ensures the WCAG-relevant panel opens with focus on something the user can act on immediately.
- **Reliability:** AC3 ensures the one written-but-unexecuted E2E spec from `ep1-s3` will actually test what it claims to the first time anyone runs it, rather than silently passing for the wrong reason.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
