## Story: Render the product view grouped by module, with dual health/coverage indicators and a scale gauge

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, opening a large product's view)**,
I want to **see modules as the primary grouping, each showing its own health and coverage state, plus an overall sense of the product's scale**,
So that **I can identify the least-healthy area of the product within seconds, instead of scanning a flat list of every epic and story**.

## Benefit Linkage

**Metric moved:** Time to identify the least-healthy area of a large product
**How:** This story is the actual rendering change the metric measures — it replaces the flat list with the module-grouped, dual-signal, scale-aware layout confirmed in this session's mockup.

## Architecture Constraints

- Must reuse `src/web-ui/utils/html-shell.js`'s existing design tokens and light/dark theme mechanism — not introduce a parallel styling system, per discovery's Constraints section.
- Must reuse the existing `_escapeHtml` convention for all operator-authored content (module names, epic names) rendered into HTML.
- Builds directly on `_renderProductView` in `src/web-ui/routes/products.js`, extending rather than replacing the existing health/coverage/taxonomy rendering sections added by `pr-s2`–`pr-s7` and this session's F4 fix (PR #515).

## Dependencies

- **Upstream:** A1 (module CRUD), A2 (reassignment), and A3 (per-feature health) must all exist — this story is the rendering layer consuming their combined output.
- **Downstream:** None within this epic.

## Acceptance Criteria

**AC1:** Given a product with modules created and epics assigned (per A1/A2), When the operator opens the product view, Then epics are grouped under their assigned module by default, with an "Unassigned" section for any epic with no module.

**AC2:** Given a module and an epic within it, When either is rendered, Then health (per A3) and test-coverage percentage are shown as two visually distinct indicators — never combined into a single value or color.

**AC3:** Given a product with N epics and M total stories, When the operator opens the product view, Then a scale indicator shows both counts plus a proportional visual (matching the confirmed mockup's distribution strip) showing relative module sizes.

**AC4:** Given a product view rendered with real backend data (not the session's mockup's static arrays), When the page loads, Then no console error or blank section appears if a product has zero modules yet (the flat/ungrouped fallback state renders cleanly).

**AC5:** Given the product view in a real browser, When the operator interacts with an expandable module section, Then it expands/collapses with a smooth transition (matching the motion refinement confirmed in this session's design critique pass) — not an instant snap.

## Out of Scope

- The Modules CRUD UI itself (create/rename/delete controls) — that is A1's rendering counterpart; this story assumes modules already exist and focuses on the grouped display.
- The Roadmap tab — that is A5.
- Grouping the AC-coverage breakdown by module — explicitly deferred per the epic's Out of Scope.

## NFRs

- **Performance:** Initial render of a 150-story, 48-epic product view completes within 2 seconds on a typical connection (matching this session's live-verification baseline on `wuce-staging`).
- **Security:** All rendered content passes through `_escapeHtml` — no raw operator-authored string (module name, epic name) reaches the DOM unescaped.
- **Accessibility:** Expandable sections are keyboard-operable; colour is never the only signal for health state (a text label or icon accompanies every colour-coded indicator, matching this repo's own established accessibility constraint for the governance dashboard, applied here too).
- **Audit:** None identified.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
