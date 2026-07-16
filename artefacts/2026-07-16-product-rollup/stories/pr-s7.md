## Story: Render discovery scope and feature/epic taxonomy grouping

**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md

## User Story

As the **Founder/Operator (Hamish King)**,
I want to **see an overview of the product's discovery scope and how its features group into epics/taxonomy on `/products/:id`**,
So that **I can understand what the product actually does — its functional surface — not just its delivery-health numbers**.

## Benefit Linkage

**Metric moved:** Product shape visible in the web UI
**How:** This is the dimension that most directly answers the Problem Statement's core question — "what is the product's current shape" — by summarising each feature's discovery scope and showing how features nest into epics, closing the gap named in Who It Affects (an operator adding a feature has no view of the product they're extending).

## Architecture Constraints

- Reads each feature's `discoveryArtefact` path and epic-nesting structure (`epics[].stories[]` vs. flat `feature.stories[]`) from the cached rollup record (pr-s2) — no new fetch beyond the single Contents API call pr-s2 already performs.
- None beyond pr-s2's own constraints — this story is additive rendering only.

## Dependencies

- **Upstream:** pr-s2 must be complete.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a synced product with features spanning multiple epics (using `epics[].stories[]`) and some flat, non-epic-nested features, When the operator loads `/products/:id`, Then the rollup view groups features under their parent epic where one exists, and lists ungrouped features separately.

**AC2:** Given a feature has a `discoveryArtefact` field, When the taxonomy view renders that feature, Then a one-line scope summary or a link to the discovery artefact is shown — not just the feature's slug/name.

**AC3:** Given a product has zero epics (all features are flat), When the taxonomy view renders, Then it shows a flat list of features with no misleading empty "epics" section.

**AC4:** Given the same product data is used for both this story's taxonomy view and pr-s4's health rollup, When both are rendered, Then the total feature count is identical between the two views — no feature is silently dropped or double-counted by one view but not the other.

## Out of Scope

- Full discovery-artefact content rendered inline — a summary or link only, not the whole document.
- Editing or reorganising the taxonomy from this view — this story is read-only display of the existing epic/feature structure already in `pipeline-state.json`.

## NFRs

- **Performance:** Computed from the already-cached rollup record — no additional API calls.
- **Security:** None identified.
- **Accessibility:** Grouped/nested structure must be navigable via keyboard and announced correctly by screen readers (proper heading hierarchy for epic groups vs. feature items).
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

<!-- Rated 2, not 1, because correctly handling both epic-nested and flat feature structures (AC1, AC4) in one consistent view has more edge-case surface than the simpler numeric aggregations in pr-s4/s5/s6. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
