## Story: Extract a shared mockReq/mockRes fixture module for journey.js tests

**Epic reference:** artefacts/2026-10-29-test-suite-infra-refactor/epics/journey-js-shared-test-fixture.md
**Discovery reference:** artefacts/2026-10-29-test-suite-infra-refactor/discovery.md
**Benefit-metric reference:** artefacts/2026-10-29-test-suite-infra-refactor/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer/engineer debugging or extending journey.js's existing test coverage**,
I want **a single shared mockReq/mockRes fixture module I can import**,
So that **I don't have to hand-roll a new mock each time, and don't risk a silent default divergence like the one that contributed to the ctpl-s1 incident**.

## Benefit Linkage

**Metric moved:** Fixture duplication (also the root enabler for Divergence-bug incidence)
**How:** Providing one canonical, correct `mockReq`/`mockRes` shape to import removes the reason to hand-roll a new one — the actual mechanism by which 17 of 42 existing files diverged in the first place.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. `domain: [testing]` injects `.github/standards/testing/test-design-patterns.md` at `/definition-of-ready`.

## Dependencies

- **Upstream:** None
- **Downstream:** Story 2 (dedicated self-test) and Story 3 (structural `/review` check) both require this module to exist first.

## Acceptance Criteria

**AC1:** Given no shared fixture module exists today, When a developer requires the new `tests/helpers/journey-fixture.js` module, Then it exports a factory function returning a `mockReq` object whose default shape (`session.tenantId`, and every other field journey.js's route handlers read from `req.session`) matches what existing hand-rolled mocks in `journey.js`'s test files currently construct.

**AC2:** Given the shared fixture module, When an existing `journey.js` test file (`tests/check-ep1-s1-journey-feature-merge.js`) is migrated to import and use it instead of its own hand-rolled `mockReq`, Then all of that file's existing assertions continue to pass unchanged.

**AC3:** Given the shared fixture module's default `mockReq`, When no override is passed, Then `session.tenantId` defaults to a non-empty, clearly-synthetic test value (never `''` and never `undefined`) — avoiding the exact `'' === ''` collision class that `ctpl-s1` needed a dedicated test to catch.

**AC4:** Given the factory function, When a caller needs to override a specific field (e.g. `tenantId` for one test case), Then it accepts an `overrides` parameter that merges over the defaults without requiring the caller to reconstruct the whole object by hand.

## Out of Scope

- Migrating any of the other 41 existing `journey.js`-touching files beyond the one proof-of-pattern migration in AC2 — full retrofit is explicitly out of scope for this MVP (see epic and discovery.md).
- Extending this fixture pattern to `skills.js`/`products.js`/`journeys.js` — a separate future slice.

## NFRs

- **Performance:** None identified — a plain object factory, not a runtime-performance concern.
- **Security:** None identified — the module lives under `tests/helpers/` only; it introduces no new production code path.
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
