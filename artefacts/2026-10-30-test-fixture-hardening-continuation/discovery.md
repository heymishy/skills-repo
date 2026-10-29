# Discovery: Test Fixture Hardening — Continuation

**Status:** Draft — awaiting approval
**Created:** 2026-10-30
**Approved by:** Pending
**Author:** Claude Sonnet 5

---

## Problem Statement

This repo still has two live instances of the same fixture-divergence risk that `ctpl-s1` and the `test-suite-infra-refactor` epic (`tsir-s1`/`s2`/`s3`) just fixed at the `journey.js` unit-test layer — just not closed everywhere yet. (1) **E2E layer, unmitigated:** 4 Playwright specs under `tests/e2e/` call `/test/seed-approval-journey` directly, each hand-rolling their own inline payload instead of a shared fixture — the same failure class as `ctpl-s1`, one layer up, confirmed live by this session's own E2E coverage audit (2026-10-30). (2) **Unit layer, only ~1/17 closed:** 16 of the original 42 `journey.js`-touching test files still hand-roll `mockReq`, since the MVP intentionally retrofitted only one proof-of-pattern file. (3) **Largest surface, not yet started:** `discovery.md` (the original `test-suite-infra-refactor` discovery) named `skills.js` (49 consumers — bigger than `journey.js`'s 42) as the next slice once the pattern was proven; it now is, and this session confirmed the duplication is real (12 of 45 `skills.js`-touching files hand-roll a mockReq-shaped object). All three share the same root cause (no shared test fixture, no structural enforcement) and the same proven fix shape (walking skeleton: fixture module → self-test → structural `/review` check) — just not yet applied everywhere it's needed.

Two additional, smaller unknowns surfaced during this session's own scoping conversation, both cheap enough to resolve now rather than deferred indefinitely: whether the apparent "13-endpoint E2E seed sprawl" is real duplication or mostly legitimate different scenarios (narrowed on inspection to 5 genuinely journey-related endpoints), and whether `products.js`/`journeys.js` carry the same duplication problem as `skills.js`, and whether the runner-parallelization git-commit-collision risk named in the original discovery is still live across all originally-named call sites or has shrunk since `stis-s1`'s D37 adapter shipped.

## Who It Affects

1. **Developer/engineer (or AI coding agent) running the inner loop** on any `journey.js`-, `skills.js`-, or E2E-touching story — needs a trustworthy signal that their change didn't break anything, but currently risks working against a fixture that silently diverges from the real route-handler shape at three separate surfaces (two unit-test layers plus E2E).
2. **Developer/engineer extending existing test coverage** on `journey.js`, `skills.js`, or adding a new E2E spec — needs to reuse an existing fixture rather than inventing a new one; today has to hand-roll in all three places, since the shared-fixture pattern only exists for `journey.js`'s unit-test layer so far.
3. **Platform maintainer** — owns the long-term health of this repo's test infrastructure; the duplication/divergence risk compounds with every new story touching any of these three surfaces without a shared fixture.

## Why Now

Direct trigger — this session's own `/trace` and E2E coverage audit (run 2026-10-30, immediately after the `test-suite-infra-refactor` epic's DoD) surfaced all three gaps in one sitting: the E2E fixture risk confirmed live and unmitigated, `skills.js`'s duplication confirmed real (12/45), and the `journey.js` retrofit still sitting at 16/41 files untouched. The fix shape (walking skeleton: fixture → self-test → structural check) has now been proven twice over — shipped, merged, DoD-complete — so the risk of applying it to the remaining surfaces is known-low. The cost of waiting only grows: every new story touching any of these surfaces before this ships adds to a duplication problem that already has a working, proven fix sitting unused.

## MVP Scope

Apply the already-proven walking-skeleton pattern to all confirmed-live surfaces, each bounded the same way the original `journey.js` MVP was bounded — one mechanism plus one proof-of-pattern migration, not a full retrofit. Two additional items are structured as spikes with an explicit verdict gate, so an unresolved unknown doesn't silently become a new, separately-deferred discovery.

1. **E2E seed-journey fixture** — extract `tests/e2e/fixtures/seed-journey.js` wrapping `/test/seed-approval-journey`; migrate 2–3 of its 4 real callers as proof-of-pattern.
2. **`journey.js` retrofit** — migrate a bounded batch (3–5) of the remaining 16 hand-rolled files. Also answers the previously-deferred question from the original discovery: can the 42 files be migrated incrementally, one at a time, without a forced big-bang cutover?
3. **`skills.js` extension** — the full walking skeleton (fixture module + self-test + structural check), with exactly one proof-of-pattern migration among its 12 hand-rolled files — mirrors `tsir-s1`'s own AC2 shape exactly.
4. **Journey-seed-endpoint classification** — bounded, read-only audit of the 5 genuinely journey-related `/test/seed-*` endpoints (`seed-approval-journey`, `seed-board-journey`, `seed-actr-s2-journey`, `seed-ppc-s5-journey`, `seed-journey-gate-session`): which are redundant vs. legitimately different scenarios. Output is a classification finding, not a fix — if overlap is found, it becomes a correctly-sized fast-follow; if not, it's documented and closed.
5. **Spike: `products.js`/`journeys.js` duplication** — verify whether either has the same hand-rolled-fixture problem as `skills.js`. **Verdict PROCEED** → implement the walking skeleton for whichever is confirmed, within this same MVP, same bounded shape as item 3. **Verdict DEFER/REJECT** → stays out of scope, no new discovery needed to say so.
6. **Spike: parallelization git-commit-collision risk** — enumerate exactly which of the 64 subprocess-spawning files named in the original discovery are still not behind the `stis-s1` D37 adapter. **Verdict PROCEED** (risk fully contained or a small closeable list) → implement `scripts/run-all-tests.js` parallelization within this same MVP. **Verdict REDESIGN/DEFER** → stays blocked exactly as it is today, but with a precise list instead of a vague risk.

Success for this MVP = mechanisms 1–3 exist and are structurally enforced; item 4's classification is documented; items 5–6's spikes have a recorded verdict (with implementation following only if PROCEED). Full retrofit of the remaining files in each surface is explicitly deferred (see Out of Scope).

## Out of Scope

1. **Full retrofit of all remaining hand-rolled files** — the other ~13 `journey.js` files, ~11 `skills.js` files, and the 1–2 remaining `/test/seed-approval-journey` callers beyond the proof-of-pattern batches — ***Fast-follow*** once this MVP proves adoption across all 3 surfaces; natural immediate next step, not an open-ended deferral.
2. **`products.js` and `journeys.js` implementation** beyond what item 5's spike itself unlocks — ***Fast-follow*** if the spike's verdict is PROCEED and implementation doesn't land within this MVP's own cycle for capacity reasons; otherwise resolved within this MVP.
3. **Runner parallelization implementation** beyond what item 6's spike itself unlocks — **Gated, not fast-follow**, unless the spike's verdict is PROCEED. If REDESIGN/DEFER, remains blocked with no fixed timeline until the remaining risk is independently resolved.
4. **The 4 functional E2E coverage gaps** (side-trip, spike, recommit, estimate flows) found in the 2026-10-30 E2E audit — **intentionally a separate discovery**, not deferred due to size or an unresolved unknown. This is a different kind of exclusion than items 1–3: it's a deliberate split, not a punt.
5. **Promoting any of the new structural checks to a `/definition-of-ready` hard block** — **Trigger-based, not fast-follow.** Only happens if adoption falls below the minimum signal; no fixed timeline.

## Assumptions and Risks

- [ASSUMPTION] The remaining `journey.js` files can be migrated to the shared fixture incrementally, one at a time, without a forced "big-bang" cutover — unconfirmed, requires `/clarify` before scope is locked. (This is the exact question the original discovery deferred; this MVP's batch migration is partly meant to answer it, but we don't yet know going in.)
- [ASSUMPTION] `skills.js`'s real `req.session` shape is groundable into one canonical fixture shape the same clean way `journey.js`'s was — unconfirmed, requires `/clarify` before scope is locked. (Risk: if different `skills.js` handlers read meaningfully different session subsets, a single canonical shape may not transfer as cleanly as it did for `journey.js`.)
- [ASSUMPTION] The E2E `/test/seed-approval-journey` endpoint's payload contract is stable and uniform enough across its 4 callers to extract one shared fixture from — unconfirmed, requires `/clarify` before scope is locked. (Risk: some callers may be seeding genuinely different scenarios — e.g. different stages — not just duplicating the same shape; the existing `journeyFixture(overrides)` pattern from `tsir-s1` likely covers this, but it hasn't been confirmed against the E2E endpoint's own statefulness.)
- **Risk (not a constraint):** Running 6 differently-shaped stories (2 mechanisms, 1 classification, 2 spikes, plus their conditional implementations) under one epic risks the same CI concurrency-collision pattern (`deploy-group`) seen repeatedly during the original epic, if any two stories' PRs are open simultaneously.
- **Risk (not a constraint):** The "fast-follow" items named in Out of Scope could go stale if this MVP's own cycle runs long — worth a deliberate check-in once this ships, not an open-ended "someday."

## Directional Success Indicators

1. **E2E seed-fixture duplication:** Baseline: 4 files call `/test/seed-approval-journey` directly, 0 using a shared fixture (confirmed 2026-10-30). Target: 2–3 migrated in this MVP; 0 new hand-rolled callers after. Measured via: new structural check (same shape as `check-journey-fixture-usage.js`).
2. **`journey.js` duplication (continued):** Baseline: 16/41 hand-rolled (confirmed 2026-10-30). Target: 11–13/41 after this MVP's batch migration. Measured via: existing `check-journey-fixture-usage.js`.
3. **`skills.js` duplication:** Baseline: 12/45 hand-rolled (confirmed 2026-10-30). Target: 11/45 after one proof-of-pattern migration; 0 new after. Measured via: new structural check.
4. **Journey-seed-endpoint classification:** Baseline: `[UNKNOWN BASELINE]` — 5 journey-related endpoints exist, overlap status unresolved (that's this story's job). Target: a documented redundant-vs-legitimate verdict for all 5. Measured via: the classification artefact itself.
5. **`products.js`/`journeys.js` duplication (spike):** Baseline: `[UNKNOWN BASELINE]`. Target: a confirmed duplication count for each, plus a PROCEED/DEFER/REJECT verdict. Measured via: the spike's own verdict artefact.
6. **Parallelization risk (spike):** Baseline: `[UNKNOWN BASELINE]` — original discovery confined the risk to "known call sites" but never enumerated them. Target: a precise list of remaining at-risk files, plus a PROCEED/REDESIGN/DEFER verdict. Measured via: the spike's own verdict artefact.
7. **Divergence-bug incidence (cross-cutting, extended scope):** Baseline: 1 confirmed occurrence (`ctpl-s1`), `journey.js`-specific. Target: 0 new occurrences across `journey.js`, `skills.js`, or E2E seed-journey after this MVP ships. Measured via: `capture-log.md` entries tagged to this bug class, reviewed at each DoD.

## Constraints

- No new npm dependencies — plain Node.js (`require()`), matching this repo's existing `tests/check-*.js` / `scripts/check-*.js` convention.
- Any new structural check wired into `/review`'s own flow (`skills/review/SKILL.md`) — items 1 and 3 both propose this — must go through CLAUDE.md's Platform change policy (feature-branch PR, not a direct commit to master), same as `tsir-s3`.
- Solo-operator capacity — same constraint as the original `test-suite-infra-refactor` discovery.
- None identified beyond the above — no regulatory, budget, or external-dependency constraints apply to test-tooling-only work.

## Contributors

- Hamish King — Platform Owner — 2026-10-30

## Reviewers

- [Name — Role]

## Approved By

Pending

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- The remaining `journey.js` files can be migrated to the shared fixture incrementally, one at a time, without a forced "big-bang" cutover.
- `skills.js`'s real `req.session` shape is groundable into one canonical fixture shape the same clean way `journey.js`'s was.
- The E2E `/test/seed-approval-journey` endpoint's payload contract is stable and uniform enough across its 4 callers to extract one shared fixture from.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

**Next step:** Human review and approval → /benefit-metric
