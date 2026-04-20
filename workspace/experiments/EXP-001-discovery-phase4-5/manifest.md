# EXP-001-discovery-phase4-5

## Purpose

First instrumentation experiment. Measures skill performance capture fidelity during /discovery run against the Phase 4/5 strategic reference document (`artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md`).

## Hypothesis

Running /discovery with capture blocks enabled will produce structured metadata (turn count, constraints inferred, files referenced, fidelity self-report) that can be compared across model labels and cost tiers in later experiments.

## Configuration

| Field | Value |
|-------|-------|
| experiment_id | EXP-001-discovery-phase4-5 |
| model_label | claude-opus-4-6 |
| cost_tier | deep-reasoning |
| context.yml block | `instrumentation.enabled: true` |

## Reference material

- Input doc: `artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md` (v6, PR #173)
- Product context: `product/mission.md`, `product/roadmap.md`, `product/constraints.md`

## Runs

| Run | Model | Date | Artefact path |
|-----|-------|------|---------------|
| 1 | claude-opus-4-6 | 2026-04-19 | _pending_ |
