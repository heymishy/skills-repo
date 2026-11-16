# bfl-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/bfl-s1-baseline` (red tests 3237db06e, then the implementation commit).

## Result

5 of 6 acceptance criteria (AC) verified by automated tests that have run. AC6 (live: the next real PR run's Unit test chain log says "3 file(s) currently failing, 3 in known baseline" and passes) can only be observed after merge.

## Tests

- `tests/check-bfl-s1-baseline-tightened.js`: 5 passed, 0 failed. Written first and run red: T1 (70 entries), T2 (a tolerated file's failure was excused, exit 0) and T3 (a stale entry exited 0) failed for the right reason; T4 (failures equal to the baseline exit 0) and T5 (the existing checker tests) passed before the change as invariants. Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4, T5 AC5.
- **Existing tests edited (1 assertion):** `tests/check-ci-test-regression-check.js` IT3 asserted the old behaviour ("a baseline file that now passes ... does not fail the gate", exit 0). It now asserts exit 1 and `stale baseline entry: tests/check-b.js`; its header comment says why. Its other assertions pass unchanged, including U3 (the baseline file is well formed, now 3 entries).
- Other readers of the baseline file pass unchanged: `check-tst-s1-baseline-triage` (its U6 already recorded the two `gpa` files as "CI-verified still failing", which corroborates the baseline), `check-a5-ci-gate-config` (14 passed), `check-scsf-s1-samesite-cookie-fix` (19 passed).
- The baseline was derived from the per-file CI artefact `test-results-43811318391` (867 files, 3 failed: `scripts/check-pipeline-state-integrity.js`, `tests/check-gpa-sc06-source-path-guard.js`, `tests/run-gpa-tests.js`), not from a local Windows run.

## Full suite (local, Windows)

868 files, 6 failed: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1; also fails in CI and is in the baseline), `tests/check-pcr-s1-test-runner.js`, `tests/check-p4-enf-second-line.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js` (these four fail on this machine because `bash` and `sh` do not work; they pass in CI) and `tests/check-cat-s1-core-trace-builder.js`.

- **cat-s1:** the per-file results give its failing line: `walk completes in under 50ms (best of 7 warm runs: 50.3ms)`. It passes alone (25.0, 28.0 and 32.0 ms in three runs). #1120's best-of-7 made it much less likely but not impossible under this machine's full-suite contention. Not changed here; the durable fix (run timing-sensitive files alone, or move timing checks to a scheduled performance job) belongs with `pbj-s1`.
- **Expected local effect of this change:** running `ci-test-regression-check.js` on this machine's output reports the four local-environment files as NEW regressions and the two `gpa` files as stale (they pass on Windows). The checker is intended for CI (Linux) only, where the failing set is exactly the baseline (T4). `trr-s1`'s per-file results from the next CI run will confirm.
- The suite side effect on `artefacts/test-slug/ideate.md` was reverted and the stub files it writes under `artefacts/` were not staged.

## Open

- AC6: after merge, read the next PR's "Unit test chain" log: expect "3 file(s) currently failing, 3 in known baseline" and "no new regressions", with no stale-entry lines.
- Risk to watch (DoR W6): if a baseline file ever becomes flaky-passing in CI, the stale-entry rule would fail that run on a lucky pass. The three are deterministic (a data value, and a platform-specific vector list).
- Next: `bfl-s2` fixes the three and empties the baseline; its PR must remove each entry as it fixes it.
