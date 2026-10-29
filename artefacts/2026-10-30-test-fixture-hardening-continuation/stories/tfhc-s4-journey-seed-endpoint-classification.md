## Story: Classify the 5 journey-related E2E seed endpoints as redundant or legitimate

**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Domain:** [testing]

## User Story

As the **platform maintainer who owns the long-term health of this repo's test infrastructure**,
I want **a documented classification of the 5 journey-related E2E seed endpoints as redundant or legitimately different**,
So that **a future decision about consolidating them is based on evidence, not on an unverified "13-endpoint sprawl" assumption**.

## Benefit Linkage

**Metric moved:** Journey-seed-endpoint classification completeness (m4)
**How:** Directly produces the classification this metric measures — closing an open unknown within this cycle instead of deferring it to a future, separately-scoped discovery.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. Read-only investigation, no implementation.

## Dependencies

- **Upstream:** None.
- **Downstream:** None — any resulting fast-follow is logged, not built, as part of this story.

## Acceptance Criteria

**AC1:** Given the 5 journey-related `/test/seed-*` endpoints (`seed-approval-journey`, `seed-board-journey`, `seed-actr-s2-journey`, `seed-ppc-s5-journey`, `seed-journey-gate-session`), When each endpoint's real handler code and its callers' payloads are read, Then a classification artefact records, for each endpoint, whether it is redundant with another endpoint (same shape, same purpose) or legitimately different (distinct scenario or data shape).

**AC2:** Given the classification is complete, When any endpoint is found redundant, Then the artefact names a correctly-sized fast-follow scope for consolidating it (which endpoints, how many callers affected) rather than a vague "needs consolidation" note.

**AC3:** Given the classification is complete, When no endpoint is found redundant, Then the artefact states this explicitly and closes the question — no further action required.

**AC4:** Given the classification artefact, When it is reviewed at this story's own `/definition-of-done`, Then it is saved at a stable path referenced by this feature's `benefit-metric.md` Metric 4.

## Out of Scope

- Consolidating or modifying any of the 5 endpoints — classification only, not implementation.
- Classifying the other 8 non-journey-related `/test/seed-*` endpoints (`seed-presence`, `seed-signals`, etc.) — out of this epic entirely, they are not journey-related.

## NFRs

- **Performance:** Not applicable — one-time investigation, not a runtime concern.
- **Security:** None identified.
- **Accessibility:** Not applicable — no UI.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
