# bkn-s1 Definition of Done

Date: 2026-11-17. Story: pushes to master that only change bookkeeping files start no workflow that adds nothing. PR #1136, merged to master on 2026-11-16 at 20:42 UTC (`790795116`). The change is three workflow files, one guard test and the story's artefacts; no application source changed.

## Result: COMPLETE

AC1 to AC5 (Acceptance Criteria 1 to 5) were verified by 5 automated tests (`tests/check-bkn-s1-bookkeeping-push-noise.js`) and CI before merge. AC6 was observed live after merge.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1: Trace Commit's master push trigger has `paths-ignore` for `workspace/**`, `artefacts/**` and `.github/pipeline-state.json` | automated | none |
| AC2 | ✅ | T2: Vulnerability Check runs on `package.json`, `package-lock.json`, its own workflow and script (push and pull request), weekly, and on demand | automated | none |
| AC3 | ✅ | T3: the dreaming workflow has no push trigger; schedule and manual start stay | automated | none |
| AC4 | ✅ | T4: every workflow that triggers on a master push excludes the bookkeeping paths; allow-list is empty | automated | none |
| AC5 | ✅ | T5: every workflow parses; `check-trace-commit`, `check-coha-s3-vulnerability-ci-step`, `check-trw1-trace-writer` still exit 0; PR checks all green | automated | the contract assumed `js-yaml` could parse the workflows; it is not a project dependency (CI failed "Cannot find module"), so the test uses a small hand-written reader of the `on:` block |
| AC6 | ✅ | the merge commit `790795116` started Trace Commit, Vulnerability Check (the story changed that workflow's own file) and Staging Deploy; the story's own bookkeeping push `61a987e4a` (only `.github/pipeline-state.json`) started 0 runs (`gh run list --commit`, checked twice) | production-observed | none |

## Source Issue Closure

No source issue.

## Observations and follow-ups

- Spike PR #1135 (the throwaway Playwright measurement, marked "do not merge") was merged alongside this PR by mistake. It switched on the local Playwright suite for every PR. Reverted in PR #1137.
- Dreaming still fails whenever it runs (Mondays and on demand), because the repository ruleset refuses its push to master. That is `ciw-s1`, waiting on two operator answers (a fine-grained token, and the schedule).
- A merge that touches only the excluded paths is no longer traced by Trace Commit; bookkeeping never had a gate run of its own.
- While preparing this story, my audit commit broke trace validation on master; fixed by registering the folder in `pipeline-state.json` (`e46c804d0`).

## Scope Deviations

None.
