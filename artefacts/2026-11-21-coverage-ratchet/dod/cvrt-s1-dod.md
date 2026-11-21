# cvrt-s1 Definition of Done

Date: 2026-11-21. Story: server code coverage is measured for the unit chain as well as the browser suite, and a pull request cannot lower either number. Pull request #1177 merged 2026-11-21 (`b32c0b92c`). No issue.

## Result: COMPLETE. All 7 acceptance criteria met, with one recorded deviation. CI ran on the pull request's final commit (`d7f19cb7f`, the same commit the merge took; the pull request head was checked against it), and the changed files were checked on master after the merge. **The first enforced comparison is on the first pull request after this one**: the ratchet reads its baseline from the base branch, and master had none until this merge, so on #1177 itself both steps passed with a "no baseline yet" notice.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-cvrt-s1-coverage-ratchet.js` T1 to T4 against the real `scripts/coverage-ratchet.js`: equal passes, a 0.4 point drop passes, one metric more than 0.5 below fails naming metric, baseline and measured value, all four below fail with each named. Red first: 0 of 10 passed on master (no script, no workflow steps); 10 of 10 pass after (re-run on master: 10 passed, 0 failed). A dry run against the real CI summaries passed at the recorded numbers and failed a simulated 1.2 point drop with `baseline 87.72%, measured 86.52% (floor 87.22%)` | automated | none |
| AC2 | ✅ | T5 to T8: no baseline file or an absent path passes with a notice; a malformed baseline fails closed naming the file; a baseline with no entry for the suite fails closed; a missing summary or a non-numeric percentage fails closed. On master the baseline file now exists, so the next pull request is judged against it | automated | none |
| AC3 | ✅ with deviation | T9 reads `pr-checks.yml`: the unit chain runs under pinned `c8@10.1.3` with `--include="src/**"` and `json-summary`, `test-output.log` and the `ci-test-regression-check.js` arguments are unchanged, the ratchet step is present and the summary is uploaded. In CI (run `44851930900`): the unit chain ran under c8, the `unit-coverage-<run>` artefact exists, and the regression check judged it as before. A full local run of all 890 test files under c8 showed only the two known local-only failures, identical to a run without c8 | automated + CI read | `--all` was added to the c8 command (not in the story text): without it c8 counts only files a test loads, so a new file with no tests would not lower the number. Local numbers: 89.82% statements without `--all`, 87.17% with it (18 source files at 0% under the unit chain alone). T9 asserts it; decisions D4 records it |
| AC4 | ✅ | T10: the ratchet step follows the c8 report step in `e2e.yml` and the job still has exactly one `continue-on-error`; `check-a5-ci-gate-config` (14) and `check-b2-ci-gate-config` (16) pass. In CI (run `44851930867`) the `e2e` ratchet step ran and passed | automated + CI read | none |
| AC5 | ✅ | both summaries exist as CI artefacts; the baselines were written to `tests/coverage-baseline.json` from them (second commit): unit 87.72 / 78.63 / 90.55 / 87.72 and e2e 66.42 / 59.76 / 44.96 / 66.42 (statements / branches / functions / lines). The two CI runs on the two pull request commits measured identical numbers. PR Checks took 3m49s and 3m43s (limit 5.5; median before 3.5) | CI read | none |
| AC6 | ✅ | the full unit chain under c8 gave only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`), which also fail on the master checkout and are not shown by CI; `check-a5`, `check-b2` and the regression check pass | automated | none |
| AC7 | ✅ | the merge commit changed 5 files: `.github/workflows/e2e.yml`, `.github/workflows/pr-checks.yml`, `scripts/coverage-ratchet.js`, `tests/check-cvrt-s1-coverage-ratchet.js` and `tests/coverage-baseline.json` (278 insertions, 1 deletion); nothing under `src/` | manual (diff check on master) | none |

## CI evidence

All 9 checks passed on both pull request commits (`7997de0b6` and `d7f19cb7f`). Measured coverage on CI, identical on both runs: unit (`src/**`, `--all`) 87.72 / 78.63 / 90.55 / 87.72; browser suite (`src/web-ui/**`) 66.42 / 59.76 / 44.96 / 66.42. The Windows run gave 87.17 statements for the unit chain, 0.55 points below CI, which is why baselines come from CI.

## Observations and follow-ups

- **A process slip, corrected before the merge:** the baseline commit's first push did not reach GitHub (my output filter hid the failure) and I reported it as pushed. The pull request head still showed the first commit when I checked; I re-pushed, waited for CI on `d7f19cb7f`, and confirmed the pull request head, the local head and the CI run's commit all matched before asking for the merge. Lesson: verify the remote head after every push, not only when something looks wrong.
- **What the floors can and cannot see:** the unit floor uses `--all`, so a new source file with no tests lowers it. The browser suite's measurement is unchanged (no `--all`, `src/web-ui/**` only) so its recorded history stays comparable; it therefore cannot see a new file no browser test loads. Both floors are guards against loss, not targets: the unit chain is at 87.7% and the browser suite alone at 66.4% of statements.
- **Drift risk accepted (decisions D2):** a series of pull requests each lowering coverage by under 0.5 points can drift down. Re-record the baseline upward whenever coverage improves, and tighten the tolerance once there are two weeks of real data.
- **Follow-ups, not started:** one combined unit plus browser percentage (needs a job that merges both raw V8 outputs); targeted tests for the largest browser-only gaps (`routes/settings.js` 36.5%, `adapters/pipeline-state-github-writer.js` 26%, `routes/billing.js` 51% in the browser suite alone).
- **Still the operator's decisions:** adding `Core browser tests`, `Lint, typecheck, test, build` and now the ratchet (which runs inside both) to the master ruleset's required checks; whether to run story 3's options B and C (findings: `spikes/deploy-group-and-staging-reliability-findings.md`); and the production promotion.
- **Process held:** the feature was registered on master before the branch was cut (the assurance gate passed first time, unlike the previous story), CI was confirmed on the final commit, and master was checked after the merge (all five files, plus the ratchet run against the recorded baseline).

## Scope Deviations

One addition beyond the contract: `--all` on the unit chain's c8 command (AC3), with its own assertion in T9 and decisions D4.
