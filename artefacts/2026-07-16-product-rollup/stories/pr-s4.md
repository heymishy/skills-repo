## Story: Render aggregate health on the product rollup view

**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md

## User Story

As the **Founder/Operator (Hamish King)**,
I want to **see a count of features by health status, plus one overall product-health signal, on `/products/:id`**,
So that **I can tell at a glance whether the product overall is healthy, and which features need attention, without opening `pipeline-state.json` myself**.

## Benefit Linkage

**Metric moved:** Product shape visible in the web UI
**How:** An operator can tell at a glance whether the product overall is healthy without opening `pipeline-state.json` — closing a real gap where health was already fetched per feature but never rolled up into a view.

## Architecture Constraints

- Reuses the existing status vocabulary and label convention already established in this codebase (`.github/scripts/viz-functions.js`'s `fleetHealthLabel`: green=✓ Healthy, amber=⚠ Warning, red=✕ Blocked, unknown=? Unknown) for visual consistency, even though the underlying counting logic is new application code (not imported from that file, since it lives in the legacy/unused dashboard's support module).
- Derives the single overall product-health signal using the same red-takes-precedence rule already applied per-feature elsewhere in this codebase (`viz-functions.js`'s `featureActionMeta`: any feature red → blocked/red takes priority) — per discovery's [ASSUMPTION], this rule is not yet operator-confirmed and should be verified at DoR.
- MC-SEC-01/Accessibility mandatory constraint: colour alone must not be the only indicator of health status — labels/icons required alongside colour, matching the existing `fleetHealthLabel` convention.
- ADR-018 (Playwright E2E): health rollup rendering is browser-facing; an E2E spec covering the health count display and overall signal should exist in `tests/e2e/` before DoR.

## Dependencies

- **Upstream:** pr-s2 must be complete — this story renders a new dimension from the same cached rollup record pr-s2 establishes.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a synced product with features at a mix of health statuses (green/amber/red/unknown), When the operator loads `/products/:id`, Then the rollup view shows a count of features at each status, using the existing label convention (✓ Healthy / ⚠ Warning / ✕ Blocked / ? Unknown).

**AC2:** Given at least one feature is red, When the overall product-health signal is computed, Then it shows red — the red-takes-precedence rule applies regardless of how many green/amber features also exist.

**AC3:** Given no feature is red but at least one is amber, When the overall product-health signal is computed, Then it shows amber.

**AC4:** Given all features are green (or the product has zero features), When the overall product-health signal is computed, Then it shows green.

## Out of Scope

- A weighted or percentage-based health score (e.g. "95% healthy") — MVP uses the simpler count + precedence-rule signal; a weighted score is a later refinement if this proves misleading for very large products.
- Drill-down from the health count into the specific red/amber features by name — this story shows aggregate counts only; per-feature detail is a follow-on UX enhancement.

## NFRs

- **Performance:** Health aggregation is computed from the already-cached rollup record (pr-s2) — no additional API calls.
- **Security:** None identified beyond pr-s2's own NFRs.
- **Accessibility:** Status must be distinguishable without colour alone (label/icon required), per the mandatory accessibility constraint.
- **Audit:** Not applicable — read-only view of already-logged sync data.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
