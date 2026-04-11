# Story: Fixture — External Dependency Annotation

**Epic reference:** artefacts/test-feature/epics/epic-1.md
**Discovery reference:** artefacts/test-feature/discovery.md
**Benefit-metric reference:** artefacts/test-feature/benefit-metric.md

## User Story

As a **tester**,
I want a story with an external dependency annotation,
So that the D1 external dependency acknowledgement test can verify the annotation format is preserved.

## Benefit Linkage

**Metric moved:** Test metric
**How:** Fixture only — not a real story.

## Architecture Constraints

None.

## Dependencies

- **Upstream:** p2.x-nonexistent-story [External: third-party payment gateway integration — confirmed by operator on 2026-04-11]

## Acceptance Criteria

**AC1:** Given the story Dependencies block contains an External annotation, when the D1 check runs, then no warning is re-surfaced for that slug in the same session.

## Out of Scope

Everything other than validating the external dependency annotation format.

## NFRs

None.

## Complexity Rating

**Rating:** 1
