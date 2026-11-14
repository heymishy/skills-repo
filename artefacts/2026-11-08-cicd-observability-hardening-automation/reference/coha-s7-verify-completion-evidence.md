# coha-s7 verify-completion evidence (2026-11-15)

**Story:** Incident record pull request opened for each bridge-opened production error GitHub issue (artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md)
**Branch:** `feature/coha-s7-incident-record-from-production-error-issue`, verified at commit `03ee9ed7c` (12 commits on top of the DoR and branch-setup commits; five files changed: the logic module, the command-line script, the workflow file, the test file and the runner's exclusive list; nothing under `src/`)
**Run on:** Windows 11, Node 22, PowerShell 7, Git Bash first on PATH. No Docker or database is needed by this story (Docker was closed for the final runs).

## Test evidence (fresh, run in this session on the final code)

| Command | Result |
|---|---|
| `node tests/check-coha-s7-error-issue-incident.js` | 44 passed, 0 failed (about 14 s). Real git in temporary repositories; the real product page handler, record store and triage drafter; real child processes. |
| `npm test` (full suite), three runs on the final code | 853 files each. Run 1: 3 failed, run 2: 3 failed, run 3 (with the exclusive entry removed, as an A/B): 3 failed. The failing files were the same each time: `scripts/check-pipeline-state-integrity.js` (tfhc-s1 record, accepted bug 1042), `tests/check-pcr-s1-test-runner.js` (timing limit set on another machine) and `tests/check-cat-s1-core-trace-builder.js` (a hard 50 ms assertion: 51.6, 68.3 and 65.4 ms; about 27 ms alone). An earlier full run on the same code before the runner edit had only the first two failing. The cat-s1 failure is acknowledged as environmental in `decisions.md` (2026-11-15), with the A/B evidence that coha-s7's runner change is not the cause. coha-s7's own file passed 44 of 44 in every run. |

## Acceptance criteria

| AC | Evidence | Result |
|---|---|---|
| AC1 one pull request, one added record, right fields | U1 to U5, I1, I6; plan, build and the pull request text through the real script | Verified |
| AC2 no second branch or pull request | U14, U14b, U15, I6; fork pull requests ignored | Verified |
| AC3 other author declined; unset variable recognises nothing | U6 to U8, W10 | Verified |
| AC4 missing label or marker declined; opened only | U9 to U11, W1 | Verified |
| AC5 record accepted by validation and the product page | I1, I2 (real page handler, text escaped), I3 | Verified (integration-real-code) |
| AC6 hostile text inert; bad id creates no branch; code in inline code | U12, U13, U18 (real child process, sentinel file), W4 | Verified |
| AC7 simultaneous issues independent; conflicted record rebuilt | I4 (real git: the second merge conflicts, rebuild with force-with-lease merges cleanly), I5, U14b, W3, W9 | Verified (integration-real-code) |
| AC8 dry run prints and creates nothing | U16, U17, W6 | Automated parts verified; the live dry run is scenario 8 after merge: Not yet verified |
| AC9 live real run: one branch, one pull request, repeat creates nothing, cleaned up | W2, W5, W9, W13 and I6 structurally; the live real run is scenario 9 after merge, with the operator's approval immediately before | Not yet verified |

7 of 9 acceptance criteria verified; AC8 and AC9 are live-only after merge by the DoR's own classification.

## Other checks

- Route and handler end-to-end coverage: not applicable, no file under `src/web-ui/routes/` or any middleware was changed.
- Live browser render check: not applicable, no rendered UI output touched.
- Scope: all commits map to a plan task or a review fix; additions beyond the plan text are logged in `decisions.md` ("coha-s7 verify-completion: additions beyond the plan text").

## Residual risks carried forward

1. AC8 and AC9 live runs, plus the operator prerequisites in `workspace/state.json` (create the `ERROR_BRIDGE_AUTHOR` workflow variable with your exact login; open the test issue WITHOUT the label and add it afterwards; approve each run).
2. The recognise job's `gh pr list` with `pull-requests: read` and the real GitHub payload shapes are verified only by the AC8 live dry run.
3. Whether GitHub offers the required checks on the workflow-made pull request for approval (recorded at AC9).
4. The triage drafter links every new record to every earlier one (shared tag, score 0.33 against a 0.3 threshold): logged, to matter when the threshold is calibrated.
5. The `cat-s1` timing failure above, to be settled by the pull request's CI.
