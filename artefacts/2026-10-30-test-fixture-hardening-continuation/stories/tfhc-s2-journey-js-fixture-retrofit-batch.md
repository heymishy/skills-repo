## Story: Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture

**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer/engineer debugging or extending journey.js's existing test coverage**,
I want **a bounded batch of the remaining hand-rolled journey.js test files migrated to the shared fixture**,
So that **fewer files carry the silent-divergence risk the shared fixture exists to close, and the incremental-migration pattern is proven at a larger scale than the single file `tsir-s1` migrated**.

## Benefit Linkage

**Metric moved:** journey.js fixture duplication, continued (m2)
**How:** Each file migrated removes one more instance of the hand-rolled pattern that caused `ctpl-s1`; migrating a batch (not just one) also stress-tests whether the incremental approach holds at scale, not just for a single proof-of-pattern file.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. `domain: [testing]` injects `.github/standards/testing/test-design-patterns.md`.

## Dependencies

- **Upstream:** `tests/helpers/journey-fixture.js` (from `tsir-s1`, already merged).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the shared journey-fixture module already exists (`tsir-s1`), When 3–5 of the remaining 16 hand-rolled `journey.js` test files are migrated to import and use it, Then all of their existing assertions continue to pass unchanged.

**AC2:** Given the migrated batch, When `node scripts/check-journey-fixture-usage.js` is run against each migrated file, Then it reports 0 findings (no hand-rolled pattern detected) for each.

**AC3:** Given the migration, When the full regression suite (`node scripts/run-all-tests.js`) is run, Then it passes with no new failures introduced by the migration.

**AC4:** Given the batch size chosen (3–5 files), When migration is complete, Then the count of `journey.js`-touching files that still hand-roll `mockReq` (per `node scripts/check-journey-fixture-usage.js`) drops from 16 to a number consistent with the batch size (11–13).

## Out of Scope

- Migrating the remaining 11–13 files beyond this batch — fast-follow (see discovery.md Out of Scope item 1).
- Changing any migrated file's existing test assertions' intent — migration only, not a test-quality pass.

## NFRs

- **Performance:** None identified.
- **Security:** None identified — `tests/` only, no `src/` change.
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
