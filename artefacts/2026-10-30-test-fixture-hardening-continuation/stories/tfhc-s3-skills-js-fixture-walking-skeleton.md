## Story: Extract a shared mockReq/mockRes fixture module for skills.js tests

**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer/engineer debugging or extending skills.js's existing test coverage**,
I want **a single shared mockReq/mockRes fixture module for skills.js tests, plus a dedicated self-test and a structural `/review` check**,
So that **I don't have to hand-roll a new mock each time, and a future divergence bug on skills.js fails loudly at its own source rather than spreading silently across 45 consumer files**.

## Benefit Linkage

**Metric moved:** skills.js fixture duplication (m3)
**How:** Mirrors `tsir-s1`/`s2`/`s3`'s exact proven mechanism (fixture + self-test + structural check) for `skills.js`, the repo's single largest fixture-duplication surface (45 consumers, more than `journey.js`'s 41).

## Architecture Constraints

`product/constraints.md` #13 ("Structural governance preferred over instructional") — the structural check in AC4/AC5 must be a CI/review-gate-verifiable mechanism, not an advisory checklist line, same precedent as `tsir-s3`.

CLAUDE.md "Platform change policy (Phase 2+)" — AC5's edit to `skills/review/SKILL.md` is a platform-infrastructure change and must go through a feature-branch PR with platform-team review, not a direct commit to master, same as `tsir-s3`.

## Dependencies

- **Upstream:** None.
- **Downstream:** None in this epic.

## Acceptance Criteria

**AC1:** Given no shared fixture module exists for `skills.js` today, When a developer requires the new `tests/helpers/skills-fixture.js` module, Then it exports a factory function returning a `mockReq` object whose default session shape is grounded in `skills.js`'s real `req.session` reads (`login`, `tenantId`, `accessToken`, `userId`, `role` — cross-checked against the real route code; confirmed identical in shape to `journey.js`'s own canonical fixture during this feature's `/clarify` session).

**AC2:** Given the shared fixture module, When `tests/check-skills-fixture-self-test.js` is run, Then it asserts the factory's default shape includes every field `skills.js`'s route handlers actually read, and that an `overrides` parameter merges correctly without discarding other defaults.

**AC3:** Given one existing `skills.js` test file among the 12 hand-rolled ones, When it is migrated to import and use the shared fixture instead of its own hand-rolled `mockReq`, Then all of its existing assertions continue to pass unchanged.

**AC4:** Given `scripts/check-skills-fixture-usage.js` (same shape as the existing `check-journey-fixture-usage.js` / `check-design-tokens.js` precedent), When it is run against a hand-rolled `skills.js` test file, Then it exits non-zero and names the shared fixture module as the fix; When run against the migrated file from AC3, Then it exits 0 with no findings.

**AC5:** Given the check script, When it is wired into `/review`'s own flow (`skills/review/SKILL.md`), Then a hand-rolled `mockReq` on a `skills.js`-touching file surfaces as a new, named finding category in `/review`'s output — not silently passed through.

## Out of Scope

- Migrating the other 11 hand-rolled `skills.js` files beyond the 1 proof-of-pattern migration in AC3 — fast-follow (see discovery.md Out of Scope item 1).
- Promoting the new check to a `/definition-of-ready` hard block — trigger-based, not in scope (see discovery.md Out of Scope item 5).

## NFRs

- **Performance:** Self-test and structural check both complete in well under 1 second (plain object factory / grep-based pattern match; no network or database access).
- **Security:** None identified — the module lives under `tests/helpers/` or `scripts/` only; no new production code path.
- **Accessibility:** Not applicable — no UI.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity — wiring a new finding category into /review's existing SKILL.md flow needs more care than a pure standalone script, same reasoning as tsir-s3's own Rating 2. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
