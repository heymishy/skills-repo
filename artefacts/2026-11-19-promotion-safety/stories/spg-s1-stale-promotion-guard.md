## Story: A production promotion refuses any commit that is not the head of master, and superseded waiting promotions are cancelled

**Epic reference:** None - short-track (CI hardening)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-17-testing-cicd-audit/reference/testing-and-cicd-audit.md` finding 5 (stale promotions are a footgun) and `artefacts/2026-11-19-promotion-safety/reference/ci-health-measurement-2026-11-19.md` (125 Staging Deploy runs still waiting for approval). The `promote-to-prod` job in `.github/workflows/staging-deploy.yml` checks out and builds its own run's commit, so approving an old waiting run deploys that old commit over newer production code.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [deploy]

## User Story

As **the operator who approves production promotions**,
I want **a promotion to fail unless its commit is the current head of master, and older waiting promotions to be cancelled once a newer commit reaches staging**,
So that **approving the wrong run can never put old code over newer production code, and the approval list shows only the run that matters**.

## Benefit Linkage

**Metric moved:** waiting Staging Deploy runs (125 on 2026-11-19, from 131 on 2026-11-17) fall to at most one per commit awaiting approval; promotions of a non-head commit fall from possible to refused.
**How:** a guard step at the start of `promote-to-prod` compares the run's commit with the head of master and fails closed; a job after `deploy-staging` cancels older waiting runs.

## Architecture Constraints

- Change confined to `.github/workflows/staging-deploy.yml`, one new script under `scripts/`, one new test and artefacts. Workflow changes go through a pull request (platform change policy).
- The promote job keeps its `needs:` on `smoke-test` and `post-deploy-e2e-confirm`, its `environment: production`, and has no `if:` added. `tests/check-bri-s2.6-smoke-test-promote-gate.js` (T6) asserts there is no `if: always()` override and must still pass.
- The guard runs before any `flyctl` step and before the production deploy step. It never deploys, never rebuilds at the head, and never approves anything.
- The guard reads the head of master through the GitHub API with the workflow token; the API call is an injectable function whose default throws `Adapter not wired` (D37), and the workflow wiring is verified by a test.
- The cancel job needs `actions: write`, granted on that job only. A failed cancel is logged and does not fail the job. It cancels only runs of this workflow, in the waiting state, created before the current run.
- Production approval stays with the operator.

## Dependencies

- **Upstream:** bri-s2.5 and bri-s2.6 (the staging deploy and promote gate), ptvs-s1 (the production version stamp).
- **Downstream:** ppv-s1 (post-promotion verification) assumes a promotion can only be of the head commit.

## Acceptance Criteria

**AC1:** Given a promote run whose commit differs from the head of master, When the guard runs, Then it exits non-zero and prints both commits.
**AC2:** Given a promote run whose commit equals the head of master, When the guard runs, Then it exits 0.
**AC3:** Given the head of master cannot be read (request error, non-200 answer, or a response with no commit), When the guard runs, Then it exits non-zero (fails closed).
**AC4:** Given `staging-deploy.yml`, When it is read, Then the guard step in `promote-to-prod` comes after checkout and before every `flyctl` step, the job still has `needs: smoke-test` and `post-deploy-e2e-confirm` and `environment: production`, and has no `if:` line.
**AC5:** Given a list of workflow runs, When the cancel script runs for the current run, Then it cancels exactly the Staging Deploy runs that are waiting and were created before the current run, leaves queued, in-progress, newer and other-workflow runs alone, and a failing cancel does not make it exit non-zero.
**AC6:** Given `staging-deploy.yml`, When it is read, Then the cancel job runs after `deploy-staging` succeeds, carries `actions: write` on that job only, and both scripts are called with the real workflow token (the wiring is verified by a test that reads the workflow).

## Out of Scope

- Rebuilding or promoting the staging image instead of rebuilding in the promote job.
- Health checks (fhc-s1) and post-promotion verification (ppv-s1).
- Cancelling runs from other workflows, or deleting any run.
- Making any check required in the repository ruleset.

## NFRs

- **Safety:** fail closed; no path deploys a commit other than the head.
- **Reliability:** deterministic tests with injected API functions; no network in tests.
- **Least privilege:** `actions: write` only on the cancel job.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
