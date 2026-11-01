## Story: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts

**Epic reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/epics/test-infra-fast-follow-batch.md
**Discovery reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/discovery.md
**Benefit-metric reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer/engineer extending `journeys.js`, `products.js`, or any of the fixture-usage-check scripts**,
I want **a further bounded batch of `journeys.js` files migrated to the shared fixture, a `products.js` walking skeleton with its own proof-of-pattern migration, and the 3 near-identical fixture-usage-check scripts collapsed into one shared factory**,
So that **the remaining fixture-divergence risk on `journeys.js`/`products.js` keeps shrinking, and a bug found in one fixture-usage-check script (like the windowed-match fix in `tfhc-s7`) gets fixed once, not up to 3 times with no guarantee of consistency**.

## Benefit Linkage

**Metric moved:** `journeys.js` shared-fixture adoption (m3), `products.js` shared-fixture adoption (m4), Fixture-usage-check script count (m5)
**How:** Each of the 3 tasks in this story directly moves one metric: migrating 3-5 more `journeys.js` files moves m3 toward its target; building `products.js`'s own walking skeleton + 1 migration moves m4 from 0; collapsing the 3 scripts into 1 shared factory moves m5 from "3 near-duplicates" to "1 source of truth."

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. Same finding as the parent epic's own `journeys.js`/`journey.js`/`skills.js` walking-skeleton stories (`tfhc-s3`, `tfhc-s7`).

## Dependencies

- **Upstream:** None — the shared-fixture pattern and the 3 existing fixture-usage-check scripts this story extends/refactors are already merged and stable.
- **Downstream:** None named yet.

## Acceptance Criteria

**AC1:** Given 3-5 of the remaining 30 hand-rolled `journeys.js`-touching test files, When each is migrated to the shared fixture (`tests/helpers/journeys-fixture.js`), Then each migrated file's own existing assertions pass unchanged.

**AC2:** Given `products.js` currently has 0 of its real callers using a shared fixture, When a walking skeleton (fixture → self-test → structural check) is built and 1 real caller is migrated as proof-of-pattern, Then the migrated file's own existing assertions pass unchanged.

**AC3:** Given the new `products.js` structural check, When run against a deliberately hand-rolled fixture file and the migrated file, Then it correctly flags the hand-rolled one and passes the migrated one (mutation-test discipline, same precedent as the `journey.js`/`skills.js`/`journeys.js` structural checks).

**AC4:** Given the 3 existing fixture-usage-check scripts (`check-journey-fixture-usage.js`, `check-skills-fixture-usage.js`, `check-journeys-fixture-usage.js`), When they are rewritten to call one new shared factory (`scripts/lib/make-fixture-usage-check.js`), Then: (a) `check-journey-fixture-usage.js`'s and `check-journeys-fixture-usage.js`'s own existing dedicated regression fixtures (including `tfhc-s7`'s windowed-match-fix fixtures) produce identical pass/fail verdicts to before the refactor; (b) `check-skills-fixture-usage.js` — confirmed to have no dedicated regression-fixture/mutation-test pair today, unlike its two siblings — gets one created as part of this refactor (a hand-rolled-fixture case and a compliant-fixture case, same gold-standard shape as the other two), closing that pre-existing coverage gap rather than carrying it forward silently.

**AC5:** Given the shared factory replaces 3 independent implementations, When it is built, Then it retains the one known correctness fix already present in `check-journeys-fixture-usage.js` (the nested-brace windowed-match fix from `tfhc-s7` — a 300-character bounded window after a session declaration, confirmed present via `AD_HOC_SESSION_WINDOW` in the current script) — verified by the same dedicated regression fixture that originally caught this bug (`tests/fixtures/tfhc-s7-hand-rolled-mockreq-session-not-first.js`) still passing against the shared factory.

## Out of Scope

- Full completion of the `journeys.js` retrofit beyond this story's own 3-5 file batch — the remaining files stay hand-rolled, deferred again.
- `products.js`'s full retrofit beyond the 1 proof-of-pattern migration.
- Promoting any of the 3 (now 1 shared) structural checks to a `/definition-of-ready` hard block — still trigger-based on adoption data.
- Any behaviour change to the 3 scripts' own detection logic beyond what's needed to share it — this is a DRY extraction, not a redesign.

## NFRs

- **Performance:** Shared factory + self-test + structural check execution time < 1 second per file, same precedent as every prior walking-skeleton story in this lineage.
- **Security:** None identified — no new production code path, all deliverables live under `tests/`/`scripts/` only.
- **Accessibility:** N/A — no UI.
- **Audit:** N/A — no audit-relevant surface.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

<!-- Rating 1: all 3 sub-items are proven patterns already executed at least twice each in the parent epic (journey.js, skills.js, journeys.js walking skeletons; and the DRY-extraction shape itself was already named and scoped as a candidate at tfhc-s7's own DoD). This is the epic's own lowest-risk story, consistent with risk-first sequencing placing it last. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
