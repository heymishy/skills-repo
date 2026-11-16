## Story: Make the scheduled Improvement Agent ("dreaming") workflow succeed without pushing to master

**Status:** DRAFT for operator review. The operator has asked for this to be fixed (not disabled).
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md`; run 43807520621 (and 150 others since 2026-11-12): the workflow runs the dreaming cycle, commits, then `git push` to `master`, which the repository ruleset rejects: "Changes must be made through a pull request" and "3 of 3 required status checks are expected". The commit also contains about 3000 files because the traces fetched into `workspace/traces/` end up staged.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, improvement-agent]

## User Story

As **the operator who relies on the improvement agent's proposals**,
I want **the dreaming run to deliver its output as a pull request I can review and merge**,
So that **the agent's work stops being thrown away every run and CI stops being red by default**.

## Benefit Linkage

**Metric moved:** None formal. Restores a feature that has produced no committed output in this window (151 runs, 0 successes) and removes 151 of the 342 always-red runs.
**How:** change the workflow's last step to commit only the intended files to a branch and open a pull request, instead of pushing to master; stop staging the traces checkout; make the trigger sensible.

## Architecture Constraints

- **Output goes through a pull request.** Consistent with the repo ruleset and CLAUDE.md ("state and artefact updates" are normally bookkeeping, but this repo has no path bypass configured): the workflow pushes branch `improvement-agent/dream-<UTC date>` and opens a draft PR with the proposals. No push to master, no ruleset change required.
- **Only the intended files are committed:** `workspace/proposals/`, `workspace/state.json` and `workspace/dream-run-result.json`, exactly as the current `git add` names them. `workspace/traces/` (fetched from the `traces` branch for the run) must not be staged; the fetch should land in an ignored location or be cleaned before `git add`, and a guard fails the step if more than a small number of files are staged.
- **Idempotent and quiet:** if nothing changed ("No changes to commit"), no branch and no PR; at most one open dreaming PR at a time (update the existing branch rather than opening another).
- **Trigger:** currently `schedule` (Mondays 03:00 UTC), `push` to master and `workflow_dispatch`. Open question 1 below. Whatever is chosen, a run must not be triggered by its own PR merge in a loop.
- **Permissions:** the workflow needs `contents: write` and `pull-requests: write` with the default `GITHUB_TOKEN`; note that PRs opened by `GITHUB_TOKEN` do not trigger other workflows, so the PR's required checks will not run automatically (open question 2).
- Workflow changes merge through a pull request (platform change policy); the operator merges.

## Acceptance Criteria

**AC1:** Given a dreaming run with proposals to commit, When it finishes, Then a draft PR exists from `improvement-agent/dream-<date>` containing only files under `workspace/proposals/`, `workspace/state.json` and `workspace/dream-run-result.json`, and the run is green.

**AC2:** Given no change, When the run finishes, Then no branch or PR is created and the run is green.

**AC3:** Given the traces fetched for the run, When files are staged, Then none under `workspace/traces/` are included (verified by a count guard and by the PR's file list).

**AC4:** Given an open dreaming PR, When the next run happens, Then it updates that branch instead of opening a second PR.

**AC5:** Given the new workflow, When it is linted by the repo's workflow checks, Then it passes, and no step pushes to `master`.

**AC6 (live):** Given a manual `workflow_dispatch` after merge, When it completes, Then it is green and a draft PR appears or "No changes" is logged. Operator-approved run.

## Out of Scope

- The content or quality of the proposals the agent produces.
- Changing the ruleset or adding a path bypass.

## Open questions

1. **Trigger:** keep `push` to master, or schedule and manual only? Agent suggests schedule and manual only: 150 of 151 runs were push-triggered and one dreaming cycle per merge is more than a weekly review can use.
2. **Required checks on the bot PR:** `GITHUB_TOKEN` PRs do not start the PR workflows, so the three required checks will show "expected". Options: a fine-grained token or GitHub App secret for the PR, or the operator merges with an admin override for this one bot PR type. Needs an operator decision and a secret.

## Complexity Rating

**Rating:** 2 (workflow permissions and the required-check interaction). **Scope stability:** Unstable until the two questions are answered.
