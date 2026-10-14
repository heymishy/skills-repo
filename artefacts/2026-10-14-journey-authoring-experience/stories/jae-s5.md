## Story: Restructure the Delivery view from a per-stage card stack into a swimlane grid

**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-delivery-view-grid.md
**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Domain:** [web-ui, ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead) reviewing delivery coverage for a journey**,
I want **the Delivery view to show every stage's coverage status and mapped features side-by-side as columns, the same way the Customer-experience tab already shows emotion/actions/touchpoints as columns (`jcx-s6`)**,
So that **I can scan "what covers what, and what's still missing" across the whole journey at a glance — reading it as a coverage matrix, not a list of cards I have to scroll through and mentally compare one at a time**.

## Benefit Linkage

**Metric moved:** M3 — Operator CX judgment of the authoring flow (read broadly per this epic's own benefit-metric section to include reviewing delivery coverage, not just creating a stage)
**How:** `#sw-journey-stages` today renders one `.sw-stage-card` + one `.sw-stage-annotations--delivery` block per stage, stacked vertically — the exact pre-`jcx-s6` shape the Customer-experience tab used to have before that story's own grid replaced it. This story applies the same, already-validated fix to Delivery, per `spikes/delivery-view-design-outcome.md`'s own REDESIGN verdict and research (requirements-traceability-matrix UI pattern is a table/matrix, not a card stack).

## Architecture Constraints

- **One canonical grid-shell builder, not a second derivation (ADR-026 + ADR-028).** `buildCustomerExperienceSwimlaneGrid` (same file, `journeys.js`) is refactored to extract its shared mechanics — the `gridTemplateColumns = 'repeat(N, minmax(200px, 1fr))'` formula, the `buildDataRow(rowClass, label, cellsHtml)` cell/track/pinned-label-wrapper shape, and the visually-hidden accessible-list pattern — into one canonical builder (e.g. `buildSwimlaneGridShell(stagesForGrid, { buildHeaderCell, rows, buildA11yEntry })`) that both the existing CX grid and the new `buildDeliverySwimlaneGrid` call. Per ADR-028 ("a derived structure needs exactly one canonical builder — every consumer reads from it, none re-derive it"), this story does NOT copy the CX grid's mechanics a second time into an independent `buildDeliverySwimlaneGrid` implementation. This is a behaviour-preserving refactor: `buildCustomerExperienceSwimlaneGrid`'s own rendered output must be byte-identical before and after, confirmed by its existing test suite passing unchanged — a dedicated task (not folded into the Delivery-build task) runs that suite before any Delivery-specific code is written, establishing the refactor is safe in isolation. CSS classes for the new grid are namespaced (`sw-delivery-grid-*` mirroring `sw-cx-grid-*`); the header-cell content itself differs per view (CX: stage name, moment-of-truth badge, `.sw-stage-edit` link; Delivery: the same three plus `.sw-stage-reorder-controls`), supplied to the shared builder via the `buildHeaderCell` callback, not by forking the builder.
- **Reorder controls move into the header cell.** Unlike the CX grid's header cell (which deliberately omits `Map feature`/`Add placeholder` as "genuinely delivery-chrome" per `jcx-s6`'s own comment), the Delivery grid's header cell additionally renders the existing `.sw-stage-reorder-controls` (up/down buttons) — today's only surface for reordering stages, since `#sw-journey-stages` (the card stack being replaced) is the only view where they currently render. No change to the reorder buttons' own markup, `aria-label`s, or their existing click handler (`data-direction`/`data-stage-id` read exactly as today).
- **Map feature / Add placeholder live inside the Mapped features cell, not a dedicated row (`decisions.md`, 2026-10-15).** Each stage's Mapped features cell contains, in order: `buildDeliveryAnnotations(stageId)`'s existing output unmodified (no-mappings / placeholder / missing-feature / normal-mapping-with-metrics — all 4 existing cases, byte-identical markup), then the existing `.sw-stage-map-feature` button, the existing `.sw-stage-add-placeholder` button, and the existing `.sw-placeholder-add-form` (inline, toggled via its existing `sw-placeholder-add-form--open` class) — all four pieces of markup are moved into the grid cell unchanged; none of their classes, data attributes, or the JS that finds them by those classes/attributes (`fpOpen`, the `.sw-stage-add-placeholder` click handler, `jcxSubmitJson`, the placeholder-trigger/remove delegated handlers) are modified by this story.
- **Health badge becomes its own grid row.** `buildHealthIndicator(stageId)`'s existing output (icon + accessible label, unchanged, MC-A11Y-02) renders as one `buildDataRow('health', 'Coverage status', cellsHtml)` row — a direct per-stage cell analogue of the CX grid's `buildTextCellsRow`, but using `buildHealthIndicator` instead of a plain field read, since health is computed, not a stored field.
- **One shared accessible list, matching `jcx-s6`'s own AC5 convention.** A `sw-delivery-a11y-list` `<ul>` (visually hidden, same `sw-visually-hidden` class) is added covering every stage's name, coverage status, and mapped-feature summary in document order — the Delivery analogue of the CX grid's own `a11yListHtml`, not a new accessibility pattern.
- **`#sw-journey-stages` and its view-gating CSS are removed, not merely hidden further.** Today `#sw-journey-stages` is shown only in Delivery view (`.sw-journey-canvas--view-canvas #sw-journey-stages{display:none}` and the equivalent CX rule already hide it in the other two views). Once this story ships, no view shows it, so the element, its `stagesHtml` markup (the `.sw-stage-card`/`.sw-stage-annotations--delivery` per-stage loop), and its two existing `display:none` CSS rules are deleted outright — not left as dead, permanently-hidden markup — matching how `jcx-s6` itself fully removed the old `buildCustomerExperienceAnnotations` function rather than leaving it unused.
- **No change to data loading, routes, or the database.** `stages`, `mappingsByStage`, and `featuresBySlug` are already loaded before any view-specific render function runs; `buildDeliverySwimlaneGrid` receives the same `stages` array already passed to `buildCustomerExperienceSwimlaneGrid` today. No new query, no new route.

## Dependencies

- **Upstream:** `jcx-s6` (the grid mechanism being reused) and `jcx-s7` (the single-click-to-edit / muted-empty-state conventions also reused) — both merged.
- **Downstream:** None. The Canvas-view cyan-fill styling spike (`spikes/canvas-node-styling-outcome.md`) is a separate, unrelated story against drawflow node CSS only.

## Acceptance Criteria

**AC1:** Given a journey with 2 or more stages, When the operator selects the "Delivery" view toggle, Then the view renders one column per stage (header: stage name, moment-of-truth badge if set, reorder up/down buttons, Edit link) above two data rows — "Coverage status" (health badge) and "Mapped features" (existing mapping markup + Map feature/Add placeholder actions) — sharing one `grid-template-columns` across all three rows, matching the CX grid's own column-alignment guarantee (`jcx-s6` AC1/AC2).

**AC2:** Given a stage with zero feature mappings, When the Delivery grid renders that stage's column, Then the Mapped features cell shows the exact same "No features mapped" empty-state text `buildDeliveryAnnotations` already produces today, styled with the grid's own muted empty-state treatment (`sw-delivery-grid-cell--empty`-equivalent, consistent with `jcx-s7` AC4's existing em-dash/muted convention for a genuinely-empty cell) — not a redesigned empty state.

**AC3:** Given the operator clicks "Map feature" inside a stage's Mapped features cell, When the feature-picker modal opens and a feature is selected, Then the mapping is created and rendered exactly as it is today (same request, same response handling) — this story changes only where the button and its resulting markup render, not the mapping flow itself.

**AC4:** Given the operator clicks "Add placeholder" inside a stage's Mapped features cell, When the inline form opens and is submitted, Then the placeholder is created and rendered in that same cell exactly as it is today (same request/response handling, same `sw-placeholder-add-form--open` toggle, same cancel behaviour) — this story changes only where the form renders, not the placeholder flow itself.

**AC5:** Given the operator clicks a stage column's up/down reorder button, When the reorder request completes, Then the grid's columns re-render in the new order, identically to how `#sw-journey-stages`'s cards re-order today (same endpoint, same success/error handling, same `sw-stage-reorder-error` live region) — reorder behaviour itself is unchanged, only its visual container.

**AC6:** Given a journey with 0 stages, When the operator selects the Delivery view, Then it shows the existing "No stages yet. Add your first stage." empty-state message (matching the CX grid's own 0-stage fallback at `journeys.js:1637`) rather than rendering an empty grid shell.

**AC7:** Given the Delivery grid is rendered, When a screen reader user navigates it, Then a single visually-hidden accessible list (`sw-delivery-a11y-list`) exposes every stage's name, coverage status, and mapped-feature summary in document order — matching `jcx-s6` AC5's own accessible-list convention for the CX grid, not a new accessibility pattern.

**AC8 (CSS-layout classification, CLAUDE.md B2 — corrected at `/test-plan`):** The column-width/scroll/alignment behaviour this story introduces (minmax(200px,1fr) columns, horizontal scroll with a pinned label column) is CSS-layout-dependent, but — unlike this story's own first draft, which defaulted to RISK-ACCEPT — Playwright E2E tooling IS already configured for this exact behaviour (ADR-018; `tests/e2e/jcx-s6-swimlane-grid.spec.js` already covers the identical column-layout/pinned-scroll mechanics for the CX grid this story reuses). Per the test-plan skill's own Step 3a, option 1 (a real E2E test) is used instead of a RISK-ACCEPT: a new `tests/e2e/jae-s5-delivery-swimlane-grid.spec.js`, modelled directly on `jcx-s6`'s own spec, covers column order, cell alignment, and pinned-label horizontal scroll for the Delivery grid. No manual-only smoke step or `decisions.md` RISK-ACCEPT entry is needed for this AC.

## Out of Scope

- **Any OBSERVABLE change to the Customer-experience grid's rendered output or behaviour** — its existing test suite must pass unchanged. Its internal implementation IS touched (the ADR-028 canonical-builder extraction above), by design — this is a refactor, not new CX functionality, and is not a loophole for behavioural changes to CX.
- **Any change to the Canvas view** — covered separately by the drawflow node-styling spike/story.
- **A dedicated "Actions" row for Map feature/Add placeholder** — explicitly decided against; see `decisions.md`, 2026-10-15.
- **Changing the health-badge icon/colour/label design** — reused as-is.
- **Any change to the feature-picker modal, the placeholder-add-form's own fields, or the mapping/placeholder API routes** — all read-only reuse.

## NFRs

- **Performance:** No new query; `buildDeliverySwimlaneGrid` iterates the same already-loaded `stages`/`mappingsByStage`/`featuresBySlug` data `buildDeliveryAnnotations` and the old card-stack loop already iterated today — no additional render cost beyond restructuring existing markup.
- **Accessibility:** WCAG 2.1 AA — reuses `jcx-s6`'s own accessible-list, focusable-header-cell, and keyboard-track conventions directly; reorder buttons keep their existing `aria-label`s unchanged.
- **Security:** No new database query shape, no new route, no new input surface.
- **Layout risk:** See AC8 — covered by a new Playwright E2E spec (tooling already configured, ADR-018), not a RISK-ACCEPT, per CLAUDE.md's B2 rule and the test-plan skill's own Step 3a.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

<!-- Raised from 1 to 2 at /review run 1 (finding 1-H2): this story now includes a
     behaviour-preserving refactor of already-shipped CX grid internals (ADR-028
     canonical-builder extraction), not purely additive Delivery-view work. -->
