## Test Plan: One committed command boots the test server, runs the core browser lane, and prints what broke

**Story reference:** artefacts/2026-11-18-verify-script/stories/vfy-s1-verify-script.md
**Epic reference:** None - short-track
**Test plan author:** Claude Haiku 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-vfy-s1-verify-script.js`, which tests the pure parts of the script (report reading, digest formatting, argument handling, port check) against fixture data. The live run is a manual step recorded in the DoD.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Default run uses the core list, one worker, `NODE_ENV=test`; Playwright starts the server | 2 (T1a: argv built from the list and `--workers=1`; T1b: env sets `NODE_ENV=test`) | - | live run (DoD) | - | - | 🟢 |
| AC2 | Failure digest: title, file and line, first error line, no ANSI codes, no server log | 3 (T2a: digest from a fixture report with two failures; T2b: ANSI removed; T2c: a passing run prints no failure entries) | - | live run with a deliberately failing spec (DoD) | - | - | 🟢 |
| AC3 | Pass prints count and exits 0; failure exits with the Playwright code | 2 (T3a: exit code passes through; T3b: pass path prints count) | - | live run both ways (DoD) | - | - | 🟢 |
| AC4 | Explicit file arguments replace the core list | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Busy port 3999 stops before any test | 2 (T5a: busy port detected; T5b: free port passes the check) | - | - | - | - | 🟡 (the check uses a bind attempt; a racy listener could pass the check and then fail in Playwright, which still reports the port) |

## Red-first plan

The test file requires `scripts/verify.js` and calls its exported functions. Before the script exists, `node tests/check-vfy-s1-verify-script.js` fails at the `require`; that is the red state recorded in the DoD. Each test then goes green as its function is added.
