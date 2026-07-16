## Story: Render aggregate AC coverage on the product rollup view

**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md

## User Story

As the **Founder/Operator (Hamish King)**,
I want to **see the product's aggregate acceptance-criteria coverage on `/products/:id`**,
So that **I can see how much of the product's specified scope has actually been verified, not just how many tests pass**.

## Benefit Linkage

**Metric moved:** Product shape visible in the web UI
**How:** Adds the aggregate AC-coverage dimension — a real gap identified during discovery review where `acTotal`/`acVerified` were already fetched per feature but never rolled up into a view. Computed as sum of `acVerified` / sum of `acTotal` across the product's features, using the same blended-percentage method as test coverage (pr-s5) for consistency.

## Architecture Constraints

- Computation method follows discovery's [ASSUMPTION] — the same blended-percentage method as test coverage, pending operator confirmation via `/clarify` before DoR.
- No new architecture pattern beyond pr-s2's cached rollup record — reads `acTotal`/`acVerified` fields already present in that cache.

## Dependencies

- **Upstream:** pr-s2 must be complete.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a synced product with features that have varying `acTotal` and `acVerified` values, When the operator loads `/products/:id`, Then the rollup view shows one blended aggregate AC-coverage percentage (sum of verified / sum of total across all features).

**AC2:** Given a feature has no `acTotal`/`acVerified` data (e.g. not yet past `/definition-of-ready`), When the aggregate is computed, Then that feature is excluded from both the numerator and denominator, matching pr-s5 AC2's same-shaped rule for test coverage.

**AC3:** Given the AC-coverage and test-coverage percentages are both shown on the same page, When the operator views them, Then they are visually distinguished from each other with clear labels — not presented ambiguously as if they were the same metric.

**AC4:** Given a product has zero features with any AC data, When the aggregate is computed, Then the view shows an explicit "No AC data yet" state rather than a misleading 0% or NaN, matching pr-s5 AC4's pattern.

## Out of Scope

- AC coverage trend over time — MVP is point-in-time only, matching pr-s5's own scope decision.
- Per-AC detail (which specific ACs are unverified) — this story aggregates at the feature level only.

## NFRs

- **Performance:** Computed from the already-cached rollup record — no additional API calls.
- **Security:** None identified.
- **Accessibility:** Same requirement as pr-s5 — readable without relying on colour/chart alone.
- **Audit:** Not applicable.

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
