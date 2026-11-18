# vfy-s1 Definition of Done

Date: 2026-11-18. Story: one committed command boots the test server, runs the core browser lane, and prints what broke. Pull request opened as a draft from `fix/vfy-s1-verify-script`; merge and pipeline-state advance recorded after merge.

## Result: COMPLETE, pending merge

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (default run uses the core list, one worker, `NODE_ENV=test`; Playwright starts the server) | ✅ | T1a and T1b in `tests/check-vfy-s1-verify-script.js`. Live: `node scripts/verify.js` printed "Running 39 spec files with one worker" and the server started through Playwright's `webServer` on 3999 | automated + live | none |
| AC2 (failure digest: title, file and line, first error line, no colour codes, no server log) | ✅ | T2a to T2c. Live failing run (temporary spec, deleted after): `1) deliberately failing check for the verify digest` / `tests/e2e/vfy-tmp-fail.spec.js:4` / `Error: the digest should show this line`, no server output in the printed digest | automated + live | none |
| AC3 (pass prints the count and exits 0; failure exits with the run's code) | ✅ | T3a, T3b. Live core run: `PASS: 144 passed, 3 skipped.`, exit 0. Live failing run: exit 1 | automated + live | none |
| AC4 (explicit spec arguments replace the core list) | ✅ | T4. Live: the failing run above passed one file explicitly and ran only that file | automated + live | none |
| AC5 (busy port 3999 stops before any test) | ✅ | T5a (a listener on 127.0.0.1 is reported busy) and T5b (a closed port is free). The check is a connect probe on both loopback addresses (see decisions) | automated | the first version used a bind test, which failed T5a on Windows; replaced before the run |

## Observations and follow-ups

- **The 3 skipped tests are pre-existing**, not from this change: `test.skip` calls in `tests/e2e/skill-launcher.spec.js` (AC5 licence message; AC2 and AC3 marked "future"). The digest prints the skip count, so they stay visible.
- **The core lane run passed in full through the new command** (39 files, 144 passed, 0 failed) on the worktree at the time of the run. CI on the pull request is the authoritative second run.
- **Output location:** the full run output and the JSON report are written to a temporary directory whose path the command prints. They are not deleted, so a failure can be read after the terminal has moved on.
- **Not done (out of scope):** running the quarantined or Scenario specs, lint, typecheck, unit tests or governance checks through this command.

## Scope Deviations

- AC5 implementation: a connect probe, not a bind test, because a bind test reports a port held on 127.0.0.1 as free on Windows. The story's AC wording ("says which port is busy") is unchanged.
