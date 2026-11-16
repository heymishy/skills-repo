## Story: A short-track fix for a GitHub issue closes that issue as a matter of course

**Status:** DRAFT for operator review (design question at the end).
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: 2026-11-16, issue #1121 (opened by the production error chain) stayed open after its fix, PR #1127, merged, because the PR body had no closing keyword (`closingIssuesReferences` was empty; GitHub only cross-referenced it). The operator found it by looking. The agreed process (recorded in `artefacts/2026-11-16-ci-regression-review/decisions.md`, the inc-s2 CORRECTION entry) is: an error issue is resolved as a short-track story whose PR says `Fixes #<issue>`; nothing in the framework makes that happen.
**Benefit-metric reference:** None - short-track
**Domain:** [pipeline, skills]

## User Story

As **the operator**,
I want **a story that fixes a GitHub issue to carry that issue through the pipeline and close it when its PR merges**,
So that **no resolved issue is left open, and I never have to notice and close it by hand**.

## Benefit Linkage

**Metric moved:** None formal. Removes a manual, easily forgotten step; keeps the issue list a true picture of what is still broken.

## Proposed design (three small pieces, nothing outward-facing is automated without the operator)

1. **Carry it.** A story may name its `Source issue: #N`. The short-track story template, the test plan and the DoR carry the line; `pipeline-state.json` records `sourceIssue` on the story (schema field, set with `bin/skills advance`).
2. **Close it with the PR.** `/branch-complete` (Option 2, the draft PR step) must put `Fixes #N` in the PR body when the story has a source issue, and verify it with `gh pr view --json closingIssuesReferences` (the issue appears in the list) before reporting the PR URL. GitHub then closes the issue on merge to the default branch.
3. **Check it at DoD.** `/definition-of-done` Step 1 (confirm the story and PR) checks the source issue: if it is closed, record it in the DoD; if it is still open after the PR merged, the DoD shows a deviation row, and the skill asks the operator whether to close it (with a comment naming the PR and the evidence). A small script `scripts/check-source-issue-closure.js` does the lookup (skipped with a clear message when `gh` is unavailable) and is what the skill runs.

## Architecture Constraints

- Skills and scripts change by pull request (platform change policy); ADR-011 (artefact-first) satisfied by this chain.
- No automatic closing of issues by the agent: closing stays a GitHub keyword on a merge the operator performs, or an explicit operator-confirmed action at DoD.
- Zero new npm dependencies; the script uses the existing `gh` CLI only.

## Acceptance Criteria

**AC1:** Given a story with `Source issue: #N`, When `/branch-complete` opens the draft PR, Then the PR body contains `Fixes #N` and `closingIssuesReferences` lists N, otherwise the skill stops and says so.

**AC2:** Given a merged story with a source issue that is still open, When `/definition-of-done` runs, Then the DoD records a deviation and offers the operator the closing action; given the issue is closed, the DoD records that.

**AC3:** Given `pipeline-state.json`, When a story has `sourceIssue`, Then the schema accepts it and `bin/skills advance <slug> <id> sourceIssue=N` writes it.

**AC4:** Given `scripts/check-source-issue-closure.js`, When run over the state, Then it lists merged stories whose source issue is still open, and exits 0 with a skip message when `gh` is not available.

**AC5 (evidence):** Given the next real production-error issue, When its fix PR merges, Then the issue closes with the merge and the DoD shows no deviation.

## Out of Scope

- Opening issues, changing the error bridge, closing issues for stories without a source issue, or any automatic closing at DoD without operator confirmation.

## Open design question for the operator

Should an open source issue at DoD be a **hard stop** (the DoD gate fails until it is closed or an exception is recorded) or a **recorded deviation with an offer to close** (my recommendation: a deviation, because a hard gate would block DoD on a network lookup)?

## Complexity Rating

**Rating:** 2 - two skill edits, one small script, one schema field, one template line. **Scope stability:** Stable once the question is answered.
