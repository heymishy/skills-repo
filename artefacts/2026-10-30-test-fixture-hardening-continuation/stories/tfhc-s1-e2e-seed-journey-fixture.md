## Story: Extract a shared E2E fixture for seeding an approval journey

**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer/engineer extending existing E2E test coverage**,
I want **a single shared fixture for seeding an approval journey via `/test/seed-approval-journey`**,
So that **I don't have to hand-roll a new inline payload each time, and don't risk the same silent divergence that `ctpl-s1`'s unit-test equivalent had — now one layer up, at the E2E level**.

## Benefit Linkage

**Metric moved:** E2E seed-fixture duplication (m1)
**How:** Providing one canonical seed-journey fixture to import removes the reason to hand-roll a new inline payload — the same mechanism by which `journey.js`'s unit-test duplication happened in the first place, now closed at the E2E layer too.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. `domain: [testing]` injects `.github/standards/testing/test-design-patterns.md`.

## Dependencies

- **Upstream:** None — this fixture is E2E-layer-specific, independent of `journey.js`'s own unit-test fixture (`tsir-s1`).
- **Downstream:** None in this epic.

## Acceptance Criteria

**AC1:** Given no shared E2E fixture exists today, When a spec requires the new `tests/e2e/fixtures/seed-journey.js` module, Then it exports a function that POSTs to `/test/seed-approval-journey` with sensible defaults for `featureSlug` and `stage`, and returns the parsed response (including `journeyId`).

**AC2:** Given the shared fixture, When a caller needs a specific stage (e.g. `'test-plan'`, `'definition'`), Then it accepts an `overrides` parameter that merges over the defaults without requiring the caller to reconstruct the whole payload by hand.

**AC3:** Given 2 of the 4 real callers of `/test/seed-approval-journey` (e.g. `ep3-s1-regression.spec.js` and one other), When they are migrated to import and use the shared fixture instead of their own inline payload, Then all of their existing assertions continue to pass unchanged.

**AC4:** Given the migrated specs, When the full E2E suite's seed-related specs are run, Then no new flakiness or timing regression is introduced — same pass/fail outcome as before migration.

## Out of Scope

- Migrating the other 1–2 real callers of `/test/seed-approval-journey` beyond this proof-of-pattern batch — fast-follow (see discovery.md Out of Scope item 1).
- Extending this fixture to any of the other non-journey-related `/test/seed-*` endpoints (`seed-presence`, `seed-signals`, etc.) — out of this epic entirely, they are not journey-related.

## NFRs

- **Performance:** None identified — a thin wrapper around an existing POST call, not a new runtime concern.
- **Security:** None identified — the endpoint is guarded by `NODE_ENV === 'test'` in the real server route; no production code path touched.
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
