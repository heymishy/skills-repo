## Story: Extend chain-hash trace to emit on migration-review sign-off

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Auditor (future operator or regulator reading the artefact chain)**,
I want `/trace` to report the migration-review sign-off artefact as part of the audit chain for any feature that used the migration track,
So that MM1 (trace completeness for new artefact types) is satisfied for migrations — the schema migration is traceable from motivating story through plan and review sign-off without requiring the auditor to open migration tool logs.

## Benefit Linkage

**Metric moved:** MM1 — Trace completeness for new artefact types
**How:** Without this story, the migration-review sign-off is invisible to `/trace`; the migration governance chain has no audit record in the pipeline's trace output — this story closes that gap.

## Architecture Constraints

- The `_writeTrace` adapter must be extended, not replaced — existing code trace events must remain intact
- ADR-011: governed source module and `/trace` SKILL.md changes — PR required
- SHA-256 hash must be computed from artefact file content on disk (consistent with existing trace pattern per CLAUDE.md ougl disk-canonicity rule)

## Dependencies

- **Upstream:** mig.2 (migration-review SKILL.md must exist — trace fires on migration-review sign-off event); shr.1 (`hasMigrationTrack` flag)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a migration-review sign-off event fires (operator completes `/schema-migration-review` and the PASS artefact is written to disk), when the trace extension runs, then a trace record is emitted containing the migration-review artefact path and a SHA-256 hash of the artefact content at time of sign-off.

**AC2:** Given a feature with both a code story DoR gate-confirm and a migration-review sign-off, when `/trace` runs on that feature, then the trace output includes the migration-review artefact entry alongside the code story DoR artefact — both appear, no gap.

**AC3:** Given a feature with no migration track (`hasMigrationTrack` absent or false), when `/trace` runs, then no migration trace entries appear and existing code story trace events are unchanged — zero regression.

## Out of Scope

- Trace extension for infra-plan sign-off — that is inf.5
- Retroactive trace emission for migration-review artefacts that pre-date this story

## NFRs

- **Security:** Trace record stores path and SHA-256 hash only — not migration SQL content, not forward/rollback commands
- **Audit:** SHA-256 computed from disk content (not in-memory) — consistent with ougl disk-canonicity rule

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
