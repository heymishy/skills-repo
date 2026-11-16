# trr-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/trr-s1-test-results` (red tests cc9f18a3f, then the implementation commit).

## Result

5 of 6 acceptance criteria (AC) verified by automated tests that have run (AC1 also on a real full-suite run). AC6 (live: the next real PR run uploads a `test-results-<run id>` artefact that downloads and parses) can only be observed after merge.

## Tests

- `tests/check-trr-s1-per-file-test-results.js`: 6 passed, 0 failed, run three times in a row with no variation. Written first and run red: T1 (no `results` array), T2 (no extractor), T3 (no per-file results), T4 (no upload step) and T5 (no writer) failed for the right reason; T6 passed before the change as an invariant. Mapping: T1 AC1, T2 AC2 and the bounded-text NFR, T3 AC2, T4 AC3, T5 AC4, T6 AC5.
- **T6 was changed during the build.** The plan had T6 run `check-tfhc-s9-run-all-tests-parallelization` as a child process. In one run that nested call failed with an empty message although the file passes alone and in 3 of 3 later runs; running one timing-sensitive test file inside another is a flake risk, so T6 is now a deterministic check of the runner's existing contract (exports present, 16-entry grandfather list, `failedFiles` and `elapsedMs` unchanged, empty list returns empty arrays), and AC5 for `tfhc-s9` and `pcr-s1` is verified by the full suite running them as before. The test plan was edited to match.
- Fixture output is silenced inside the test so its log stays clean; the CI regression checker reads only the runner's `  - path` summary lines, so fixture text could not have been mistaken for failures.
- Existing `check-tfhc-s9-run-all-tests-parallelization` passes (exit 0); `check-pcr-s1-test-runner` is the known baseline failure with the same single issue as before.

## Full suite

867 files, 4 failed locally: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1), `tests/check-pcr-s1-test-runner.js`, `tests/check-p4-enf-second-line.js` and `tests/check-rtvap-s1-archived-test-plan-coverage.js`. The last two fail on this Windows machine with `exit: null` from `validate-trace.sh` / `sh` (no working bash), so they are local-environment failures, not CI failures (see the audit correction). **The real `test-results.json` from this run was checked: 867 entries, summary `{total:867, passed:863, failed:4, timedOut:0}`, identical to the runner's own count (AC1 on a real run).** First data it gives: median file 232 ms; 31 files take over 5 s; slowest are `check-p3.5-validate-trace.js` 98.7 s, `check-p4-enf-second-line.js` 60.1 s (fails here), `check-rb-s1-cli-init.js` 34.0 s, `check-pcr-s1-test-runner.js` 32.1 s, `check-rb-s5-optional-outer-loop-install.js` 27.7 s. The suite side effect on `artefacts/test-slug/ideate.md` was reverted and the stub files it writes under `artefacts/` were not staged; `test-results.json` is git-ignored.

## Open

- AC6 live: after merge, open the next PR's "PR Checks" run, download the `test-results-<run id>` artefact and confirm it parses and lists about 870 files.
- Not in this story: the aggregation script that reads many of these artefacts (never-failed, flaky, slowest, duplicate-looking files). The first real data can be read from the file this run produced locally.
