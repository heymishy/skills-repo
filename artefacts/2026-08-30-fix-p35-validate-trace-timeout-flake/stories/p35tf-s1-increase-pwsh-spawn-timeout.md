# Story: Increase check-p3.5-validate-trace.js's pwsh spawn timeout to stop a full-suite-only flake

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; root cause found directly during S4's `/branch-setup` for `2026-08-29-diagram-validation-and-types`
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator running the full test suite in a worktree before starting any inner-loop story**,
I want **`check-p3.5-validate-trace.js`'s `ps1-exits-0-on-valid-repo-with-ci-flag` test to stop failing intermittently when run as part of the full suite**,
So that **I stop needing to RISK-ACCEPT the same known-flake finding on every single story's baseline check**.

## Benefit Linkage

**Metric moved:** Operator/agent time spent re-diagnosing and RISK-ACCEPTing a known flake (operational efficiency, not a formal benefit-metric artefact — short-track).
**How:** This exact failure (`validate-trace.ps1 --ci exited null. stderr: (empty)`) has recurred 8 times across 5 unrelated stories/features in one session (`revise-earlier-stage` ×4, and S1/S2/S3/S4 of `2026-08-29-diagram-validation-and-types`) — always when run as part of the full suite (`node scripts/run-all-tests.js`), never when the file is run standalone. `spawnSync`'s `status: null` with empty `stderr` is the documented signature of a process killed by its own timeout, not a real assertion failure. The test spawns a real `pwsh` subprocess with a 30-second timeout; ~6 minutes and 500+ sequential Node child-process spawns into a full-suite run, the machine is under enough sustained load that `pwsh` cold-start occasionally exceeds 30 seconds. Removing this structural cause eliminates the RISK-ACCEPT step for every future story's `/branch-setup` baseline check.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. This story touches one test file's own timeout configuration, not application code or test-runner mechanics; no ADR governs subprocess spawn timeouts in tests today.

## Dependencies

- **Upstream:** None.
- **Downstream:** None — removes a recurring nuisance for all future worktree baselines but does not block or unblock any specific story.

## Acceptance Criteria

**AC1:** Given `check-p3.5-validate-trace.js`'s two `cp.spawnSync('pwsh', ..., { timeout: 30000, ... })` calls (the `ps1-exits-0-on-valid-repo-with-ci-flag` and `ps1-exits-nonzero-on-missing-required-field` tests), When the timeout value is increased to a value with real margin under sustained-load conditions, Then both calls use a single named constant (not two separate magic numbers) so future changes only need one edit.

**AC2:** Given the increased timeout, When the test file is run standalone (`node tests/check-p3.5-validate-trace.js`), Then all 5 tests still pass exactly as before — this change must not alter what is being validated, only how long the test waits for a legitimately slow subprocess.

**AC3:** Given the increased timeout, When the full test suite is run (`node scripts/run-all-tests.js`) at least twice in immediate succession (simulating the sustained-load condition that has triggered this flake historically), Then `check-p3.5-validate-trace.js` passes cleanly both times, with no `exited null` failure.

## Out of Scope

- Investigating or fixing the underlying reason `pwsh` cold-start is slow under sustained load (a deeper Windows/PowerShell-startup-performance investigation, not justified by this bounded fix — the timeout increase directly addresses the observed symptom with real margin).
- Any change to `validate-trace.ps1` itself, or to `run-all-tests.js`'s own spawn/timeout mechanics for other test files.

## NFRs

- **Performance:** A slower worst-case for these two specific tests (more time before timing out on a genuinely broken `validate-trace.ps1`) is an acceptable tradeoff for eliminating a recurring false-positive failure. No other performance impact — the tests still typically complete in well under a second when `pwsh` starts promptly.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no epic; oversight is Medium (operator directly reviewing this fix given its 8-occurrence history)
