## Story: A week in which the improvement agent finds nothing to review opens no pull request

**Epic reference:** None - short-track (follow-up to ciw-s1, found by its live run)
**Discovery reference:** None - short-track skips discovery. Evidence, measured 2026-11-21: the operator-approved live run of the improvement-agent workflow (run `44869526822`, green) opened draft pull request #1179 although the agent found nothing to review: 3933 trace records loaded, 0 failure signals, 0 staleness signals, 0 proposals, `humanAttentionRequired: false`. The agent rewrites `workspace/state.json` (`lastDreamRun`) and `workspace/dream-run-result.json` (`runAt`, and the 69 experiment-signal details it lists) on every run, so the delivery script from ciw-s1 sees changes every Monday and opens a draft pull request whose diff is about 3,100 lines (`dream-run-result.json` +3094 -3, `state.json` +2 -1). The operator decided on 2026-11-21: open a pull request only when there are proposals. A throwaway run of the agent against empty temporary inputs showed the same files changing with no proposals, and that a second run inside the 23-hour interval writes a `skipped: true` result.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, improvement-agent]

## User Story

As **the operator who reviews the improvement agent's pull requests**,
I want **a pull request only in weeks when the agent has proposals for me**,
So that **a quiet week costs me nothing, and a pull request that does arrive means there is something to decide**.

## Benefit Linkage

**Metric moved:** weekly draft pull requests with nothing to review: one every Monday (about 3,100 changed lines each) to none; pull requests that arrive: only those with at least one proposal.
**How:** `scripts/improvement-agent-deliver.js` decides after staging and validating: no proposal files among the staged changes and `dream-run-result.json` not asking for attention means log "Nothing to review this week" and stop, with no branch, no commit and no pull request.

## Architecture Constraints

- Change confined to `scripts/improvement-agent-deliver.js`, one new node check, and artefacts. The workflow file is unchanged.
- **What counts as a proposal:** a staged file under `workspace/proposals/` that is added or modified (not deleted).
- **Attention overrides:** if `workspace/dream-run-result.json` says `humanAttentionRequired: true`, a pull request is opened even when no proposal file is staged (the agent asked for a human).
- **Fail closed:** when there are no proposals, a missing or malformed `workspace/dream-run-result.json` fails the run with a message naming the file (a quiet week must be a real "nothing found", not an agent that did not run). The existing checks (stray staged path, more than 25 files) still run first and still fail closed in a quiet week.
- A skipped run (`skipped: true` from the interval guard) is a quiet week.
- A quiet week with an open dreaming pull request adds nothing to it.
- The staged changes are unstaged on a quiet week so nothing later in the job can commit them. Preserve each file's existing line endings.

## Dependencies

- **Upstream:** ciw-s1 (the delivery script and its 8-test check, which must keep passing unchanged), the operator's decision of 2026-11-21 (quiet weeks).
- **Downstream:** the operator closes pull request #1179 (the live run's quiet-week output) and its branch.

## Acceptance Criteria

**AC1:** Given changes only to `state.json` and `dream-run-result.json` with no proposal files and `humanAttentionRequired: false`, When the script runs, Then it creates no branch, commit or pull request, logs "Nothing to review this week", exits 0 (also through the command line) and leaves nothing staged.
**AC2:** Given `dream-run-result.json` with `skipped: true` and no proposals, When the script runs, Then it is a quiet week (AC1's outcome).
**AC3:** Given no proposals and a missing or malformed `dream-run-result.json`, When the script runs, Then it fails with a message naming that file and pushes nothing.
**AC4:** Given staged proposal files, When the script runs, Then it opens the pull request as before even if `dream-run-result.json` says `humanAttentionRequired: false`; and given no proposal files but `humanAttentionRequired: true`, it also opens one.
**AC5:** Given an open dreaming pull request and a quiet week, When the script runs, Then its branch head is unchanged and no pull request is created.
**AC6:** Given a stray staged path outside the allowed paths in an otherwise quiet week, When the script runs, Then it still fails closed.
**AC7:** Given the existing `check-ciw-s1-improvement-agent-delivery` and `check-bkn-s1-bookkeeping-push-noise`, When they run unchanged, Then they pass.

## Out of Scope

- What the agent counts as a proposal or an experiment signal, and the size of `dream-run-result.json`.
- Persisting `lastDreamRun` on a quiet week (the 23-hour guard only matters for runs closer together than a day; the schedule is weekly).
- Closing pull request #1179 and its branch (the operator reads and closes them).
- Another live run (optional, with the operator's go-ahead).

## Complexity Rating

**Rating:** 1 (one decision added to an already-tested script). **Scope stability:** Stable.
