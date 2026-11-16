# ciw-s2 verify-completion evidence

Date: 2026-11-16. Branch: `feature/ciw-s2-deprecate-workflows` (red tests 491ef2117, then the implementation commit).

## Result

5 of 6 acceptance criteria (AC) verified by automated tests that have run. AC6 (live: after merge and the next hour, the Actions list shows no new "Fleet Aggregation" or "Deploy dashboards to GitHub Pages" run) can only be observed after merge.

## Tests

- `tests/check-ciw-s2-deprecated-workflows.js`: 5 passed (T0 to T4), 0 failed. Written first and run red: T1 (push trigger still present), T2 (push trigger still present) and T3 (no banner in `dashboards/README.md`) failed for the right reason; T0 (the trigger extractor, checked on synthetic input) and T4 (no tabs, same jobs, same `uses:` lines, same secret references) passed before the change as invariants. Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4.
- **Existing test edited (2 assertions):** `tests/check-dviz2-pages-workflow.js` T3 and T4. They asserted that the workflow text contained `dashboards/**` and `.github/pipeline-state.json`. The new DEPRECATED header mentions both paths, so a plain text search would have kept passing for the wrong reason. They now check the non-comment lines: T3 asserts there is no `push` trigger and `workflow_dispatch` is kept, T4 asserts the header is marked DEPRECATED. Its other tests (file exists, no tabs, permissions, upload and deploy steps, no hard-coded secrets) are unchanged and pass.
- Passing unchanged: `check-fleet-aggregation` (tests the aggregation logic, not the triggers), `check-dashboard-viz`, `check-dviz1-adapter`, `check-cv1-canvas-views`, `check-dr1-dashboard-review`, `check-me1-dashboard-editor`, `check-p4-obs-archive`.
- Both workflows keep their jobs, steps, `uses:` lines and secret references byte-for-byte; only the `on:` block and the header comments changed. Nothing was deleted and no repository setting was touched.

## Full suite (local, Windows)

869 files, 6 failed, the same six as the `bfl-s1` run and none related to this change: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1; also fails in CI and is in the baseline), `tests/check-pcr-s1-test-runner.js`, `tests/check-p4-enf-second-line.js`, `tests/check-p3.5-validate-trace.js` and `tests/check-rtvap-s1-archived-test-plan-coverage.js` (these four fail on this machine because `bash` and `sh` do not work; they pass in CI), and `tests/check-cat-s1-core-trace-builder.js` (best of 7 walks measured 50.4 ms under this machine's full-suite load; it passes alone at 25 to 32 ms; second local occurrence, see the note below). The suite side effect on `artefacts/test-slug/ideate.md` was reverted and the stub files it writes under `artefacts/` were not staged.

## Notes

- **cat-s1 (recurring locally):** best of 7 was 50.3 ms in the `bfl-s1` run and 50.4 ms here, both on this machine under full-suite contention, both over the 50 ms line by a hair; it has not failed in CI. A durable fix is to run that file alone (add it to the runner's sequential-exclusive phase) or to move timing checks to the scheduled performance job (`pbj-s1`). Suggested as a small follow-up.
- **Open (operator): remove the `dashboards/` folder and its 8 test files?** Not done: it needs its own story and the operator's explicit go-ahead.

## Open

- AC6 live: after merge, push anything to master and wait past the next hour; the Actions list should show no new Fleet Aggregation and no new Pages deploy run.
