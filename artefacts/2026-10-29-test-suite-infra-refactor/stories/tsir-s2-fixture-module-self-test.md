## Story: Add a dedicated self-test for the shared journey.js fixture module

**Epic reference:** artefacts/2026-10-29-test-suite-infra-refactor/epics/journey-js-shared-test-fixture.md
**Discovery reference:** artefacts/2026-10-29-test-suite-infra-refactor/discovery.md
**Benefit-metric reference:** artefacts/2026-10-29-test-suite-infra-refactor/benefit-metric.md
**Domain:** [testing]

## User Story

As a **platform maintainer who owns the long-term health of this repo's test infrastructure**,
I want **a dedicated test that verifies the shared journey.js fixture module's own shape and defaults are correct**,
So that **a regression in the shared module fails loudly and immediately in its own test, not confusingly across all 42 consumer files at once**.

## Benefit Linkage

**Metric moved:** Divergence-bug incidence (bounds blast radius)
**How:** Catches a regression in the shared fixture at its source — before it can manifest as a confusing, hard-to-trace downstream failure (or worse, a silent pass) spread across dozens of consumer files.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. `domain: [testing]` injects `.github/standards/testing/test-design-patterns.md` — in particular its "mutation-test a fix's own new test before trusting it" rule, which AC2 below directly applies.

## Dependencies

- **Upstream:** Story 1 (`tsir-s1`) — the shared fixture module must exist first.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the shared fixture module from Story 1, When `tests/check-journey-fixture-self-test.js` is run, Then it asserts the factory's default `mockReq` shape includes every field `journey.js`'s route handlers actually read from `req.session` — cross-checked against the real route code, not assumed from the module's own implementation.

**AC2:** Given the self-test, When the shared module's default `tenantId` is temporarily changed to an empty string (simulating a real regression), Then the self-test fails — proving it actually detects a genuine regression, not just that the module loads without throwing. Per `.github/standards/testing/test-design-patterns.md`'s mutation-test discipline, this must be verified by actually performing the temporary change and confirming the failure, then reverting it, before this AC is considered met.

**AC3:** Given the self-test, When it runs as part of the full suite (`node scripts/run-all-tests.js`), Then it completes in under 1 second and introduces no new flakiness (no network calls, no filesystem writes, no shared global/module-level state that could pollute other tests).

**AC4:** Given Story 1 AC4's overrides-merge behaviour, When the self-test exercises an override, Then it asserts the merged object contains the overridden value and every other field still at its default.

## Out of Scope

- Testing every one of the 42 existing consumer files' own individual usage of the fixture — this story covers only the shared module itself, not its consumers.
- Performance/load testing of the fixture module — it is a plain object factory, not a load-bearing runtime concern.

## NFRs

- **Performance:** Self-test completes in under 1 second (AC3).
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
