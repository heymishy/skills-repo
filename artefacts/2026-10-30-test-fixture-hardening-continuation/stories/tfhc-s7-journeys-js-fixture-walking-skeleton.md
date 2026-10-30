## Story: Extract a shared mockReq/mockRes fixture module for journeys.js tests

**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Spike reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/spikes/tfhc-s5-output.md (PROCEED verdict unlocks this story)
**Domain:** [testing]

## User Story

As a **developer/engineer debugging or extending journeys.js's existing test coverage**,
I want **a single shared mockReq/mockRes fixture module for journeys.js tests, plus a dedicated self-test and a structural `/review` check**,
So that **I don't have to hand-roll a new inline session object each time, and a future divergence bug on journeys.js fails loudly at its own source rather than spreading silently across 31 consumer files**.

## Benefit Linkage

**Metric moved:** `journeys.js` fixture duplication (m8)
**How:** Mirrors `tsir-s1`/`s2`/`s3`'s and `tfhc-s3`'s exact proven mechanism (fixture + self-test + structural check + `/review` wiring) for `journeys.js`, confirmed by `tfhc-s5`'s spike to have the highest, most uniform duplication rate of any surface addressed so far (30/31 real callers, 0 even using a local factory function — pure ad-hoc inline literal repetition).

## Architecture Constraints

`product/constraints.md` #13 ("Structural governance preferred over instructional") — the structural check in AC4/AC5 must be a CI/review-gate-verifiable mechanism, not an advisory checklist line, same precedent as `tsir-s3`/`tfhc-s3`.

CLAUDE.md "Platform change policy (Phase 2+)" — AC5's edit to `skills/review/SKILL.md` is a platform-infrastructure change and must go through a feature-branch PR with platform-team review, not a direct commit to master, same as `tsir-s3`/`tfhc-s3`.

## Dependencies

- **Upstream:** `tfhc-s5` (spike) — PROCEED verdict confirmed before this story was written. Not a blocking pipeline dependency now that the spike is closed.
- **Downstream:** None in this epic.

## Acceptance Criteria

**AC1:** Given no shared fixture module exists for `journeys.js` today, When a developer requires the new `tests/helpers/journeys-fixture.js` module, Then it exports a factory function returning a `mockReq` object whose default session shape is grounded in `journeys.js`'s real `req.session` reads — confirmed by `tfhc-s5`'s spike to be exactly one field, `tenantId`, simpler than either `journey.js`'s or `skills.js`'s own 5-field fixture shape. Do not copy either existing fixture's shape wholesale.

**AC2:** Given the shared fixture module, When `tests/check-journeys-fixture-self-test.js` is run, Then it asserts the factory's default shape includes every field `journeys.js`'s route handlers actually read (independently re-derived from `journeys.js`'s own source at test-run time, same verified-genuine improvement `tfhc-s3`'s own self-test introduced over the `journey-fixture` precedent — not hardcoded), and that an `overrides` parameter merges correctly without discarding other defaults.

**AC3:** Given one existing `journeys.js` test file among the 30 hand-rolled ones (selected for having the simplest, most representative inline-literal shape), When it is migrated to import and use the shared fixture instead of its own hand-rolled inline `req`/`res` object, Then all of its existing assertions continue to pass unchanged.

**AC4:** Given `scripts/check-journeys-fixture-usage.js` (same shape as the existing `check-journey-fixture-usage.js` / `check-skills-fixture-usage.js` precedent, broadened per `tfhc-s5`'s own detection-pattern finding to match `(?:const|var|let)\s+req\s*=\s*\{[^}]*session\s*:` inline literals, not just a named `mockReq` factory), When it is run against a hand-rolled `journeys.js` test file, Then it exits non-zero and names the shared fixture module as the fix; When run against the migrated file from AC3, Then it exits 0 with no findings.

**AC5:** Given the check script, When it is wired into `/review`'s own flow (`skills/review/SKILL.md`), Then a hand-rolled inline session literal on a `journeys.js`-touching file surfaces as a new, named finding category (Category H) in `/review`'s output — not silently passed through. The entry-point category count/letter-range must be updated at every location it appears (both the Step 1 announcement line and the `rssp-s1` operational instruction) — `tfhc-s3`'s own Critical code-quality finding was exactly this fix applied in only one of the two required places.

## Out of Scope

- Migrating the other 29 hand-rolled `journeys.js` files beyond the 1 proof-of-pattern migration in AC3 — fast-follow (see discovery.md Out of Scope item 1, and `tfhc-s5`'s own spike recommendation).
- `products.js`'s own separately-confirmed 27/32 duplication — a distinct, lower-priority fast-follow per `tfhc-s5`'s spike, not folded into this story to avoid discovery.md's own named CI-concurrency-collision risk of running too many differently-shaped stories under one epic at once.
- Promoting the new check to a `/definition-of-ready` hard block — trigger-based, not in scope (see discovery.md Out of Scope item 5).

## NFRs

- **Performance:** Self-test and structural check both complete in well under 1 second (plain object factory / grep-based pattern match; no network or database access).
- **Security:** None identified — the module lives under `tests/helpers/` or `scripts/` only; no new production code path.
- **Accessibility:** Not applicable — no UI.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1

<!-- Lower than tfhc-s3's Rating 2 -- journeys.js's fixture shape is simpler (1 field vs 5), the pattern is now proven a 4th time (tsir-s1/s2/s3, tfhc-s3), and the only genuinely new wrinkle (broadening the detection regex for inline literals rather than a named factory) was already worked out and verified during tfhc-s5's own spike, not left as an open risk for this story. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
