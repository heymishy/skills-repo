## Story: Write `schema-migration-review` SKILL.md with rollback evidence check and classification validation

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Auditor (future operator or regulator reading the artefact chain)**,
I want `schema-migration-review` to validate that the classification matches the actual change, that CI-tier rollback execution evidence exists for breaking migrations, and that staging snapshot privacy is declared before sign-off,
So that T3-M1 (breaking migration rollback coverage) reaches its target — a breaking migration cannot reach a PASS review without demonstrating that rollback has been tested at CI tier.

## Benefit Linkage

**Metric moved:** T3-M1 — Breaking migration rollback coverage
**How:** `schema-migration-review` is the enforcement point for CI-tier rollback evidence on breaking migrations; without this skill, the rollback field in mig.1 is a declaration with no validation — this story makes it a verified gate.

## Architecture Constraints

- ADR-004: review checklist must not reference specific tool CLIs (Alembic downgrade, Flyway repair, redis-cli) — checklist items describe what to verify, not which command to run
- ADR-011: governed SKILL.md — PR required for merge
- ADR-012: tool-agnostic — "CI-tier rollback execution evidence" means a log snippet, test result, or operator attestation that the rollback command was executed on a CI-equivalent environment; the format of evidence is not prescribed

## Dependencies

- **Upstream:** mig.1 (migration-plan SKILL.md must exist — migration-review consumes the migration-plan artefact as input)
- **Downstream:** mig.4 (trace) fires on migration-review sign-off; mig.3 (H-MIG DoR gate) validates the migration-review artefact

## Acceptance Criteria

**AC1:** Given a migration-plan artefact classified as breaking, when `schema-migration-review` runs, then the review checklist includes a mandatory CI-tier rollback execution evidence check — the review cannot reach PASS without the operator supplying or attesting to evidence that the rollback command was executed on a CI-equivalent environment.

**AC2:** Given a migration-plan artefact classified as additive-only, when `schema-migration-review` runs, then the rollback evidence check accepts a declaration ("rollback command declared and reviewed — not yet executed") as sufficient — CI-tier execution evidence is not required for additive-only.

**AC3:** Given a migration-plan artefact with the staging-snapshot-privacy field blank or missing, when `schema-migration-review` runs and staging tier is in scope, then the review flags this as a finding and cannot reach PASS until the field is populated.

**AC4:** Given a migration-plan where the classification field reads "additive-only" but the forward migration includes a `DROP COLUMN` or `ALTER COLUMN TYPE` statement, when `schema-migration-review` runs, then the classification coherence check flags a finding — the declared classification does not match the observed change.

**AC5:** Given a migration-review with zero unresolved findings, when the sign-off is produced, then the review artefact is saved at `artefacts/[feature]/migrations/[story-id]-migration-review.md` with status PASS.

## Out of Scope

- Executing the migration or its rollback — the review validates the plan; operators execute
- Automated SQL parsing to detect breaking changes — classification coherence check is a manual review step guided by the checklist, not a linter
- Concurrency, locking, or zero-downtime migration guidance — out of scope for this story

## NFRs

- **Security:** Review checklist must include a step confirming no production credentials appear in the migration command fields
- **Audit:** Artefact path: `artefacts/[feature]/migrations/[story-id]-migration-review.md`

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
