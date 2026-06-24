## Epic: Pipeline schema and path convention support infra and migration tracks

**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md
**Slicing strategy:** Walking skeleton — this epic IS the skeleton. shr.1 lays the schema foundation both tracks depend on; shr.2 enables standalone ops use independently.

## Goal

When this epic is complete, the pipeline harness accepts `hasInfraTrack` and `hasMigrationTrack` flags on story entries and validates them without error. The `infra-plan` and `migration-review` artefact paths can be recorded on story entries in pipeline-state.json. Standalone infra changes (secrets rotations, firewall rules) that are not attached to a feature delivery can be run under an `ops/YYYY-MM-DD-[slug]` path without any pipeline tooling needing modification. Both tracks can build on top of this foundation without touching the schema or harness again.

## Out of Scope

- The infra-definition, infra-review, infra-plan, schema-migration-plan, or schema-migration-review SKILL.md files — those are written in Epics 2 and 3
- Any UI changes to show infra or migration track state in pipeline-viz.html — dashboard rendering of the new fields is a follow-on feature
- Automated enforcement of hasInfraTrack or hasMigrationTrack at gate time — the DoR hard-blocks (H-INF, H-MIG) are written in Epics 2 and 3; this epic only provides the schema fields those blocks will read

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2 — DoR gate enforcement correctness | 0% (H-INF and H-MIG don't exist) | 100% | shr.1 adds the schema fields H-INF and H-MIG read — without them the gates cannot evaluate |
| MM2 — No STAGE_SEQUENCE change required | 8 stages unchanged | Zero diff after delivery | shr.1 and shr.2 add fields and path conventions with no STAGE_SEQUENCE modification |

## Stories in This Epic

- [ ] shr.1 — Extend pipeline-state schema and harness for infra and migration track flags
- [ ] shr.2 — Support `ops/` path prefix for standalone infra changes

## Human Oversight Level

**Oversight:** Medium
**Rationale:** shr.1 touches the schema file and the advance harness — core pipeline machinery. Changes require PR review before merge.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
