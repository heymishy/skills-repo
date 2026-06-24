## Story: Add H-INF hard block to `/definition-of-ready` SKILL.md for stories with an infra track

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Agent (coding agent receiving DoR instructions)**,
I want `/definition-of-ready` to hard-block on H-INF when the story is flagged `hasInfraTrack: true` and no infra-plan sign-off artefact exists,
So that M2 (DoR gate enforcement correctness) reaches 100% — no infra-carrying story can be dispatched to implementation without a validated, signed-off infra plan.

## Benefit Linkage

**Metric moved:** M2 — DoR gate enforcement correctness
**How:** H-INF is the gate that enforces infra-plan sign-off at DoR; without it, `hasInfraTrack: true` is an inert flag with no pipeline consequence — this story makes it a hard block.

## Architecture Constraints

- ADR-003 (schema-first): H-INF reads `hasInfraTrack` and `infraPlanPath` — these fields must exist in schema (shr.1) before this story is implemented
- ADR-011: modifies the DoR SKILL.md — governed file; PR required; change must be reviewed before it gates real stories
- Existing H1-H9, H-E2E, H-NFR blocks are unchanged — H-INF is purely additive (C7 constraint from discovery)

## Dependencies

- **Upstream:** shr.1 (schema fields `hasInfraTrack`, `infraPlanPath` must exist); inf.3 (infra-plan SKILL.md must exist so DoR can reference it in the hard-block description)
- **Downstream:** None — this is the final infra track story in delivery order

## Acceptance Criteria

**AC1:** Given a story entry in `pipeline-state.json` with `hasInfraTrack: true`, when `/definition-of-ready` runs for that story, then H-INF appears as a hard-block check in the DoR checklist output.

**AC2:** Given H-INF is present in the checklist and `infraPlanPath` is absent or the artefact at that path does not contain status PASS, when the DoR checklist evaluates H-INF, then H-INF shows FAIL and the overall DoR cannot reach sign-off.

**AC3:** Given H-INF is present and `infraPlanPath` points to an infra-plan artefact containing status PASS, when the DoR checklist evaluates H-INF, then H-INF shows PASS and does not block sign-off.

**AC4:** Given a story entry with `hasInfraTrack: false` or `hasInfraTrack` absent, when `/definition-of-ready` runs, then H-INF does not appear in the checklist — the existing H1-H9 blocks are completely unaffected.

## Out of Scope

- Automatic setting of `hasInfraTrack` based on story content — the flag is operator-set via `skills advance hasInfraTrack=true`
- H-MIG — that is mig.3

## NFRs

- **Audit:** H-INF finding text must name the expected artefact path so the operator knows exactly what is missing

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
