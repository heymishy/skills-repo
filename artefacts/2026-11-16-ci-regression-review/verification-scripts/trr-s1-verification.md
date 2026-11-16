# Verification script: trr-s1 (per-test-file results recorded in CI)

Steps 1 to 6 are covered by `node tests/check-trr-s1-per-file-test-results.js` and the full suite; step 7 needs the first real PR run after merge.

1. T1: a run over fixture tests writes `test-results.json` with one entry per file and counts that match the summary.
2. T2, T3: failing and timed-out files carry their exit code and a truncated first failing line.
3. T4: the workflow uploads the file with `if: always()` and 90-day retention; the file is git-ignored.
4. T5: an unwritable results path never changes the suite's outcome.
5. T6: the existing parallelisation test passes unchanged.
6. Full suite: only the known baseline failures, and a real `test-results.json` appears at the repo root after a local run (git-ignored).
7. **Live (after merge):** open the next PR's "PR Checks" run, find the artefact named `test-results-<run id>`, download it and confirm it parses and lists about 870 files.
