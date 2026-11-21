# dqw-s1 Definition of Done

Date: 2026-11-21. Story: a week in which the improvement agent finds nothing to review opens no pull request. Pull request #1180 merged 2026-11-21 (`8ba55c2b7`). No issue.

## Result: COMPLETE. All 7 acceptance criteria met. CI ran on the pull request's final commit (`aa8adf355`, the same commit the merge took; the pull request head, the local head and the CI runs were compared), and the changed files and checks were re-run on master after the merge. The optional real-runner confirmation (M3, one more `workflow_dispatch`) has not been run; the quiet path on the real runner is first exercised by the next scheduled run, **Monday 2026-11-23 03:00 UTC**, or by that optional run if the operator approves it.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-dqw-s1-quiet-weeks.js` Q1 against the real `scripts/improvement-agent-deliver.js` in a temporary git repository with a bare `origin` and a stand-in `gh`: only `state.json` and `dream-run-result.json` changed with `humanAttentionRequired: false` gives status `quiet`, the message "Nothing to review this week", no new branch on the remote, no `pr create`, nothing left staged, and exit 0 through the command line. Red first: Q1 failed on the merged script (it opened a pull request); 9 of 9 pass after (re-run on master: 9 passed, 0 failed). Q9 (a deleted proposal file is not a proposal) was added after a mutation check | automated | Q9 added during delivery (see observations) |
| AC2 | ✅ | Q2: a result with `skipped: true` and no proposals is quiet. Red first | automated | none |
| AC3 | ✅ | Q3 (no `dream-run-result.json`) and Q4 (malformed) each throw naming `dream-run-result.json` and push nothing. Red first | automated | none |
| AC4 | ✅ | Q5: a proposal file staged with `humanAttentionRequired: false` still opens a pull request; Q6: no proposal but `humanAttentionRequired: true` opens one. Both passed before and after the change (they pin behaviour that had to survive) | automated | none |
| AC5 | ✅ | Q7: with an open dreaming pull request and a quiet week the branch head on the remote is unchanged and no further `pr create` is made. Red first (the merged script added a commit) | automated | none |
| AC6 | ✅ | Q8: a staged `README.md` in an otherwise quiet week still fails ("outside the allowed paths"). Passed before and after | automated | none |
| AC7 | ✅ | `check-ciw-s1-improvement-agent-delivery` (8) and `check-bkn-s1-bookkeeping-push-noise` (5) pass unchanged on master | automated | none |

## CI evidence

All 9 checks passed on the final commit `aa8adf355`, including `Lint, typecheck, test, build` (3m28s) and the assurance gate. Both coverage ratchet steps passed ("at or above the floor on all four metrics") against the baseline from cvrt-s1. A local full unit chain (922 files) showed four failing files: the two known local-only ones (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`), `check-rtvap-s1-archived-test-plan-coverage` (fails the same way on the master checkout; WSL has no `/bin/bash` here) and `check-p4-enf-second-line` (only T6, `validate-trace.sh` killed by a timeout during the slow run; run alone it does not fail), the same four as the ciw-s1 full run. None of them run into CI on Linux. Both new checks passed inside the chain.

## Observations and follow-ups

- **The mutation check found a missing test:** six deliberate breaks of the new branches were run against the checks; five were caught at once, but "a deleted proposal counts as a proposal" was not, because nothing pinned the rule "added or modified, not deleted". Q9 was added and the sixth mutation is now caught. The ciw-s1 story had the same lesson with a forced push (a forced fast-forward is indistinguishable by behaviour, so T7 reads the script's push lines).
- **Pull request #1179 and branch `improvement-agent/dream-2026-11-21-0509` remain open:** they are the live run's quiet-week output and the operator's to read and close. The agent does not close them.
- **Not persisted on a quiet week:** the agent's `lastDreamRun` and result file are not recorded anywhere (the run log is the record). Nothing downstream reads them on a weekly schedule.
- **Still unrecorded anywhere:** the 69 experiment signals the agent reports every week are no longer visible to the operator unless there are proposals; whether they should be (and where) is the operator's call, noted in decisions D1 as the rejected "proposals or signals" option.
- **Production promotion superseded again, as predicted:** run `44868306659` (commit `41aa5737f`, which had passed staging smoke and the real-staging confirmation) ended `cancelled` when this pull request merged; run `44873189915` for `8ba55c2b7` replaced it. Nothing was approved by the agent.
- **Still not covered by any test:** the agent's own entry point `src/improvement-agent/index.js` and `experiment-signals.js` (473 statements, 0% in both coverage suites) are exercised only by the workflow; the live run showed the agent works end to end on the real runner.
- **Process held:** the feature was registered on master before the branch was cut (the assurance gate passed first time), the artefacts were corrected on master when the ninth test was added, the remote head was verified after every push, CI was confirmed on the final commit, and master was checked after the merge.

## Scope Deviations

One addition beyond the contract: Q9 (a deleted proposal file is not a proposal), added after the mutation check and recorded in the test plan and DoR.
