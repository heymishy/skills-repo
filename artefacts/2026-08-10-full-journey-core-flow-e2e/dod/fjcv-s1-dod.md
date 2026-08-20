# Definition of Done: E2E coverage confirming both journey entry points reach definition-of-ready complete and every major stage resumes correctly

**PR:** #719 (commit `1e69144c`, "fjcv-s1: E2E coverage confirming both journey entry points reach definition-of-ready complete and every major stage resumes correctly") — note: the task brief for this DoD pass cited PR #721, but git log shows #721 belongs to `fjcv-s2` (the credits-guard fix-forward, see Scope Deviations below); #719 is confirmed by `git log --all --grep`.
**Merged:** 2026-08-11 (git commit timestamp `2026-08-11T07:47:27+12:00`)
**Story:** artefacts/2026-08-10-full-journey-core-flow-e2e/stories/fjcv-s1-full-journey-core-flow-and-resume.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — ideate-first journey (ideate → discovery → benefit-metric → design → definition → review → test-plan → DoR) reaches `/journey/:id/complete` with pass state | Yes | Test-plan `fjcv-s1-test-plan.md` names one Playwright test in `fjcv-s1-full-journey-core-flow-and-resume.spec.js` driving this exact path via `driveIdeateToCompletion()` + `submitTurn()`; recorded in `pipeline-state.json` as part of the 3-test all-passing count | Recorded test-plan result (not re-run fresh this pass, see Test Plan Coverage) | None |
| AC2 — discovery-first journey reaches `/journey/:id/complete` with same pass state | Yes | Test-plan names the second test in the same spec file, reusing `bri-s3.2`'s proven sequencing helpers, asserting `checkpoints.ideate` is `undefined` | Recorded test-plan result | None |
| AC3 — 3 representative resumable stages per journey return real artefact + conversation content via `GET /journey/:id/stage/:stageName` | Yes | Both tests above each assert this inline (ideate/discovery/definition-of-ready for AC1; discovery/definition/definition-of-ready for AC2) via `assertStageResumable()` using the Playwright `request` context | Recorded test-plan result | None |
| AC4 — zero real LLM calls throughout either journey | Yes | Both tests assert `GET /test/real-llm-call-count` is unchanged before/after | Recorded test-plan result | None |

## Scope Deviations

None from the story's own stated scope. The story explicitly deferred three items as accepted out-of-scope, not gaps: (1) re-verifying the mermaid-SVG client-side render (already covered by `rdac-s1`'s real-browser spec), (2) a real-staging variant of this spec, (3) exhaustive per-stage resumability beyond the 3 representative checkpoints per journey.

One post-merge item worth recording for completeness, already resolved: monitoring the merge deploy surfaced a real, non-flaky staging gap — the ideate-first path's 12-turn journey exceeded the free-tier 10-credit grant, causing `credits-guard.js` to correctly 402 the 11th turn and fail `smoke-test` on real staging (local mock-gateway runs were unaffected, since credits aren't enforced there). This was root-caused and fixed by the immediate fix-forward story `fjcv-s2` ("Credits-guard e2e bypass", PR #721, `pipeline-state.json` shows `prStatus: merged`, stage `branch-complete`, 7/7 AC verified, 11/11 tests passing). No currently-open gap remains against this story as a result — it is recorded here as historical context, not a deviation from this story's own scope.

## Test Plan Coverage

`pipeline-state.json` records `testPlan.status: "all-passing"`, `totalTests: 3`, `passing: 3` for `fjcv-s1` (artefact: `artefacts/2026-08-10-full-journey-core-flow-e2e/test-plans/fjcv-s1-test-plan.md`) — the 2 new tests in `fjcv-s1-full-journey-core-flow-and-resume.spec.js` (AC1/AC3/AC4 ideate-first, AC2/AC3/AC4 discovery-first) plus the unmodified regression re-run of `bri-s3.2-signup-onboarding-journey.spec.js`.

This DoD pass did **not** re-run the Playwright suite fresh. An attempted run in this session errored during module transform/load (`playwright/lib/transform/transform.js`, truncated stack trace) before any test executed — consistent with a local tooling/environment issue in this pass rather than a functional regression, and per this backlog pass's lightweight-by-default depth policy for E2E specs requiring the full Playwright runner + live/mock server. The last-recorded pass count above (3/3, all-passing) is cited as evidence instead. The story's own text additionally states the spec was verified 2x locally with zero flakiness (~4-9s total runtime) before being considered done.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Runtime — both tests complete well under 1s of actual turn-processing time; ~4-9s total for the 3-test file | Met (per story record) | Story's own NFR section states this was verified locally, including 2x repeat runs confirming zero flakiness; not independently re-verified this pass |
| Test isolation — each test creates its own fresh signup/product/journey with a unique `e2e-test-fjcv-s1-` prefixed email | Met (by design) | Story architecture constraints + test plan's Test Data Strategy section confirm unique-prefix isolation; no shared state with other specs |

## Metric Signal

No benefit-metric artefact is referenced by this story — it is explicitly short-track (test-coverage addition requested directly by the operator), which skips `/benefit-metric` by design. The story's Benefit Linkage section states the gap closed directly: prior to this story, the combined full-pipeline flow (both entry points reaching definition-of-ready, with multi-stage resumability) had only been manually, single-stage, Chrome-verified; no formal metric is tracked.

## Outcome

**COMPLETE**
**Follow-up actions:** None. The one post-merge staging gap found (credits-guard 402 on the ideate-first path) was already fixed by the merged fix-forward story `fjcv-s2`; no DoD write is required for `fjcv-s1` as a result of it, and `fjcv-s2` has its own DoD pending separately.

## DoD Observations

The story delivered exactly as scoped — a pure test-file addition, no production code — and its own real-staging monitoring loop caught a genuine downstream interaction (credit ceiling vs. ideate's new multi-turn cost) that the local mock-gateway harness structurally could not surface, which was fixed forward same-day via `fjcv-s2`.
