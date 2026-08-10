## Story: Fix the post-deploy CI race between smoke-test and post-deploy-e2e-confirm

**Epic reference:** None — short-track (CI infrastructure fix, found via investigating 3 flaky staging-deploy failures in one day)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator relying on staging-deploy.yml's post-deploy checks to catch real regressions**,
I want **smoke-test and post-deploy-e2e-confirm to run sequentially instead of racing each other**,
So that **a red post-deploy check means something actually broke, not that two Playwright suites happened to hit the same cold-started app at once**.

## Benefit Linkage

**Metric moved:** Direct CI-reliability gap (short-track, no formal benefit-metric artefact) — found while investigating 3 different, unrelated staging-deploy E2E failures across 3 separate deploys in one day (an auth-stub 5s timing check, a 60s product-creation form-interactive wait, a journey-turn endpoint returning HTML instead of JSON). Confirmed via `gh run view --json jobs` timestamps across all 3 runs: `smoke-test` and `post-deploy-e2e-confirm` both declare `needs: deploy-staging` with no dependency on each other, so GitHub Actions starts them within 0-1 seconds of each other every time, right after a fresh Fly.io restart. Both suites hit the same staging app and the same Postgres DB (via their own concurrent `purge-e2e-tenants.js` calls) simultaneously, at the coldest possible moment.

**How:** Sequence `post-deploy-e2e-confirm` after `smoke-test` via `needs: [deploy-staging, smoke-test]` plus `if: always() && needs.deploy-staging.result == 'success'` (so it still always attempts to run after a successful deploy, regardless of smoke-test's own pass/fail — only the timing changes, not the "always confirm" behaviour `pmec-s1` originally built).

## Architecture Constraints

- **`promote-to-prod`'s own gating is untouched** — still `needs: smoke-test` only, per `bri-s2.6`'s existing NFR2/T5/T6 guarantees (human-approval-gated, smoke-test remains the sole release gate).
- **`post-deploy-e2e-confirm` remains structurally non-blocking** — no job depends on it (matches `pmec-s1`'s U4 guarantee, re-verified unchanged).
- **The `if:` condition must preserve "always attempts after a successful deploy"** — a plain `needs: [deploy-staging, smoke-test]` with no `if:` override would silently SKIP this job whenever `smoke-test` fails, which is a behaviour regression from today's "only needs deploy-staging" default; `if: always() && needs.deploy-staging.result == 'success'` prevents that.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given `staging-deploy.yml`, When `post-deploy-e2e-confirm`'s `needs:` is inspected, Then it includes both `deploy-staging` and `smoke-test`.

**AC2:** Given `staging-deploy.yml`, When `post-deploy-e2e-confirm`'s job-level `if:` is inspected, Then it evaluates to true whenever `deploy-staging` succeeded, regardless of `smoke-test`'s outcome.

**AC3:** Given `promote-to-prod`, When its `needs:` is inspected, Then it is unchanged (`smoke-test` only).

**AC4:** Given the existing `check-bri-s2.5-ci-pipeline-staging-deploy.js`, `check-bri-s2.6-smoke-test-promote-gate.js`, and `check-pmec-s1-post-merge-e2e-confirmation.js` test files, When run after this story's workflow change, Then all pass — `check-pmec-s1-post-merge-e2e-confirmation.js`'s U1 updated only to accept the array `needs:` form (still requiring `deploy-staging` be present), no other assertion-logic change.

## Out of Scope

- **Fixing the 3 already-observed flaky test failures themselves** (auth-stub timing, product-creation timeout, journey-turn HTML-instead-of-JSON) — these were symptoms of the concurrent-load race, not independent bugs; if any recur after this sequencing fix, they'd warrant separate investigation.
- **Adding a warm-up/health-check step before either suite starts** — the sequencing fix alone (one suite fully finishes before the other starts) already removes the concurrent-load condition; a warm-up step would be a further, separate resilience improvement if flakiness recurs even sequenced.
- **`e2e.yml`'s own Scenario A/B jobs** (the pre-merge PR-gate versions) — those already run sequentially relative to each other by design; this story is `staging-deploy.yml`-scoped only.

## NFRs

- **CI duration:** This story intentionally increases `staging-deploy.yml`'s total wall-clock time (post-deploy-e2e-confirm now waits for smoke-test to finish first) in exchange for removing false-red flakiness. Both jobs already have independent `timeout-minutes: 10` caps, so worst-case total added latency is bounded.

## Complexity Rating

**Rating:** 1 — well-understood, workflow-YAML-only change plus one existing test's regex loosened to accept the new (still-correct) shape.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
