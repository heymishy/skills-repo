# Decisions: quiet weeks for the improvement agent (dqw-s1)

## D1. A pull request only when there are proposals; attention overrides; a missing result fails closed (2026-11-21)

**Context:** the live run of the delivery workflow (ciw-s1, run `44869526822`) opened draft pull request #1179 although the agent found nothing to review. The agent rewrites `workspace/state.json` and `workspace/dream-run-result.json` on every run (timestamps, and 69 experiment-signal details), so the delivery script saw changes every week and the diff was about 3,100 lines.
**Decision (operator, 2026-11-21, "Open a PR only when there are proposals"):** deliver only when a proposal file is staged (added or modified under `workspace/proposals/`) or `dream-run-result.json` has `humanAttentionRequired: true`. Otherwise log "Nothing to review this week", unstage and stop. When there are no proposals, a missing or malformed `dream-run-result.json` fails the run naming the file. A skipped run (interval guard) is a quiet week. A quiet week leaves an open dreaming pull request alone.
**Rationale:** it matches the old behaviour's intent (quiet unless something needs a human, see the "attention notice" step in the workflow); the operator's weekly workload is bounded by real proposals; fail-closed on a missing result keeps "nothing found" distinguishable from "the agent did not run".
**Alternatives rejected:** always open a weekly pull request (about 3,100 changed lines a week for no decision); open one when there are proposals or experiment signals (the signal count is 69 today, so a pull request every week while it stays non-zero).
**Risk accepted:** on a quiet week the agent's `lastDreamRun` and result file are not persisted anywhere (the run log is the record). Nothing downstream reads them on a weekly schedule.
**Operator go-ahead (2026-11-21, the "Quiet weeks" question after the live run):** make this change as the next story.
