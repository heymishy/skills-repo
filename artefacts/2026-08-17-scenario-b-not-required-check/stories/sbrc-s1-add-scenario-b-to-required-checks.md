## Story: Add "Scenario B E2E (staging)" to master's required status checks

**Epic reference:** None — short-track config fix
**Discovery reference:** None — short-track (gap found during DoD backlog review, `2026-07-23-e2e-core-journey-coverage`, story `b2-ci-gate-scenario-b-coverage-mapping`)
**Benefit-metric reference:** None — short-track
**Domain:** []

## User Story

As a **repo maintainer relying on CI gates to catch regressions**,
I want to **have a PR that breaks a Scenario B-covered journey step (formed-idea outer loop, story-map canvas) actually blocked from merging**,
So that **`b2`'s own AC1 guarantee ("the PR's merge is blocked") is real, not just a passing job that nobody is required to look at**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track config fix, no benefit-metric artefact) — directly restores `b2`'s own AC1 guarantee, which the current GitHub ruleset does not enforce.
**How:** Adding `"Scenario B E2E (staging)"` to the master branch ruleset's `required_status_checks` list makes GitHub itself block the merge button when that job fails — closing the gap between "the job runs" (already true) and "the job blocks merge" (currently false).

## Architecture Constraints

- This is a GitHub repository configuration change (branch protection ruleset `14979696`), not a code change — no source files are touched.
- Follow the exact pattern already in place for `"Scenario A E2E (staging)"`, which `a5`'s own story already correctly wired into this same ruleset — add a second `{"context": "Scenario B E2E (staging)"}` entry to the `required_status_checks.required_status_checks` array via `gh api --method PUT repos/heymishy/skills-repo/rulesets/14979696` (or the ruleset PATCH equivalent), do not create a new ruleset or modify any other rule in it.
- `check-a5-ci-gate-config.js` and `check-b2-ci-gate-config.js` already contain the exact live-ruleset assertions this fix needs to satisfy — reuse them, do not write new test files.

## Dependencies

- **Upstream:** None
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the master branch ruleset (`14979696`), When inspected via `gh api repos/heymishy/skills-repo/rulesets/14979696`, Then `required_status_checks.required_status_checks` includes an entry with `"context": "Scenario B E2E (staging)"`, alongside the existing `"Run assurance gate"` and `"Scenario A E2E (staging)"` entries — none removed.

**AC2:** Given the existing `check-b2-ci-gate-config.js` test file's T12 assertion (currently `SKIPPED` because it treats this as inconclusive live-state, not a hard failure), When re-run after this fix, Then T12 passes (finds `"Scenario B E2E (staging)"` in the required checks list) instead of skipping.

**AC3:** Given a hypothetical PR that fails the "Scenario B E2E (staging)" job, When that PR attempts to merge via GitHub's UI or API, Then the merge is blocked by the ruleset — verified by inspecting the ruleset configuration's enforcement (not by actually breaking and testing a real PR, which would be unnecessarily disruptive).

## Out of Scope

- Any change to Scenario A's required-check status (already correctly configured by `a5`) — untouched.
- Any change to the Scenario B E2E job itself (`b1`'s spec file, the workflow YAML defining the job) — this story only changes which checks GitHub treats as merge-blocking, not what the checks themselves do.
- Auditing whether any OTHER CI job across this repo should also be required but isn't — this story fixes the one specific, confirmed instance (`b2`'s own stated AC1 guarantee), not a broader audit.

## NFRs

- **Performance:** None identified.
- **Security:** None identified — if anything, this closes a gap where a real regression could merge unblocked.
- **Accessibility:** Not applicable.
- **Audit:** None new — this is a one-time, auditable ruleset change (`gh api` calls are themselves logged in GitHub's audit log).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
