# Test Plan: Resolve archived-feature paths in test_plan_coverage (r-trace-validation-archived-paths)

**Story:** artefacts/2026-07-26-trace-validation-archived-path-fix/stories/r-trace-validation-archived-paths.md
**Track:** Short-track (retrospective — code already merged, this closes the story's own AC3 test-coverage gap)

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Integration | `bash scripts/validate-trace.sh --check test_plan_coverage` reports no missing test plan when the file exists only under `artefacts/archived/<slug>/test-plans/` |
| T2 | AC1 | Integration (regression guard) | Same check still reports a missing test plan when the file exists at neither the primary nor the archived path (the fallback must not mask a genuine gap) |
| T3 | AC2 | Integration | `pwsh -File scripts/validate-trace.ps1 --check test_plan_coverage` mirrors T1's pass — same archived-path fallback works in the PowerShell implementation (skipped if `pwsh` unavailable, matching the existing skip convention in `tests/check-p3.5-validate-trace.js`) |
| T4 | AC2 | Integration (regression guard) | PowerShell mirrors T2's fail case (skipped if `pwsh` unavailable) |

## Regression coverage

- `tests/check-p3.5-validate-trace.js` re-run unmodified — all existing cases must still pass.

## Out of Scope (per story)

- Fixing the `wucp.0` genuine gap (a story with no test-plan file under any name or location).
- Re-running or changing the archive mechanism itself.
- A broader audit of whether other `validate-trace` checks have similar staleness against archived features.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
