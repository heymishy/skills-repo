## Story: Fix the misleading save-error color, the view-reset-on-save standards violation, and empty-state/entry-point/spacing polish on the Customer experience tab

**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Spike reference:** artefacts/2026-10-11-journey-cx-redesign/spikes/cx-interaction-design-polish-outcome.md
**Domain:** [web-ui, ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead) authoring or reviewing a customer journey map**,
I want **the stage edit panel to show save failures in a visually distinct (not success-green) state, the stage-add action to stay on whatever view I'm working in instead of reloading the page, a bigger single-click target to open the edit panel, and empty/placeholder content visually dulled instead of full-strength text**,
So that **I can trust what the panel tells me about whether my edits actually saved, keep working in the Customer experience view I'm already in, find the edit entry point without hunting for a small link, and tell at a glance which fields are genuinely filled in versus still blank — closing the gaps the `cx-interaction-design-polish` spike found once the structural swimlane-grid fix (`jcx-s6`) and the "+ Add stage" visibility fix (`jcx-hotfix4`) were already in place**.

## Benefit Linkage

**Metric moved:** M1 — Operator CX judgment vs. the reference bar
**How:** `jcx-s6` fixed the structural gap (swimlane/timeline grid) and `jcx-hotfix4` fixed a confirmed functional defect (the Add-stage input being invisible outside Delivery). This story closes the remaining findings from the same spike that still stand between the current CX tab and "not clunky": a real correctness bug in the panel's own error-state color, a confirmed violation of this repo's own documented web-ui standard (reload discarding live state), and the empty-state/entry-point/spacing items the spike's Part 1/4 research grounded in established design-system and usability conventions.

## Architecture Constraints

- **Constraint — reuse over invention (ADR-026).** AC1's danger-colored error state and AC3's larger click target must both reuse this page's own already-established conventions (the `sw-stage-reorder-error`/`sw-feature-mapping-warning` danger-color class, and the existing `.sw-stage-edit` link/`openPanel` call) rather than inventing a new color token or a new panel-opening mechanism, per ADR-026 (reuse an existing entity/primitive before adding a new one).
- **No data model change.** All 5 ACs below are presentation/interaction-layer only — no new column, table, or query. `handlePostJourneyStage`'s own response shape (`{id, name, position}`) already carries everything AC3's DOM-patch needs.
- **No new route.** AC1/AC2/AC4/AC5 are CSS/markup changes to `handleGetJourneyCanvas`'s existing render. AC3 changes client-side JS behaviour on the existing `POST /journeys/:id/stages` response handling only — the route itself (`handlePostJourneyStage`) is unchanged.
- **Reuses this page's own existing danger/error convention.** Per the spike's Part 3 finding 2, the new error-state styling for the save indicator must use this same page's own existing `sw-stage-reorder-error`/`sw-feature-mapping-warning` danger-color convention (`var(--danger)`), not invent a new color token.
- **`jcx-s6`'s own grid structure is unchanged.** Column layout, row alignment, and the curve's own on-chart labeling (AC1-AC3 of `jcx-s6`) are explicitly out of scope — this story only touches empty-cell/stage-name text color, the save-panel's own markup/script, the stage-add success handler, the grid header's own click-target size, and row spacing values.

## Dependencies

- **Upstream:** `jcx-s6` (DoD complete) and `jcx-hotfix4` (DoD complete) must both be merged — this story's own ACs assume the swimlane grid exists and the Add-stage input is already visible in every view.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a stage-panel field save that fails (the PATCH request rejects or returns a non-OK response), When the panel's own `.catch` handler fires, Then the error text renders in a visually distinct, danger-colored element — never the same green success-styled element/class a successful save uses. Given a field save that succeeds, is in flight, or has failed, Then the panel shows one of exactly 3 persistent states — `Saved` (muted, default), `Saving…` (while the request is in flight), `Failed to save — Retry` (danger-colored, actionable) — replacing the single fast-fading flash, and the indicator does not disappear on a timeout while in the `Failed to save` state.

**AC2:** Given the "+ Add stage" flow (already visible in every view per `jcx-hotfix4`), When a new stage name is saved successfully, Then the page does NOT call `window.location.reload()` — the new stage is patched into the DOM in place (in whichever view is currently active) from the POST response's own `{id, name, position}` fields, and the active view (Canvas / Customer experience / Delivery) is unchanged after the save. This closes a confirmed violation of `.github/standards/web-ui/web-ui-patterns.md`'s own "Client-side DOM patch vs. full page reload after a POST action" rule.

**AC3:** Given the swimlane grid's header cell (and the equivalent drawflow canvas node), When the operator single-clicks anywhere on that cell/node (not only the small "Edit stage" text link), Then the stage edit panel opens for that stage, exactly as the existing "Edit stage" link already does — the link itself remains visible inside the now-larger click target as a clear label, and the larger target is keyboard-operable via the same native focus/Enter semantics already in place for the existing link (no double-click, matching the spike's own corrected recommendation).

**AC4:** Given a swimlane grid cell with no value for its field (rendering today as "Not set" in full-strength text), or a stage with no name set (rendering today as plain, unstyled default text), When the tab renders, Then both render in the same muted, visually-dulled treatment (the existing muted slate color already used for row labels, and/or an em dash in place of "Not set") — distinct from a cell that has a real value.

**AC5:** Given the swimlane grid's existing row padding (`10px 0px`) and column-gap (`12px`), When the tab renders, Then both values are normalized to the 8px spacing scale (e.g. `8px 0px` padding, `8px` or `16px` column-gap) — no visible column/row misalignment introduced, `jcx-s6`'s own column-width/scroll behavior (AC3/AC7) unaffected.

## Out of Scope

- Chunking the edit panel's 8 fields into labeled groups (spike Part 3, finding 3) — real and reference-grounded (Miller's Law), but a bigger panel-markup change than this story's own scope; logged as a deferred follow-up in `decisions.md`.
- Bumping row-label font-size from 11px to 12px, and reducing the emotion curve's fixed height (spike Part 1, findings 4-5) — smaller, independent polish items; deferred to keep this story's own diff focused on the correctness bug (AC1) and the standards violation (AC2) plus their closely-related entry-point/empty-state neighbors.
- Allowing a new stage to be inserted directly between two existing ones (spike Part 4, finding 1) — the capability already exists in two steps (add, then drag-reorder); deferred as a lower-priority nice-to-have.
- Any change to `jcx-s6`'s own grid column/row structure, or to the Delivery tab or Canvas view.

## NFRs

- **Performance:** None beyond existing route bounds — AC2's own DOM-patch is strictly cheaper than the `window.location.reload()` it replaces (no full page re-fetch).
- **Security:** None — no new input surface, no auth/CSRF change. AC2's DOM-patch uses only the POST response's own already-returned, already-tenant-scoped fields.
- **Accessibility:** WCAG 2.1 AA. AC1's danger-colored error state must meet contrast requirements against the panel's background, not just be a different hue from the success state. AC3's larger click target must remain reachable and operable via keyboard (Tab + Enter/Space) exactly as the existing link already is — verified, not assumed, since this is a CSS-layout-dependent AC per CLAUDE.md's own B2 rule and must be classified at DoR time (automated test or RISK-ACCEPT + manual smoke script).
- **Audit:** None — no new mutating action.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
