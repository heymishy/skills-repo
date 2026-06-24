## Story: Extend chain-hash trace to emit on infra-plan sign-off

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Auditor (future operator or regulator reading the artefact chain)**,
I want `/trace` to report the infra-plan sign-off artefact as part of the audit chain for any feature that used the infra track,
So that MM1 (trace completeness for new artefact types) is satisfied — an auditor can trace an infra change from its motivating story through the definition, review, and sign-off artefacts without opening tool-specific CLI output files.

## Benefit Linkage

**Metric moved:** MM1 — Trace completeness for new artefact types
**How:** Without this story, `_writeTrace` never fires for infra-plan events; the infra artefact chain is invisible to `/trace` and the audit claim is incomplete.

## Architecture Constraints

- The `_writeTrace` adapter in `journey.js` and `gate-map.js` must be extended, not replaced — existing code trace events must remain intact and unmodified
- ADR-011: governed SKILL.md (`/trace`) and source module changes — PR required
- ADR-004 applies to any `/trace` SKILL.md instruction changes — no hardcoded tool references

## Dependencies

- **Upstream:** inf.3 (infra-plan SKILL.md must exist — trace fires on infra-plan sign-off event); shr.1 (`hasInfraTrack` flag needed to identify which features have infra trace events)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given an infra-plan sign-off event fires (operator completes `/infra-plan` and the artefact is written), when the trace extension runs, then a trace record is emitted containing the infra-plan artefact path and a SHA-256 hash of the artefact content at time of sign-off.

**AC2:** Given a feature with both a code story DoR gate-confirm and an infra-plan sign-off, when `/trace` runs on that feature, then the trace output includes the infra-plan artefact entry alongside the code story DoR artefact — both appear, no gap.

**AC3:** Given a feature with no infra track (`hasInfraTrack` absent or false), when `/trace` runs, then no infra trace entries appear and existing code story trace events are unchanged — zero regression.

## Out of Scope

- Trace extension for migration-review sign-off — that is mig.4
- Retroactive trace emission for infra-plan artefacts that existed before this story ships — trace fires on sign-off events; historical artefacts are not backfilled

## NFRs

- **Security:** The trace record stores the artefact path and SHA-256 hash — not the artefact content; no credentials or sensitive plan detail in the trace record
- **Audit:** SHA-256 hash must be computed at sign-off time from the artefact file content on disk (not from in-memory content) — consistent with existing trace pattern

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
