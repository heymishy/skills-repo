## Test Plan: Fix the three test files that really fail in CI, then empty the baseline

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/bfl-s2-fix-the-three-real-ci-failures.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-bfl-s2-real-ci-failures.js`. The integrity-check cases (T1 to T4) copy `scripts/check-pipeline-state-integrity.js` into a temporary root (`<tmp>/scripts/` plus `<tmp>/.github/pipeline-state.json`) and run it as a child process, because the script reads a fixed path relative to its own location. The guard cases (T6, T7) call the exported `isInsideRepo` with `path.posix` and `path.win32`, which checks the Linux and Windows rules on any machine.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | C3 carve-out accepted, and refused without a reason, with a shortfall, or on over-count | - | 4 (T1 to T4) | - | - | - | 🟢 |
| AC2 | Real state: tfhc-s1 honest 4 plus knownFailing 1; the real integrity check exits 0 | - | 1 (T5) | - | - | - | 🟢 |
| AC3 | Six vectors rejected and valid paths accepted under posix and win32 rules | 2 (T6, T7) | - | - | - | - | 🟢 |
| AC4 | `sourceIntegrity` from another cwd, and the six vectors from the real function | - | 1 (T8) | - | - | - | 🟢 |
| AC5 | Baseline empty; the checker exits 0 with no failures and 1 with one; gpa tests pass | - | 1 (T9) plus the updated bfl-s1 tests and the gpa files | - | - | - | 🟢 |
| AC6 | CI run on Linux shows 0 failing | - | - | - | 1 | Live-only | 🟡 |
| NFR | No vector rejected before is accepted now | - | covered by T6, T7 (all six, both rule sets) | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs a Linux run | AC6 | Live-only | Docker Desktop is not running here; the PR's own CI run on Linux is the evidence (the bfl-s1 stale-entry rule makes CI fail if the baseline still lists a file that now passes) |

## Tests (new file `tests/check-bfl-s2-real-ci-failures.js`)

- **T1 (AC1).** Synthetic state, one merged story: `totalTests 5, passing 4, knownFailing 1, knownFailingReason 'RISK-ACCEPT in decisions.md'`: the temporary-root script exits 0 and prints no C3. Fails today (C3 fires: the field is ignored).
- **T2 (AC1).** Same, with `knownFailingReason` missing or empty: exits 1 and the output names C3 and the missing reason. Fails today in a different way (C3 fires with the old message only).
- **T3 (AC1).** `passing 3, knownFailing 1, totalTests 5`: exits 1 with C3 (the carve-out does not hide a genuinely missing test).
- **T4 (AC1).** `passing 4, knownFailing 2, totalTests 5`: exits 1 with C2 (over-count).
- **T5 (AC2).** The real `.github/pipeline-state.json`: `tfhc-s1` has `testPlan.passing === 4`, `knownFailing === 1`, and `knownFailingReason` contains `decisions.md`; the real script exits 0. Fails today.
- **T6 (AC3).** `isInsideRepo(v, '/repo', path.posix)`: each of the six vectors returns false; `README.md`, `scripts/ci-audit-comment.js`, `artefacts/a/b.md` return true. Fails today (the helper does not exist).
- **T7 (AC3).** `isInsideRepo(v, 'C:\\repo', path.win32)`: the same expectations.
- **T8 (AC4).** `process.chdir(os.tmpdir())` then `sourceIntegrity('README.md', null)` returns the em dash; the six vectors return `{ traversal: true, sanitisedPath: '[REDACTED]' }`; the working directory is restored.
- **T9 (AC5).** The real baseline has `files` equal to `[]`; `ci-test-regression-check` given a log with no failed files exits 0 and prints `0 file(s) currently failing, 0 in known baseline`; given a log naming `tests/x.js` it exits 1 naming it.

Existing tests changed by this story (edited in the same PR, each named in the DoR contract): `tests/check-gpa-sc06-source-path-guard.js` T3 (looks for the `isInsideRepo(` call before `readFileSync(`, and that `startsWith(` is in the helper); `tests/check-bfl-s1-baseline-tightened.js` T1 (empty baseline) and T2 to T4 (temporary baseline of the three names via the checker's second argument).

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real Linux path behaviour of `sourceIntegrity` itself | Docker not running locally | `isInsideRepo` is tested with `path.posix` and `path.win32`; the PR's CI run on Linux is the end-to-end proof (AC6) |

**Total automated tests:** 9 (T1 to T9) plus AC6 live in CI.
