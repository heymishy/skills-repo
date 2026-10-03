## Epic: Receipt Readers

**Discovery reference:** artefacts/2026-09-30-refactoring-and-product-health/discovery.md
**Benefit-metric reference:** artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

The three skills that consume receipt data are live. `/implementation-review` has a Stage 3 design lens that reads receipts and surfaces cross-task design findings. `/definition-of-done` confirms and records the design health dimension in the health roll-up. `/improve` computes Metrics 1–4 and snapshots the design dimension time series. `/workflow` surfaces silent-skip warnings during active delivery. The design dimension is present in pipeline state for every feature run under the new protocol.

## Out of Scope

- The design dimension ever becoming a hard block (advisory only in v0)
- Static-analysis metrics (deferred to Phase 5+)
- The `/refactor` skill for post-DoD merged features (next epic)
- Automated diff parsing or static analysis in Stage 3

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md]

## Stories in This Epic

- [ ] Stage 3 design lens in `/implementation-review` — artefacts/2026-09-30-refactoring-and-product-health/stories/ep2-s1.md
- [ ] Design health dimension at DoD and `/improve` — artefacts/2026-09-30-refactoring-and-product-health/stories/ep2-s2.md
- [ ] `/workflow` silent-skip warning signal — artefacts/2026-09-30-refactoring-and-product-health/stories/ep2-s3.md

## Human Oversight Level

**Oversight:** High
**Rationale:** Solo operator context; changes touch five skills with existing complex logic; any regression in `/definition-of-done` or `/improve` would silently degrade all feature health reporting.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
