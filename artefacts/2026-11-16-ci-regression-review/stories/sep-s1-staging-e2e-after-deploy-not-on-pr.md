## Story: Run the staging end-to-end scenarios after a staging deploy, not on every pull request

**Status:** DRAFT for operator review. **Depends on `pws-s1` being merged first** (so no per-PR coverage is removed before its replacement exists).
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md`: the job "Scenario A E2E (staging)" in `e2e.yml` runs against real `wuce-staging`, which runs whatever master last deployed, so on a pull request it tests master, not the PR's code; it is the slowest job (median 339 s, so median time to green is 339 s) and it shares the `deploy-group` concurrency lock with staging deploys, so it queues behind them; the `@mocked` smoke suite against staging failed 2 of 13 completed deploys (502).
**Benefit-metric reference:** None - short-track
**Domain:** [ci]

## User Story

As **the operator**,
I want **the staging scenario tests to run when staging changes, and to report against the deploy they actually test**,
So that **pull requests go green in about 3 minutes and a staging problem is reported against the merge that caused it**.

## Benefit Linkage

**Metric moved:** None formal. Halves median PR time to green (about 340 s to about 170 s), removes a source of 502 and queue flakes from the PR gate, and makes the E2E result attributable to a commit.

## Architecture Constraints

- **Required-check hazard (decide first):** if "Scenario A E2E (staging)" (or "Playwright E2E smoke tests") is one of the ruleset's required status checks, removing it from the pull-request trigger leaves a required check that never reports and blocks every merge. The operator must update the ruleset's required checks in the same step (or the job is kept on PRs as a fast no-op that reports success). Read the required list from the ruleset before building.
- **Where it runs instead:** the existing post-deploy path in `staging-deploy.yml` (the post-deploy confirmation job) runs Scenarios A and B after each successful staging deploy, with the mock gateway forced on, serialised by the deploy concurrency group as today. A failure there opens or updates a tracking issue and marks the deploy as failed; it does not touch the PR.
- **Playwright smoke on the PR (`Playwright E2E smoke tests`, 9 s):** stays on pull requests (it runs against the PR's own code in CI).
- **Flake policy:** a failed post-deploy scenario is retried once automatically; a pass on retry is recorded as a flake in the run summary, not hidden.
- Workflow changes merge through a pull request; the operator merges and updates the ruleset.

## Acceptance Criteria

**AC1:** Given a pull request, When CI runs, Then Scenario A and B staging jobs do not run and median time to green is under 200 s.

**AC2:** Given a merge to master and a successful staging deploy, When the post-deploy job runs, Then Scenarios A (A1, A3, A4 blocking) and B run against that deploy with the mock gateway forced on.

**AC3:** Given a post-deploy scenario failure, When it persists after one automatic retry, Then a tracking issue is opened or updated naming the commit; a pass on retry is logged as a flake.

**AC4:** Given the ruleset's required checks, When the change merges, Then no required check is left unreported (verified by a PR opened after the change merging cleanly).

**AC5:** Given `pws-s1` is not merged, When this story is built, Then the story is blocked (a dependency check in the DoR).

## Out of Scope

- Changing what Scenarios A and B test.
- The production promotion approval flow (`spa-s1`).

## Open questions

1. **Which checks are required in the ruleset** (the operator can read Settings, Rules, master ruleset): needed before the test plan.

## Complexity Rating

**Rating:** 2 (ruleset coupling). **Scope stability:** Unstable until the required list is known.
