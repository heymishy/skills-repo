# Implementation Plan: r-trace-validation-archived-paths (AC3 test-coverage closure)

**Story:** artefacts/2026-07-26-trace-validation-archived-path-fix/stories/r-trace-validation-archived-paths.md
**Test plan:** artefacts/2026-07-26-trace-validation-archived-path-fix/test-plans/r-trace-validation-archived-paths-test-plan.md

## Tasks

1. Create `tests/check-rtvap-s1-archived-test-plan-coverage.js`, reusing the copy-script-into-tmpdir harness pattern from `tests/check-p3.5-validate-trace.js`.
2. T1/T2 (bash): fixture repo with a story whose test-plan exists only at the archived path (T1, expect exit 0) or at neither path (T2, expect exit 1) — verified manually against a real Python 3 install (this dev machine's default `python3` resolves to a non-functional Windows Store alias stub), then wired with the same graceful-skip detection already established in `check-p4-enf-second-line.js` for that exact environment condition.
3. T3/T4 (PowerShell): same two fixtures against `validate-trace.ps1`, skipped gracefully if `pwsh` unavailable (matching `check-p3.5-validate-trace.js`'s own convention) — genuinely executable and passing on this machine.
4. Re-run `tests/check-p3.5-validate-trace.js` unmodified — confirm no new regressions (its one pre-existing failure, `ps1-exits-0-on-valid-repo-with-ci-flag`, is a documented resource-contention flake, already in `tests/known-baseline-failures.json`).
5. Run the full `npm test` suite in background — confirm no new failures beyond the known baseline.
6. Clean test-pollution junk, commit, push, open draft PR, gate-advance to `branch-complete`.

## Notes

No change to `scripts/validate-trace.sh` or `scripts/validate-trace.ps1` — both already carry the archived-path fallback (commit `f7aa0dad`, 2026-07-25); this story only adds the missing test coverage.
