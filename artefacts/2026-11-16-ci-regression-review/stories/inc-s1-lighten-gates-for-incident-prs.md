## Story: Run only the cheap gates on bot-made incident-record pull requests

**Status:** DRAFT for operator review.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md`: 42 of 180 gating-workflow runs on pull requests were on `incident/*` branches, 38% of those failed (16 of 42) against 1.4% on real feature branches; each runs the full 131 s unit chain and the staging end-to-end for a markdown-only record.
**Benefit-metric reference:** None - short-track
**Domain:** [ci]

## User Story

As **the operator**,
I want **incident-record PRs created by the error bridge to run only checks that can say something about a markdown record**,
So that **they stop being red and stop spending runner time and staging capacity**.

## Benefit Linkage

**Metric moved:** None formal. Removes about 23% of PR gating runs and nearly all red PRs; each incident PR currently also queues behind staging deploys.

## Architecture Constraints

- **Required checks must still report.** The ruleset says "3 of 3 required status checks are expected". A path-filtered workflow that does not start never reports, so the PR would be unmergeable. Therefore do not use `paths-ignore` on the required workflows. Keep every job, and make its expensive steps conditional (`if:`) on "this PR changes only incident-record files", so the job reports success in seconds. Which three checks are required is read from the ruleset by the operator or via the API before the story is built.
- **"Only incident-record files"** means every changed path matches the incident record location written by `scripts/lib/error-issue-incident.js` (confirm the path from that script at test-plan time) and the branch name starts with `incident/`. A single path outside it runs the full gates. The check lives in one small reusable script with its own unit test.
- **Safety:** a PR that mixes an incident record with code always runs everything; the branch-name test alone is never sufficient.
- Workflow changes merge through a pull request; the operator merges.

## Acceptance Criteria

**AC1:** Given a PR from `incident/*` whose changes are all incident-record files, When CI runs, Then the unit chain, staging end-to-end, assurance and isolation steps are skipped, every required check reports success, and total run time is under 60 seconds.

**AC2:** Given an `incident/*` PR that also changes any other path, When CI runs, Then every gate runs in full.

**AC3:** Given a normal feature PR, When CI runs, Then behaviour is unchanged.

**AC4:** Given the path-matching script, When tested with incident-only, mixed, empty and renamed-file change lists, Then each classifies correctly and the script never throws.

**AC5 (live):** Given the next real incident PR, When opened, Then it is green in under 60 seconds with all required checks reported. Operator-observed.

## Out of Scope

- Changing what the incident record contains, or the bridge.
- Auto-merging incident PRs.

## Complexity Rating

**Rating:** 2 (required-check semantics). **Scope stability:** Stable.
