## Story: Disable the Fleet Aggregation workflow and resolve the failing Pages deploy

**Status:** DRAFT for operator review. The operator has asked for Fleet Aggregation to be disabled. The Pages deploy needs a decision.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md`. Fleet Aggregation (82 scheduled runs, hourly, all red): checkout fails with "could not read Username for https://github.com" because the `FLEET_PUSH_TOKEN` secret is missing or empty. Deploy dashboards to GitHub Pages (109 runs on push to master, all red): "Create Pages site failed: Resource not accessible by integration" because GitHub Pages is not enabled for the repository.
**Benefit-metric reference:** None - short-track
**Domain:** [ci]

## User Story

As **the operator reading the Actions tab**,
I want **workflows that cannot succeed to be switched off or fixed**,
So that **a red run means something went wrong today**.

## Benefit Linkage

**Metric moved:** None formal. Removes 191 of the 342 always-red runs in the audit window (82 Fleet, 109 Pages) and about an hour of runner time.

## Architecture Constraints

- **Fleet Aggregation: disable, do not delete.** Remove its `schedule` and `push` triggers, keep `workflow_dispatch`, and add a header comment saying why (missing `FLEET_PUSH_TOKEN`, disabled by operator decision 2026-11-16, how to re-enable). The file and its scripts stay so the feature can come back. Any test that asserts the workflow's triggers (search `tests/` for `fleet-aggregation.yml`) is updated minimally, listed in the evidence.
- **Pages deploy: operator decision (open question 1).** Two valid outcomes, neither done by the agent without approval: (a) the operator enables Pages (Settings, Pages, Source: GitHub Actions) and the workflow then works unchanged; or (b) the workflow is switched to `workflow_dispatch` only with an explanatory comment, as for Fleet. Enabling Pages is a repository setting and publishes the dashboards (read what `dashboards/` and the injected `pipeline-state.json` expose before choosing (a): it is the full pipeline state).
- Workflow changes merge through a pull request; the operator merges.

## Acceptance Criteria

**AC1:** Given the change, When master is pushed or the hour passes, Then Fleet Aggregation does not run; `workflow_dispatch` still starts it manually.

**AC2:** Given the Pages decision (a), When the next push to master happens, Then the Pages deploy is green. Given decision (b), Then it does not run on push.

**AC3:** Given the change, When the workflow-trigger tests run, Then they pass (any asserting old triggers updated, listed).

**AC4:** Given a week after merge, When the Actions history is read, Then neither workflow shows new red scheduled or push runs.

## Out of Scope

- Fixing the fleet token or the fleet feature itself.
- Anything about the Improvement Agent (`ciw-s1`).

## Open questions

1. **Pages:** enable it (publishes the dashboards, including pipeline state) or disable the workflow? Agent suggests disabling unless you actively use the Pages dashboards; if repo or org policy makes Pages public, enabling it would expose pipeline state.

## Complexity Rating

**Rating:** 1. **Scope stability:** Stable once the Pages decision is made.
