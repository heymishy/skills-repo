## Story: Compute health per-feature, distinct from test coverage

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, judging whether a specific epic needs attention)**,
I want to **see a health signal for each epic that is computed independently of its test-coverage percentage**,
So that **I can tell the difference between "this epic has no tests because it's docs-only and that's fine" and "this epic has no tests and that's a real gap" — a single coverage number can't tell me which**.

## Benefit Linkage

**Metric moved:** Time to identify the least-healthy area of a large product
**How:** A coverage-derived stand-in for health hides genuine disagreements between the two signals; a real independent per-feature health computation lets the operator trust the health indicator as its own signal, not a repaint of coverage.

## Architecture Constraints

- This story extends `computeHealthCounts` in `src/web-ui/modules/product-rollup.js`, which today only aggregates health across an entire product. **Before writing implementation code, trace exactly what input `computeHealthCounts` reads from `pipeline-state.json` today** — per the discovery's own flagged risk, this has not been confirmed at the code level as of story-writing time. This investigation is real technical-design work belonging to this story, not assumed to be already understood; its outcome determines the concrete per-feature health rule AC2 will assert.
- Must preserve the existing `product_rollups.health_counts` JSONB column's aggregate shape for backward compatibility — this story adds a new per-feature breakdown, it does not replace the existing aggregate the rest of the app (e.g. the "Feature health" instrument gauge) already depends on.
- Mandatory constraint: any new JSONB field follows this session's own established `_parseJsonbField`-style defensive parsing pattern (fixed this session in PR #511) — must not assume the field is always a string.

## Dependencies

- **Upstream:** None — this is a backend computation change independent of the Modules work in A1/A2.
- **Downstream:** A4 (module-grouped rendering) needs this story's per-feature health output to render the dual health/coverage indicator described in discovery.

## Acceptance Criteria

**AC1:** Given a product's `pipeline-state.json` with at least one feature/epic, When `computeHealthCounts` (or its extended equivalent) runs, Then the result includes a per-feature (or per-epic) health value alongside the existing aggregate counts, not only the aggregate.

**AC2:** Given a feature whose stories have no test data at all (e.g. a docs/ADR-only epic), When per-feature health is computed, Then the resulting health value is NOT silently equal to a value derived from its (non-existent) coverage percentage — i.e. `perFeatureHealth !== deriveFromCoverage(feature)` is a real, verifiable inequality for at least one such feature in a real product, proving the two signals are computed independently rather than one being a repaint of the other.

**AC2a (concretized during implementation, per this story's Architecture Constraints investigation):** Given a real `pipeline-state.json` feature with an explicit `health` field, When the extended `computeHealthCounts` computes that feature's per-feature health entry, Then the value equals that feature's own `health` field, normalized by the exact same rule already used for the aggregate (any value other than `green`/`amber`/`red` — including a missing field — normalizes to `unknown`). The per-feature value is never derived from `testPlan`, `dodStatus`, or any coverage computation. **Investigation finding:** `computeHealthCounts` today reads only `feature.health` (a top-level field on each entry of `pipelineState.features[]`); epics carry no independent health field of their own (confirmed by scanning all real epic objects in this repo's `pipeline-state.json` — their keys are never `health`), so per-feature (not per-epic) is the correct, real granularity. See `artefacts/2026-07-21-web-ui-experience-redesign/plans/a3-plan.md` (Task 0) and `decisions.md` for the full trace.

**AC3:** Given the existing aggregate `health_counts` consumers (e.g. the product view's "Feature health" instrument gauge), When this story's change ships, Then those consumers continue to render correctly with no behavioural change — this is an additive change, not a breaking one.

**AC4:** Given a real product synced via `/product-sync` after this story ships, When the sync completes, Then the per-feature health values are persisted and retrievable on the next page load, not recomputed from scratch on every request.

## Out of Scope

- Rendering the per-feature health signal in the UI — that is A4's job; this story only computes and persists it.
- Redefining what "health" means at the product level (the aggregate `health_counts` semantics are unchanged) — this story adds a per-feature breakdown of the same underlying concept, not a new concept.

## NFRs

- **Performance:** Per-feature health computation for a 150-story product completes within the same sync-time budget as the existing aggregate computation — no order-of-magnitude slowdown to `/product-sync`.
- **Security:** None identified beyond existing tenant-scoping already enforced on the sync pipeline.
- **Accessibility:** N/A — no UI surface in this story.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — the actual source signal for per-feature health has not been confirmed at the code level yet; this story's own investigation may reveal the real computation is simpler or harder than currently assumed. Flag for a check-in once the investigation is done and before implementation proceeds.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
