# Story: Fixture — Missing Upstream Dependency Slug

**Epic reference:** artefacts/test-feature/epics/epic-1.md
**Discovery reference:** artefacts/test-feature/discovery.md
**Benefit-metric reference:** artefacts/test-feature/benefit-metric.md

## User Story

As a **tester**,
I want a story with an unresolvable upstream dependency slug,
So that the D1 dependency chain validation test can verify the warning prompt is triggered.

## Benefit Linkage

**Metric moved:** Test metric
**How:** Fixture only — not a real story.

## Architecture Constraints

None.

## Dependencies

- **Upstream:** p2.x-nonexistent-story

## Acceptance Criteria

**AC1:** Given the story is saved, when the D1 check runs, then a warning is surfaced for the missing upstream slug.

## Out of Scope

Everything other than validating the missing-upstream-slug warning.

## NFRs

None.

## Complexity Rating

**Rating:** 1
