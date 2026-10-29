# Discovery: Test Suite Infrastructure Refactor

**Status:** Approved
**Created:** 2026-10-29
**Approved by:** Hamish King, Platform Owner — 2026-10-29
**Author:** Copilot

---

## Problem Statement

This repo's test suite (`scripts/run-all-tests.js`, 809 files, plus a separate 94-file Playwright E2E suite) has grown organically via a "one `check-<story-slug>.js` file per story" convention with no shared test-infrastructure layer. This produces four concrete, measured costs: (1) an 8–10 minute, fully-sequential full-suite run with zero parallelism, confirmed stable across 5 runs during a single session; (2) a real flakiness surface — 29 of 54 files touching `journey-store.js` never reset its shared in-memory state, already confirmed to cause false failures in the E2E suite's shared webServer process; (3) duplicated, divergent test fixtures — `journey.js` alone is required by 42 test files, 17 of which hand-roll their own near-identical `mockReq` factory, which directly caused extra, avoidable rework during a security-critical fix (`ctpl-s1`) when two of those files turned out to have silently divergent default `tenantId` values; (4) no organizational structure — a flat 792-file directory with filename-glob-only discovery, no manifest, and no fast/slow tiering, so finding "what tests cover file X" requires grepping the whole suite by hand every time. Coverage itself is not the problem — a diagnostic audit found no dead tests and no orphaned references; the problem is runtime, reliability, and maintainability of the test infrastructure itself.

## Who It Affects

1. **Developer/engineer (or AI coding agent) running the inner loop** — needs a fast, trustworthy signal that their change didn't break anything, at `/branch-setup`'s baseline check, after every task, and before `/verify-completion`. One session alone ran the full suite 8+ times across 4 stories — over an hour of pure wait time. Worse than the wait: flakiness actively wastes investigation time and risks wrong conclusions — that same session had to build a careful stash-based "compare against unmodified code" technique specifically to avoid misattributing a pre-existing flake (`ep1-s4`) to a real fix; a less careful pass could have shipped an unnecessary "fix" for a problem that didn't exist.
2. **Developer/engineer debugging or extending an existing route's test coverage** — needs to find "what already tests `journey.js`" before touching it, and reuse an existing fixture rather than inventing a new one. Today there's no way to do this except grep the whole suite by hand, which is exactly how two of `journey.js`'s 42 test files ended up with silently divergent `mockReq` defaults — a real correctness risk, not just an inconvenience, discovered only because a security fix (`ctpl-s1`) broke both in different ways.
3. **Platform maintainer** — owns the long-term health of this repo's own test infrastructure; the duplication and organization debt compounds with every new `check-<story-slug>.js` file this repo's own convention keeps producing (already 780 of them), making the problem strictly worse over time if the convention itself doesn't change.

## Why Now

Accumulated pain reaching a tipping point, directly observed in a single session, not hypothetical: 4 stories ran through the inner loop in one session, each needing the 8-10 minute suite multiple times; a real flaky-test incident (`ep1-s4`) required a non-trivial debugging detour to avoid shipping a wrong fix; and the duplication gap directly added investigation overhead during a security-critical fix (`ctpl-s1`) — a higher-stakes failure mode than on routine work, since a fixture bug on a security fix risks shipping the fix incorrectly, not just slowly. Plus a scale argument: 780 files now, growing with every new story under the current convention, so the audit's "close to guaranteed" cost only gets worse without intervention.

## MVP Scope

A shared test-fixture/helper module (a `mockReq`/`mockRes` factory) for `journey.js` specifically — the one file a real session incident (`ctpl-s1`) proved causes correctness risk from fixture divergence, not just inconvenience. Success for the MVP = the next story that touches `journey.js` uses the shared fixture instead of hand-rolling a new one, and no new fixture-divergence bug like `ctpl-s1`'s reaches review.

Two items added via `/clarify` (see Clarification log):
- **A dedicated self-test for the shared fixture module itself**, asserting its own shape/defaults are correct — consistent with this repo's existing convention of testing shared test-infrastructure directly rather than relying on downstream consumers to surface a regression indirectly (precedent: `tests/check-wuce17-e2e-infra.js` for the E2E fixture layer, `tests/check-pcr-s1-test-runner.js` for the test runner itself). Bounds the "a bug in the shared module ripples across all 42 consumers at once" blast-radius risk named below.
- **One small structural check** (`check-journey-fixture-usage.js`, same shape as the existing `check-design-tokens.js` / `H-DESIGN` gate) that greps any file touching `journey.js` tests for a hand-rolled `mockReq`-shaped object instead of the shared fixture, wired into `/review` as a new finding category (not yet a `/definition-of-ready` hard block — promoting it to one is a next-slice decision once the pattern's proven). Chosen over an advisory `/review` checklist line per `product/constraints.md` #13 ("structural governance preferred over instructional") — the platform's own stated rule for exactly this kind of choice.

Deliberately not runner parallelization or the full 780-file cleanup in this first slice — see Out of Scope. The platform owner has confirmed bigger scope is wanted for the next slice(s) after this one; this MVP is the first of several planned slices, not a standalone effort.

## Out of Scope

- **`scripts/run-all-tests.js` parallelization** — explicitly planned as a near-term next slice, deferred here because of a real git-commit-collision risk (prior session finding: some tests fire real git commits as a side effect, which could race/collide under concurrency) that needs its own design pass before it's safe to parallelize.
- **Extending the shared fixture pattern to the other heavily-duplicated files** (`skills.js`: 49 consumers, `products.js`: 40, `journeys.js`: 40) — planned as a near-term next slice once the `journey.js` pattern is proven, not abandoned.
- **Closing the 29-file `_clearForTesting` gap across the whole suite** — only the `journey.js`-specific subset of that gap is in scope here; the rest is a planned near-term next slice.
- **Auditing or fixing the full 780-file suite file-by-file** — explicitly not needed per the diagnostic audit, which found no dead tests and no orphaned references across the whole suite.

## Assumptions and Risks

**Resolved via /clarify:**

- **Git-commit-collision risk — resolved, narrower than originally stated.** The root cause (`src/web-ui/routes/skills.js`'s real `git commit` call in the skill-turn-stream handler) is already behind a D37 injectable adapter (`setSkillTurnGitCommitAdapter`, story `stis-s1`, already merged), defaulting to real behaviour in production and stubbed by exactly 12 known test files today. The risk is confined to the skill-turn artefact-completion code path, not spread pervasively across all 64 subprocess-spawning files. Does not block this MVP; still relevant context for the deferred `scripts/run-all-tests.js` parallelization slice.
- **No CI workflow file changes needed for the journey.js-fixture MVP — confirmed.** A shared `mockReq`/`mockRes` module is purely an application/test-file-level change; no `.github/workflows/*.yml` edits are required.
- **Blast-radius risk — resolved by adding scope, not left as a risk.** See MVP Scope: a dedicated self-test for the shared fixture module itself is now in scope, bounding this risk rather than accepting it unmitigated.
- **Adoption-without-enforcement risk — resolved by adding scope, not left as a risk.** See MVP Scope: a structural `/review` check (`check-journey-fixture-usage.js`) is now in scope, giving the Success Indicators' adoption target a real enforcement mechanism rather than relying on organic adoption alone.

**Deferred — relevant to next slices, not blocking this MVP:**

- Whether the 42 existing `journey.js`-touching files can be migrated to the shared fixture incrementally (one file at a time) without a forced "big bang" cutover — this MVP doesn't retrofit the existing 42 (see Out of Scope), so the question only matters once a retrofit slice is actually proposed. Carry forward to that slice's own discovery.
- Whether `journey.js` is representative enough of the duplication problem that the pattern proven here transfers cleanly to `skills.js`/`products.js`/`journeys.js` later — carry forward to whichever of those is scoped as the next slice; validate against that file's own consumer set rather than assuming transfer.

## Directional Success Indicators

1. **Fixture duplication:** Baseline 17/42 `journey.js`-touching files hand-roll their own `mockReq` (audit-confirmed). Target: 0 new hand-rolled fixtures going forward. Measured via: grep count at each future `journey.js`-touching story's review.
2. **Divergence-bug incidence:** Baseline ≥1 confirmed occurrence (`ctpl-s1`). Target: 0 further occurrences. Measured via: capture-log entries tagged to this bug class.
3. **Adoption:** Baseline 0/42 files use a shared fixture today. Target: 100% of NEW `journey.js`-touching stories use it (retrofitting the existing 42 is explicitly out of scope). Measured via: `check-journey-fixture-usage.js`'s structural `/review` finding (added via /clarify, see MVP Scope), backed by the same grep-count method as #1 for independent confirmation.

## Constraints

None identified.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- [Name — Role]

## Approved By

Hamish King — Platform Owner — 2026-10-29

## Clarification log

[2026-10-29] Clarified via /clarify:
- Q: Is the real-git-commit-collision risk confined to a small subset, and are CI workflow changes needed for this MVP? A: Resolved by investigation (no user input needed) — commit risk is already mitigated via `stis-s1`'s D37 adapter and confined to known call sites; no CI workflow changes required.
- Q: Should the shared fixture module ship with a dedicated self-test to bound the blast-radius risk? A: Yes — added to MVP scope, matching this repo's existing precedent for shared test-infrastructure (`check-wuce17-e2e-infra.js`, `check-pcr-s1-test-runner.js`).
- Q: Should the MVP bundle an adoption-enforcement mechanism, or accept organic adoption as the bet? A: Add one structural check (`check-journey-fixture-usage.js`, same shape as `check-design-tokens.js`/H-DESIGN), wired into `/review` as a new finding category — chosen over an advisory checklist line per `product/constraints.md` #13 ("structural governance preferred over instructional").

---

**Next step:** /benefit-metric
