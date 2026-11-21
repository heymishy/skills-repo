## Test Plan: Make the scheduled Improvement Agent ("dreaming") workflow succeed without pushing to master

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/ciw-s1-fix-improvement-agent-dreaming.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-ciw-s1-improvement-agent-delivery.js`, in the chain automatically. T1 to T7 drive the real `scripts/improvement-agent-deliver.js` in a temporary git repository with a bare repository as `origin` and a stand-in for the `gh` command line tool (a small script that records its arguments and answers `pr list` from a file); no network, no real pull request. The workflow itself only runs on CI; its text is checked (T8) and the live run is a manual step (M3).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | Branch from the base, one commit of only the allowed paths, draft pull request opened against master | - | 2 (T1: branch name, commit contents, `gh pr create --draft --base master --head <branch>`; T7: master on the remote is unchanged in every scenario) | - | - | 🟢 |
| AC2 | No changes: no branch, no pull request, exit 0 | - | 1 (T2) | - | - | 🟢 |
| AC3 | Traces unstaged; a stray staged path or more than 25 files fails closed, nothing pushed | - | 3 (T3: traces staged then not committed; T4: a path outside the three; T5: 26 files) | - | - | 🟢 |
| AC4 | An open dreaming pull request: one commit added to its branch by fast-forward, no second pull request, no force | - | 1 (T6: the earlier commit is an ancestor of the updated branch; `pr create` not called) | - | - | 🟢 |
| AC5 | Workflow calls the script last, no push to master, permissions, triggers; `bkn-s1` check still passes | 1 (T8: workflow text) | - | - | M1: run `check-bkn-s1` and the full chain | 🟢 |
| AC6 | Live manual run is green and opens a draft pull request or logs "No changes to commit" | - | - | - | M3: operator-approved `workflow_dispatch` after merge | 🟡 |
| AC7 (merge hygiene) | Changed files as stated, on the pull request and on master | - | - | - | M2: diff check | 🟢 |

## Red first

T1 to T8 fail on master because `scripts/improvement-agent-deliver.js` does not exist and the workflow still ends in `git push`. Measured before any implementation.

## Manual steps

- **M1:** run `tests/check-bkn-s1-bookkeeping-push-noise.js` and the full `npm test` plus `scripts/ci-test-regression-check.js`: only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`).
- **M2:** list changed files on the pull request and on master after the merge.
- **M3 (operator-approved live run):** after the merge, start the workflow with `workflow_dispatch` once. Expect green and either a draft pull request from `improvement-agent/dream-<date>-<time>` or "No changes to commit". The next scheduled run is Monday 2026-11-23 03:00 UTC, so the manual run is best done before then. The agent does not start it without the operator's go-ahead.
- **M4:** confirm a CI run exists on the final commit before the merge is requested.

## Gaps

The delivery script is tested against a local bare repository and a stand-in `gh`; the real `gh pr create` behaviour with the default token (and the "Allow GitHub Actions to create and approve pull requests" setting, which is already on) is only confirmed by the live run (M3). A pull request opened with the default token does not start the pull request checks; that is the accepted trade-off recorded in decisions D1.
