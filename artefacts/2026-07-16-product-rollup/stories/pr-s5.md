## Story: Render aggregate test coverage on the product rollup view

**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md

## User Story

As the **Founder/Operator (Hamish King)**,
I want to **see the product's aggregate test coverage on `/products/:id`**,
So that **I can answer "what's our test coverage across the whole product" from one screen instead of manually summing `testPlan` fields across every feature**.

## Benefit Linkage

**Metric moved:** Product shape visible in the web UI
**How:** Adds the aggregate test-coverage dimension named in discovery MVP scope item 4, computed as sum of `testPlan.passing` / sum of `testPlan.totalTests` across the product's features (a blended percentage).

## Architecture Constraints

- Computation method (blended sum-of-passing/sum-of-total vs. average-of-per-feature-percentages) follows discovery's [ASSUMPTION] — pending operator confirmation via `/clarify` before DoR locks it in.
- No new architecture pattern beyond pr-s2's cached rollup record — this story reads `testPlan.{totalTests,passing}` fields already present in that cache.

## Dependencies

- **Upstream:** pr-s2 must be complete.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a synced product with features that have varying `testPlan.totalTests` and `testPlan.passing` values, When the operator loads `/products/:id`, Then the rollup view shows one blended aggregate test-coverage percentage (sum of passing / sum of total across all features).

**AC2:** Given a feature has no `testPlan` data at all (e.g. a very early-stage feature), When the aggregate is computed, Then that feature is excluded from both the numerator and denominator — it does not silently count as 0% and skew the aggregate down.

**AC3:** Given the operator wants to see which specific features are dragging the aggregate down, When they view the rollup, Then per-feature test-coverage detail is available (not just the single blended number) — per discovery MVP scope item 4's explicit requirement.

**AC4:** Given a product has zero features with any `testPlan` data, When the aggregate is computed, Then the view shows an explicit "No test data yet" state rather than a misleading 0% or NaN.

## Out of Scope

- Test coverage trend over time (e.g. a chart of coverage improving/declining across syncs) — MVP is point-in-time only.
- Per-test detail (individual test names/results) — this story aggregates at the feature level only, using the same granularity already present in `pipeline-state.json`.

## NFRs

- **Performance:** Computed from the already-cached rollup record — no additional API calls or database queries beyond what pr-s2 already performs.
- **Security:** None identified.
- **Accessibility:** The percentage and per-feature breakdown must be readable by screen readers, not conveyed via a chart/colour alone.
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
