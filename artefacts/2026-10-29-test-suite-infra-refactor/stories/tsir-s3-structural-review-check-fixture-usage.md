## Story: Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files

**Epic reference:** artefacts/2026-10-29-test-suite-infra-refactor/epics/journey-js-shared-test-fixture.md
**Discovery reference:** artefacts/2026-10-29-test-suite-infra-refactor/discovery.md
**Benefit-metric reference:** artefacts/2026-10-29-test-suite-infra-refactor/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer/engineer (or AI coding agent) running the inner loop**,
I want **`/review` to automatically flag a hand-rolled mockReq in any journey.js-touching test file**,
So that **I get a structural signal to use the shared fixture instead of remembering this history myself, or finding out only after a ctpl-s1-style bug ships**.

## Benefit Linkage

**Metric moved:** Adoption
**How:** Gives the "100% of new journey.js-touching stories use it" target a real, structural enforcement mechanism at `/review`, rather than relying on organic/voluntary adoption alone.

## Architecture Constraints

`product/constraints.md` #13 ("Structural governance preferred over instructional") — this check must be a CI/review-gate-verifiable mechanism, not an advisory checklist line, per the `/clarify` decision logged in `decisions.md` (DESIGN entry, 2026-10-29). `domain: [testing]` injects `.github/standards/testing/test-design-patterns.md` — AC4 below applies its mutation-test discipline.

CLAUDE.md "Platform change policy (Phase 2+)" — AC3's edit to `skills/review/SKILL.md` is a platform-infrastructure change and must go through a feature-branch PR with platform-team review, not a direct commit to master, same as any other `SKILL.md` edit. (Added via /review 1-M2, 2026-10-29.)

## Dependencies

- **Upstream:** Story 1 (`tsir-s1`) — the check needs the shared fixture module's real export shape to know what "using it" looks like.
- **Downstream:** None in this story. Promoting this check to a `/definition-of-ready` hard block is an explicit next-slice decision (see `decisions.md` revisit trigger), not in scope here.

## Acceptance Criteria

**AC1:** Given a test file that requires `journey.js` and defines its own local `mockReq`-shaped object (e.g. a `const`/function literally constructing `{ session: {...}, ... }`) instead of importing the shared fixture module, When `node scripts/check-journey-fixture-usage.js <file>` is run against it, Then it exits non-zero and reports the file path plus a message naming the shared fixture module as the fix.

**AC2:** Given a test file that correctly imports and uses the shared fixture module (Story 1's output), When the check is run against it, Then it exits 0 with no findings.

**AC3:** Given the check script, When it is wired into `/review`'s own flow (`skills/review/SKILL.md`), Then a hand-rolled `mockReq` on a `journey.js`-touching file surfaces as a new, named finding category in `/review`'s output — not silently passed through.

**AC4:** Given AC1's hand-rolled test file, When it is modified to remove the hand-rolled object (simulating the fix being applied), Then the check now exits 0 — proving its pass/fail signal is tied to the actual presence or absence of the hand-rolled pattern, not a fixed answer. Per `.github/standards/testing/test-design-patterns.md`'s mutation-test discipline, this must be verified by actually performing the before/after comparison, not assumed from the detection logic alone.

## Out of Scope

- Promoting this check from a `/review` finding to a `/definition-of-ready` hard block — explicitly deferred to a next-slice decision per `decisions.md`'s logged revisit trigger ("if adoption falls below the minimum signal...").
- Extending this check to `skills.js`/`products.js`/`journeys.js` consumers — a separate future slice, same boundary as Story 1's Out of Scope.

## NFRs

- **Performance:** Check completes in well under 1 second per file (grep-based pattern match; no network or database access).
- **Security:** None identified — reads local file content only, same threat model as the existing precedent `scripts/check-design-tokens.js`.
- **Accessibility:** Not applicable — no UI.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity — wiring a new finding category into /review's existing SKILL.md flow and output format, and tuning the grep pattern to avoid false positives/negatives across varied journey.js-touching test files, needs more care than a pure standalone script. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
