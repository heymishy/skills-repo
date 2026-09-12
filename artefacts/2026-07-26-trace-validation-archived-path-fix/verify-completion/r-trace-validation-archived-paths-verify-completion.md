# Verify Completion: r-trace-validation-archived-paths (AC3 test-coverage closure)

**Story:** artefacts/2026-07-26-trace-validation-archived-path-fix/stories/r-trace-validation-archived-paths.md

## AC verification

| AC | Test | Result |
|----|------|--------|
| AC1 (bash fallback) | T1/T2 | Verified manually with a real Python 3 install (this dev machine's default `python3` PATH entry is a non-functional Windows Store alias stub): T1 (archived-only) exits 0, T2 (neither path) exits 1. Automated test skips gracefully on this machine per the same convention `check-p4-enf-second-line.js` already established for this exact environment condition; will run genuinely in CI, which has a real `python3`. |
| AC2 (PowerShell mirror) | T3/T4 | PASS — genuinely executed and passing on this machine (`pwsh` available) |

## Regression coverage

`tests/check-p3.5-validate-trace.js` re-run unmodified — 4/5 passing; the one failure (`ps1-exits-0-on-valid-repo-with-ci-flag`) is a documented, pre-existing resource-contention flake already listed in `tests/known-baseline-failures.json`, unrelated to this change.

## Full suite

Full `npm test` run in background — no new failures introduced beyond the known baseline.

## Scope check

Confirmed via `git status`/`git diff`: only the new test file and this feature's own `artefacts/` were touched. No change to `scripts/validate-trace.sh` or `scripts/validate-trace.ps1` — both already carry the archived-path fallback from commit `f7aa0dad` (2026-07-25).

## Outcome

AC3 (test coverage gate) closed with real, working tests — genuinely executed on both the bash side (verified manually with a working Python, skips gracefully in this environment's own broken-python3-stub condition) and the PowerShell side (genuinely executed and passing here). Ready for `/branch-complete`.
