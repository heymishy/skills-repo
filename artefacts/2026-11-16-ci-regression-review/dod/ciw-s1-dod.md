# ciw-s1 Definition of Done

Date: 2026-11-21. Story: make the scheduled improvement agent ("dreaming") workflow succeed without pushing to master. Pull request #1178 merged 2026-11-21 (`41aa5737f`). No issue.

## Result: MERGED AND VERIFIED, with one acceptance criterion open. AC1 to AC5 are met. AC6 (the live manual run) is **not yet done**: it needs the operator's go-ahead, and until it passes the story is not proven in production. CI ran on the pull request's final commit (`abc0ef280`, the same commit the merge took; the pull request head was checked against it) and the changed files were checked on master after the merge. This DoD is to be updated, and the story moved to `definition-of-done`, when AC6 is recorded. **The next scheduled run is Monday 2026-11-23 03:00 UTC.**

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-ciw-s1-improvement-agent-delivery.js` T1 against the real `scripts/improvement-agent-deliver.js` in a temporary git repository with a bare `origin` and a stand-in `gh`: branch `improvement-agent/dream-2026-11-23-0317`, exactly one commit, changing only `workspace/dream-run-result.json`, `workspace/proposals/proposal-one.md` and `workspace/state.json`; `pr create --draft --base master --head <branch>`; `master` on the remote unchanged. Red first: 0 of 8 passed on master; 8 of 8 after (re-run on master: 8 passed, 0 failed) | automated | none |
| AC2 | ✅ | T2: no changes gives no new branch and no `pr create`, "No changes to commit", exit 0, also through the command line | automated | none |
| AC3 | ✅ | T3: 40 staged trace files are unstaged and never committed; T4: a staged `README.md` stops the run ("outside the allowed paths") and nothing is pushed; T5: 26 files stops the run ("more than 25"). Mutation checks: removing the traces unstage (T3) and removing the allowed-path guard (T4) each turned the matching test red | automated | none |
| AC4 | ✅ | T6: with an open dreaming pull request the next run (a fresh checkout a week later) adds one commit to the same branch, the earlier head is an ancestor of the new head (exit code of `git merge-base --is-ancestor`), both proposals and the newest `state.json` are on the branch, `pr create` was called once in total, and there is still one dreaming branch. T7 reads the script's `git push` calls and rejects any force flag (a forced fast-forward is indistinguishable by behaviour; the first version of the check missed that mutation) | automated | none |
| AC5 | ✅ | T8 reads the workflow with comments stripped (it is CRLF): the delivery step calls `node scripts/improvement-agent-deliver.js` with `GH_TOKEN`, there is no `git push` in the workflow, no push to master, `contents: write` and `pull-requests: write`, `schedule` and `workflow_dispatch` kept and no `push:` trigger; putting `&& git push` back turned T8 red. `check-bkn-s1-bookkeeping-push-noise` (5) still passes. The workflow parses as YAML with the six expected steps | automated | none |
| AC6 | ⏳ not done | the live acceptance test: one manual `workflow_dispatch` after merge, expected green with either a draft pull request from `improvement-agent/dream-<date>-<time>` or "No changes to commit". Not started: it writes to the repository's pull requests, so it waits for the operator's go-ahead | manual (operator-approved) | open |

## CI evidence

All 9 checks passed on the final commit `abc0ef280`, including `Lint, typecheck, test, build` (4m10s; the earlier run took 3m43s; limit 5.5) and the assurance gate. The coverage ratchet's first real comparison ran on this pull request: unit and browser suites both "at or above the floor on all four metrics", against the baseline recorded by cvrt-s1. A local full unit chain (921 files) showed four failing files: the two known local-only ones (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`), `check-rtvap-s1-archived-test-plan-coverage` (fails the same way on the master checkout; WSL has no `/bin/bash` here) and `check-p4-enf-second-line` (only its T6, `validate-trace.sh` killed by a timeout during a slow run; passes alone on master and on the branch). None of them run into CI on Linux.

## Observations and follow-ups

- **What is and is not proven:** everything about what the script stages, commits, pushes and tells `gh` is proven against a real git repository. What is not proven until AC6: the real `gh pr create` with the default workflow token, the repository setting that lets Actions create pull requests (reads as enabled), and `git checkout origin/traces -- workspace/traces/` followed by the unstage on a real runner. If AC6 fails, the run is red with a clear message and nothing is pushed to master.
- **The bot's pull request will not run the required checks** (default-token events do not start workflows); the operator merges it with the admin bypass (decisions D1). Its content is limited to three workspace paths by the fail-closed guard.
- **Production promotion superseded by this merge, as predicted:** run `44853341112` (waiting at manual approval) ended `cancelled` when this pull request merged; run `44868306659` for `41aa5737f` replaced it. Nothing was approved by the agent.
- **Still not covered by any test:** `src/improvement-agent/index.js` and `experiment-signals.js` (473 statements, 0% in both coverage suites) are only run by this workflow. A follow-up story should test `runAllDimensions` with injected paths so a failure in the agent itself is caught before a Monday run, not by it.
- **Process held:** the story was updated with the open questions answered before work started, the operator's decision recorded (decisions D1), the remote head was verified after every push, CI was confirmed on the final commit, and master was checked after the merge.

## Scope Deviations

None.
