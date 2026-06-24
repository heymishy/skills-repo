## Epic: Schema migrations are classified, have tested rollbacks, and appear in the audit chain

**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md
**Slicing strategy:** Walking skeleton — mig.5 (staging-data-policy template) and mig.1 (plan skill) lay the foundation; mig.2 (review skill) fleshes it out; mig.4 (trace) and mig.3 (DoR gate) complete the integration. mig.5 can land in parallel with mig.1 since it is a template dependency.

## Goal

When this epic is complete, every database schema change (Postgres, Redis key structure, or structured file format) that passes through this pipeline has been explicitly classified as additive-only or breaking, carries a mandatory forward+rollback pair, declares which tiers it has been validated against, and includes a staging snapshot privacy approach. Breaking migrations cannot proceed to production sign-off without CI-tier rollback execution evidence. Running `/definition-of-ready` on a story with `hasMigrationTrack: true` is hard-blocked until the migration-review sign-off exists. Running `/trace` on the feature reports the migration-review artefact in the audit chain with no gap.

## Out of Scope

- Infrastructure change governance — that is Epic 2
- Automated migration execution or rollback execution — the platform validates; operators execute
- Automated classification enforcement (linters that detect breaking changes from SQL diff) — classification is operator-declared, reviewer-validated
- Staging snapshot provisioning or data anonymisation tooling — the staging-data-policy template declares the approach; it does not provision the environment
- Web UI journey changes to show migration track as a first-class stage — STAGE_SEQUENCE is unchanged (C3 constraint)

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2 — DoR gate enforcement correctness | 0% | 100% | mig.3 adds H-MIG hard block that fires when hasMigrationTrack: true and migration-review artefact is absent |
| MM1 — Trace completeness for new artefact types | 0 migration trace events | 100% of migration-review sign-offs in trace chain | mig.4 extends _writeTrace to emit on migration-review sign-off |
| T3-M1 — Breaking migration rollback coverage | 0% (no migration governance today) | 100% of breaking migrations have CI-tier rollback evidence | mig.1 makes rollback mandatory in the plan; mig.2 validates CI-tier execution evidence for breaking migrations |

## Stories in This Epic

- [ ] mig.5 — Write `staging-data-policy` template with three named options and declared-choice field
- [ ] mig.1 — Write `schema-migration-plan` SKILL.md with additive/breaking classification and forward+rollback pair
- [ ] mig.2 — Write `schema-migration-review` SKILL.md with rollback evidence check and classification validation
- [ ] mig.4 — Extend chain-hash trace to emit on migration-review sign-off
- [ ] mig.3 — Add H-MIG hard block to `/definition-of-ready` SKILL.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** All stories write or modify SKILL.md files or templates — governed files per ADR-011. mig.3 modifies the DoR SKILL.md; its change must be reviewed before it gates real stories.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
