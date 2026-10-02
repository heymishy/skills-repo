## Epic: Receipt Foundation

**Discovery reference:** artefacts/2026-09-30-refactoring-and-product-health/discovery.md
**Benefit-metric reference:** artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

The refactor receipt write mechanism is proven end-to-end. `pipeline-state.schema.json` declares the `refactorReceipt` and `designHealth` fields. `bin/skills advance` supports JSON-object values via dot-notation. The `/tdd` REFACTOR step requires a structured receipt or an explicit skip reason, and `/verify-completion` allows structural-only rewrites of files already in the DoR contract. A skipped refactor and a completed one are distinguishable in pipeline state for the first time.

## Out of Scope

- Stage 3 design lens in `/implementation-review`
- Design health dimension computation at DoD or `/improve`
- `/workflow` silent-skip warnings
- Automated detection of whether a diff is structural-only
- Any CI enforcement of receipt presence

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md]

## Stories in This Epic

- [ ] Schema co-evolution and `advance` JSON-object write verification — artefacts/2026-09-30-refactoring-and-product-health/stories/ep1-s1.md
- [ ] `/tdd` REFACTOR step receipt protocol — artefacts/2026-09-30-refactoring-and-product-health/stories/ep1-s2.md

## Human Oversight Level

**Oversight:** High
**Rationale:** Solo operator context; schema and shared CLI changes (`bin/skills advance`) affect all skills and all delivery; any regression here would silently corrupt pipeline state across the whole framework.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
