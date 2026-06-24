## Story: Add H-MIG hard block to `/definition-of-ready` SKILL.md for stories with a migration track

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Agent (coding agent receiving DoR instructions)**,
I want `/definition-of-ready` to hard-block on H-MIG when the story is flagged `hasMigrationTrack: true` and no passing migration-review artefact exists with classification declared and forward+rollback pair present,
So that M2 (DoR gate enforcement correctness) reaches 100% — no migration-carrying story can be dispatched to implementation without a validated migration plan and review.

## Benefit Linkage

**Metric moved:** M2 — DoR gate enforcement correctness
**How:** H-MIG is the gate that enforces migration-review sign-off at DoR; without it, `hasMigrationTrack: true` has no pipeline consequence — this story makes it a hard block that cannot be bypassed.

## Architecture Constraints

- ADR-003: H-MIG reads `hasMigrationTrack` and `migrationReviewPath` — both must exist in schema (shr.1) before implementation
- ADR-011: modifies the DoR SKILL.md — governed file; PR required; must be reviewed before gating real stories
- Existing H1-H9, H-E2E, H-NFR, H-INF blocks are unchanged — H-MIG is purely additive (C7 constraint)

## Dependencies

- **Upstream:** shr.1 (schema fields `hasMigrationTrack`, `migrationReviewPath`); mig.2 (migration-review SKILL.md must exist); inf.4 (H-INF must already be merged so H-MIG is added in a consistent DoR SKILL.md state — reduces merge conflicts)
- **Downstream:** None — final story in delivery order for this feature

## Acceptance Criteria

**AC1:** Given a story entry with `hasMigrationTrack: true`, when `/definition-of-ready` runs for that story, then H-MIG appears as a hard-block check in the DoR checklist output.

**AC2:** Given H-MIG is present and `migrationReviewPath` is absent or the artefact at that path does not contain status PASS, when the DoR checklist evaluates H-MIG, then H-MIG shows FAIL and DoR cannot reach sign-off.

**AC3:** Given H-MIG is present and `migrationReviewPath` points to a migration-review artefact with status PASS, classification declared, and both forward migration and rollback migration fields non-blank, when H-MIG is evaluated, then H-MIG shows PASS.

**AC4:** Given a story with `hasMigrationTrack: false` or absent, when `/definition-of-ready` runs, then H-MIG does not appear — existing H1-H9 and H-INF blocks are unaffected.

**AC5:** Given a migration-review artefact classified as breaking that passed review without CI-tier rollback execution evidence (a non-compliant artefact), when H-MIG evaluates it, then H-MIG shows FAIL — the gate checks for classification and rollback evidence, not just artefact existence.

## Out of Scope

- H-INF — that is inf.4
- Automatic setting of `hasMigrationTrack` based on story content detection

## NFRs

- **Audit:** H-MIG finding text must name the expected artefact path and list which fields are missing so the operator knows exactly what is required

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
