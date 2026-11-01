# Discovery: Fixture Hardening Fast-Follows

**Status:** Clarified — awaiting approval
**Created:** 2026-11-01
**Approved by:** Pending
**Author:** Copilot

---

## Problem Statement

Four known gaps remain from the `fixture-divergence-closure` epic's own delivery (closed 2026-11-01), each already evidenced within that epic's own stories:

1. Only 1 of 31 `journeys.js`-touching test files uses the shared fixture pattern (`tfhc-s7`) — the other 30 still hand-roll session objects, carrying the same silent-divergence risk the pattern exists to prevent.
2. `products.js` has a parallel, confirmed-but-unaddressed duplication problem (`tfhc-s5`'s own spike confirmed the count and a PROCEED verdict, but the implementation itself was out of scope for that epic).
3. Three near-identical fixture-usage-check scripts (`check-journey-fixture-usage.js`, `check-skills-fixture-usage.js`, `check-journeys-fixture-usage.js`) duplicate the same detection logic — already bitten once, when a windowed-match bug had to be fixed in one script (`tfhc-s7`) with no guarantee the other two don't share it.
4. `run-all-tests.js`'s new concurrency (`tfhc-s9`) had to be throttled to a conservative cap (`Math.max(1, Math.ceil(os.cpus().length / 3))` — effectively 3-way parallelism on an 8-core machine) because at least 3 pre-existing files (`check-rb-s3-harness-agnostic-instructions.js`, `check-cat-s4-features-page-integration.js`, `check-cat-s1-core-trace-builder.js`) have wall-clock NFR budgets that assume exclusive CPU access and flake under higher concurrency — an open-ended category actively capping how much speed the suite (which runs on every PR, many times a day) could otherwise recover.

A fifth, related item surfaced during this same epic and was deliberately deferred rather than fixed: GitHub Actions' `deploy-group` concurrency lock cancels the older of two closely-timed pushes outright (confirmed via the job's own "Canceling since a higher priority waiting request for deploy-group exists" annotation) rather than queuing fairly, causing the Scenario A/B E2E jobs to be silently skipped on several PRs in this same epic (`tfhc-s7`, `tfhc-s8`, `tfhc-s9`).

## Who It Affects

1. **Developer/engineer (or AI coding agent) running the inner loop** on any `journey.js`/`skills.js`/`journeys.js`/`products.js`-touching story, or waiting on CI — pays the cost of both the unmitigated divergence risk (30 remaining hand-rolled `journeys.js` files, all of `products.js`) and the throttled test-suite speed, on every PR.
2. **Developer/engineer maintaining the fixture-usage-check scripts** — currently has to fix the same class of bug in up to 3 separate near-identical files, with no shared source of truth.
3. **Platform maintainer** — owns the long-term health of this repo's test infrastructure, CI cost/latency, and CI reliability (the deploy-group cancellation pattern erodes trust in a red/skipped E2E check being meaningful).

## Why Now

Direct trigger — all five items were named and evidenced within the `fixture-divergence-closure` epic that just closed (2026-11-01), while the context and tooling (shared-fixture pattern, fixture-usage-check script shape, concurrency mechanism, the deploy-group root cause) are fresh and already proven or diagnosed. `tfhc-s9` itself just confirmed both the upside (40.1% real CI speedup already landed) and the ceiling (throttled to a conservative cap specifically because of NFR-budget fragility) — the fix for the ceiling is now a well-understood, bounded problem, not a new investigation. Every day these items sit unaddressed, `journeys.js`/`products.js` divergence risk compounds with each new story touching those files, the fixture-check DRY debt grows if a 4th near-identical script is ever added, the suite keeps running below its real achievable speed on every PR, and the deploy-group pattern keeps silently skipping E2E coverage on PRs that happen to push twice in quick succession.

## MVP Scope

Three bounded stories, sized to keep outer-loop overhead proportionate to how mechanical and well-understood each item already is:

1. **Mechanical fixture/DRY batch (1 story, 3 tasks)** — `journeys.js` retrofit, a further bounded batch of 3-5 of the remaining 30 hand-rolled files; `products.js` fixture duplication, walking-skeleton (fixture → self-test → structural check) + 1 proof-of-pattern migration; DRY-extraction of the 3 fixture-usage-check scripts into one shared factory (`scripts/lib/make-fixture-usage-check.js`), zero behaviour change.
2. **NFR-budget sweep + concurrency re-tune (1 story)** — fix `rb-s3`/`cat-s4`/`cat-s1`'s wall-clock assumptions so they tolerate concurrent execution, then re-tune `run-all-tests.js`'s concurrency cap upward and re-verify in both local and real CI (same measurement technique already proven at `tfhc-s9`'s own DoD).
3. **CI `deploy-group` concurrency-cancellation fix (1 story)** — correct the concurrency-group scoping or add an automatic "detect cancelled-due-to-concurrency, rerun once" wrapper, so pushes landing close together don't silently skip E2E coverage.

Success for this MVP = all 3 stories delivered with a recorded verdict; items 1-2's benefit metrics show measurable improvement; item 3 shows zero (or auto-recovered) cancellations on subsequent PRs.

## Out of Scope

- Full completion of the `journeys.js` retrofit beyond the bounded 3-5 file batch — the remaining ~25 files stay hand-rolled, deferred again as a further fast-follow.
- Any new parallelization mechanism (sharding across multiple CI runners, a different test framework) — this batch only re-tunes the concurrency cap `tfhc-s9` already built, it doesn't redesign the mechanism.
- Per-PR ephemeral staging environments — the bigger structural alternative named in the original CI-concurrency finding. This batch's fix is the narrower, bounded one (correct the `deploy-group` concurrency-group scoping / add an automatic retry for a concurrency-cancelled run), not an environment-architecture redesign.
- Promoting any fixture-usage-check script to a `/definition-of-ready` hard block — still trigger-based on adoption data, not part of this batch.
- The `getAllTestFiles`/`GRANDFATHER_LIST` existence-check gap (found during `tfhc-s9`) — no concrete consumer need driving it yet.

## Assumptions and Risks

- Resolved via /clarify (2026-11-01): the `deploy-group` concurrency-cancellation fix does NOT need Fly.io infrastructure changes — `concurrency: deploy-group` is set directly in `.github/workflows/e2e.yml` and `staging-deploy.yml`, a pure GitHub Actions feature. The root mechanism is a genuine GitHub Actions platform limitation (a concurrency group holds only one *waiting* request; a newer one evicts the older waiting one outright, with no native fair-queue option) — this rules out a simple reconfiguration fix and confirms the real options are exactly the two already named in Out of Scope: an automatic rerun-on-cancellation wrapper (in scope), or ephemeral environments (out of scope).
- Resolved via /clarify (2026-11-01): the NFR-budget sweep's per-file fix complexity is treated as genuinely unknown, not assumed to be a simple threshold widen — `tfhc-s9` already falsified the "predictable in advance" version of this same judgment once this session (two full rounds of cap-tuning discovery; `cat-s1` only surfaced on a *second* full-suite run at an already-fixed concurrency value). No real distribution of contended-run times exists yet for `rb-s3`/`cat-s4`/`cat-s1`, only single data points, so a widen-only approach can't yet be confirmed safe without risking "a threshold that never fails" (not a real NFR, per this discovery's own Constraints section). The NFR-budget-sweep story is sized with room for per-file investigation tasks, not as fixed-task-only.
- [ASSUMPTION] No additional fragile wall-clock-budget files beyond the 3 already found will surface during this sweep — unconfirmed; `tfhc-s9` itself found a new one (`cat-s1`) on its *second* full-suite run at a *fixed* concurrency value, so this is a real, evidenced risk, not a theoretical one. This is the story's own open question to resolve during implementation, not a precondition to answer here.
- Risk: if the NFR-budget sweep finds significantly more than 3 fragile files, that story's own bounded scope may need revisiting mid-implementation (same pattern `tfhc-s9` already went through once, over two correction rounds).

## Directional Success Indicators

- **`run-all-tests.js` concurrency cap:** Baseline: `Math.max(1, Math.ceil(os.cpus().length / 3))` (3 on the 8-core reference machine). Target: pushed as high as the NFR-budget sweep allows without reintroducing contention-flakes — ideally `os.cpus().length - 1` or higher. Measured via: repeated local full-suite runs (3+ trials) plus the real-CI `Unit test chain` step duration (same technique used at `tfhc-s9`'s own DoD).
- **Real CI `Unit test chain` step duration:** Baseline: 124s (confirmed on PR #1048). Target: a further reduction proportional to whatever cap increase is achieved. Measured via: `gh api` job step timing on the first PR from this batch.
- **`journeys.js` shared-fixture adoption:** Baseline: 1 of 31. Target: 6-9 of 31 (the 1 already migrated + this batch's 3-5). Measured via: `scripts/check-journeys-fixture-usage.js` + grep-count cross-check.
- **`products.js` shared-fixture adoption:** Baseline: 0 of N (N confirmed at `tfhc-s5`'s own spike). Target: 1 migrated as proof-of-pattern. Measured via: new structural check, same shape as the `journey.js`/`skills.js`/`journeys.js` precedents.
- **Fixture-usage-check script count:** Baseline: 3 near-identical scripts. Target: 1 shared factory + 3 thin call sites, 0 behaviour change. Measured via: existing regression fixtures for all 3 scripts still pass unchanged.
- **CI `deploy-group` cancellation incidence:** Baseline: observed 3+ times this session alone (`tfhc-s7`, `tfhc-s8`, `tfhc-s9` PRs). Target: 0 going forward, or an automatic rerun closes the gap when it still occurs. Measured via: GitHub Actions run history / job annotations on subsequent PRs.

## Constraints

- No regulatory/compliance constraints apply (same as the parent epic — test-tooling and CI-workflow-only, no production data path).
- The `deploy-group` concurrency fix must not weaken the lock to a per-ref key — that would let two different PRs deploy/E2E-test against the same real `wuce-staging` app concurrently, a regression already explicitly rejected when this was first diagnosed.
- Any NFR-budget widening must stay honest — a threshold loosened far enough to never fail isn't a real NFR anymore; widen only as much as the real contention evidence justifies.
- Team capability: solo-operator posture, same as the parent epic.

## Clarification log

2026-11-01 Clarified via /clarify:
- Q: Does the `deploy-group` CI fix need Fly.io changes beyond the GitHub Actions workflow YAML? A: No — resolved by direct investigation (`concurrency: deploy-group` is set in `.github/workflows/e2e.yml`/`staging-deploy.yml`, a pure GitHub Actions feature). Also confirmed the eviction mechanism is a genuine platform limitation with no native fair-queue option, ruling out a simple reconfiguration fix.
- Q: Is a simple threshold widen expected to be enough for all 3 NFR-budget files, or should per-file complexity be treated as genuinely unknown? A: Treat as genuinely unknown (Option A) — `tfhc-s9` already falsified the "predictable in advance" version of this same judgment once this session. The NFR-budget-sweep story will be sized with room for per-file investigation tasks.

One assumption remains explicitly carried forward as an accepted, named risk rather than resolved: additional fragile wall-clock-budget files beyond the 3 already found may surface during the sweep — this is the story's own open question to resolve during implementation (see Assumptions and Risks), not a precondition blocking `/benefit-metric`.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- [None yet]

## Approved By

Pending

---

**Next step:** Human review and approval → /benefit-metric
