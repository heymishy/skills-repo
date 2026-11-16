# inc-s2 verify-completion evidence

Date: 2026-11-16. Branch: `feature/inc-s2-record-in-fix-pr` (red tests 890b3514d, then the implementation commit). Built after the operator's correction: no incident PR, no manual workflow, no local script; the GitHub issue is the record and the fix is a short-track story and PR. An earlier build of this story (kept a manual start and added a local recording script) was discarded unmerged and its branch reset.

## Result

5 of 6 acceptance criteria (AC) verified by automated tests that have run. AC6 (live: the next natural production error opens a `production-error` issue and no incident pull request) can only be observed when such an error happens; no deliberate error is created for it.

## What changed

- **Deleted:** `.github/workflows/error-issue-incident-record.yml` (the only thing that opened the incident PRs).
- **Edited:** `tests/check-coha-s7-error-issue-incident.js`: removed the 15 tests that only guarded that workflow (`cwt_UT1`, `cwt_UT2`, `W1` to `W13` including the old `W12`) and the `WORKFLOW` constant; added `S1 no credential in the script, library or this test` (the credential scan that also covered the script, library and test file). The file goes from 46 to 32 tests; every recogniser, planner, CLI, product-page and conflict test is unchanged and passes.
- **Added:** `tests/check-inc-s2-no-incident-pr.js` (5 tests).
- **Not touched:** the error bridge and its tests, `scripts/error-issue-incident.js`, `scripts/lib/error-issue-incident.js`, `scripts/run-all-tests.js`, `tests/check-eit-s1-issue-title.js`, `workspace/incidents.json`, every skill.

## Tests

- `tests/check-inc-s2-no-incident-pr.js`: 5 passed, 0 failed. Written first and run red: T1 (the workflow file existed with an `issues` trigger), T2 (the coha-s7 test still read the workflow) and T4 (only `tests/check-coha-s7-error-issue-incident.js` still named the workflow) failed for the right reason; T3 (the bridge handler is exported) and T5 (the library still enforces the 120-character code limit) passed before the change as invariants. Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4, T5 AC5.
- Existing tests: `check-coha-s7-error-issue-incident` 32 passed, 0 failed (edited as above); `check-coha-s6-error-bridge` 83 passed, 0 failed, 7 skipped (real-Postgres tests need a database; unchanged); `check-eit-s1-issue-title` 6 passed (unchanged).

## Full suite (local, Windows)

870 files, 5 failed, all known local-environment or baseline failures, none related to this change: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1; also fails in CI and is in the baseline) and `tests/check-pcr-s1-test-runner.js`, `tests/check-p4-enf-second-line.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js` (these four fail on this machine because `bash` and `sh` do not work; they pass in CI). `tests/check-cat-s1-core-trace-builder.js` passed this time. The suite side effect on `artefacts/test-slug/ideate.md` was reverted and the stub files it writes under `artefacts/` and `workspace/` were not staged.

**Incident during the build:** the suite created an unrequested local commit, `feat: discovery artefact (amended)`, that swept up my staged deletion of the workflow (a known side effect of running the full suite in a worktree: a test fires a real `git commit`). It contained only that deletion and was never pushed; it was soft-reset and the work recommitted with a proper message and named files. Lesson: commit (or stash by unique tag) before running the full suite in a worktree.

## Open

- AC6 live: when the next production error opens an issue, confirm no pull request titled "Incident record for ..." appears. Resolve the issue as a short-track story whose PR says `Fixes #<issue>`.
- Follow-up needing the operator's go-ahead: delete the now-unused `scripts/error-issue-incident.js`, `scripts/lib/error-issue-incident.js` and the remaining coha-s7 tests (the `eit-s1` title check uses the library's `codeProblem`, so that function would first move or be inlined).
