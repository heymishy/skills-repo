## Story: Cancel superseded "waiting" staging promotion approvals automatically

**Status:** DRAFT for operator review.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md`: of 60 "Staging Deploy" runs, 46 are still "waiting" (production-promotion approval requests that were never approved) and 1 is in progress; the operator has had to cancel old waiting runs by hand.
**Benefit-metric reference:** None - short-track
**Domain:** [ci]

## User Story

As **the operator approving production promotions**,
I want **only the newest promotion request to wait for me**,
So that **I never approve a stale build by mistake and the Actions list stays readable**.

## Benefit Linkage

**Metric moved:** None formal. Removes a safety hazard (approving an old, superseded build) and about 45 stale entries.

## Architecture Constraints

- **Mechanism:** when a newer staging deploy run reaches the approval step for the same environment, runs of the same workflow that are still `waiting` for that environment are cancelled with a comment naming the newer run. The newest waiting run is never cancelled. A run that has already been approved or is `in_progress` is never touched.
- **Implementation choice (test-plan decision):** either a small step in `staging-deploy.yml` using `gh run cancel` for older waiting runs (needs `actions: write`), or a separate scheduled/triggered workflow; the agent leans the first (one place, immediate).
- **Safety:** cancellation must be scoped by workflow name and environment so it can never cancel a CI run on a pull request; it logs the ids it cancelled.
- This workflow change merges through a pull request; the operator merges.

## Acceptance Criteria

**AC1:** Given two staging deploys both waiting for approval, When the second reaches the approval step, Then the first is cancelled and the second still waits.

**AC2:** Given one waiting and one approved-in-progress run, When a new one arrives, Then only the waiting older one is cancelled.

**AC3:** Given pull-request workflow runs, When the cancel step runs, Then none of them is touched.

**AC4:** Given the cancel logic extracted to a small script, When unit tested with fixtures (none waiting, several waiting, mixed statuses, API error), Then each case behaves as above and an API error never fails the deploy.

**AC5 (live):** Given the next two merges, When both deploys reach approval, Then only the newer one waits. Operator-observed.

## Out of Scope

- Auto-approving promotions; changing the approval policy.
- Cancelling the 46 existing waiting runs (the operator can do that once, or the script can be run once with approval).

## Complexity Rating

**Rating:** 1. **Scope stability:** Stable.
