## Story: Write `schema-migration-plan` SKILL.md with additive/breaking classification and mandatory forward+rollback pair

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Founder (solo founder/operator)**,
I want to invoke `/schema-migration-plan` and produce a migration plan artefact that explicitly classifies the change as additive-only or breaking, carries both a forward migration and a mandatory rollback migration, declares tier applicability, and includes a staging snapshot privacy approach,
So that T3-M1 (breaking migration rollback coverage) begins to move from 0% — every migration plan now requires a rollback as a first-class field, not an optional note.

## Benefit Linkage

**Metric moved:** T3-M1 — Breaking migration rollback coverage
**How:** The `schema-migration-plan` skill makes rollback migration a mandatory field for all classifications (additive-only and breaking) — the plan cannot be saved without it; this is the structural change that enables T3-M1 to be measured.

## Architecture Constraints

- ADR-004: skill instruction text must not hardcode database tool names (Flyway, Alembic, Liquibase, psql, redis-cli) — migration commands are presented as tool-agnostic text fields ("forward migration command or SQL", "rollback migration command or SQL")
- ADR-011: governed SKILL.md — PR required for merge
- ADR-012: tool-agnostic — classification and rollback fields accept any database tool's migration format as text

## Dependencies

- **Upstream:** shr.1 (hasMigrationTrack flag must exist in schema); mig.5 (staging-data-policy template must exist to be referenced in the staging-snapshot-privacy section)
- **Downstream:** mig.2 (migration-review) consumes the migration-plan artefact as its input

## Acceptance Criteria

**AC1:** Given `/schema-migration-plan` is invoked, when the skill runs, then it produces an artefact at `artefacts/[feature]/migrations/[story-id]-migration-plan.md` containing all five mandatory sections: classification, forward migration, rollback migration, tier applicability, staging snapshot privacy declaration.

**AC2:** Given the migration is classified as breaking (renames a column, removes a table, changes a column type, or adds a NOT NULL column without a default), when the plan artefact is checked, then the classification field reads "breaking" and the rollback migration field is non-blank — a breaking classification with a blank rollback is invalid and the skill must prompt the operator to provide one.

**AC3:** Given the migration is classified as additive-only (adds a nullable column, adds a new table with safe defaults, adds an index), when the plan artefact is checked, then the classification field reads "additive-only" and the rollback migration field is still present and non-blank — rollback is mandatory even for additive-only.

**AC4:** Given the plan artefact's tier-applicability section, when checked, then it covers all four tiers (local, ci, staging, production) with a validation-status column.

**AC5:** Given staging tier is in scope (staging row in tier-applicability is not "Not applicable"), when the migration plan is produced, then the staging-snapshot-privacy section is non-blank and references a completed `staging-data-policy.md` approach.

## Out of Scope

- Executing the migration — the skill plans; the operator executes using their own tooling
- Automatic detection of migration type from SQL diff — classification is operator-declared
- Concurrency or locking strategy guidance — out of scope for this story; a follow-on spike could address this

## NFRs

- **Security:** Skill instruction text must warn against pasting production connection strings or credentials into migration command fields
- **Audit:** Artefact path convention: `artefacts/[feature]/migrations/[story-id]-migration-plan.md`

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
