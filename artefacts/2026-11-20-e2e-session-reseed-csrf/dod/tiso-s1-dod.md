# tiso-s1 Definition of Done

Date: 2026-11-21. Story: re-seeding the shared E2E test session no longer invalidates the CSRF token (Cross-Site Request Forgery token) of a test that is already running. Pull request #1170 merged 2026-11-20 (`fbf6fddbf`). No issue.

## Result: COMPLETE. All 7 acceptance criteria met. The first CI run on the pull request was all green, and the E2E failing list fell from 16 to 6. The remaining 6 are known and have other causes.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-tiso-s1-reseed-keeps-csrf-token.js` T1: a re-seed keeps the existing `csrfToken` and every other field equals the seed data. Red first: failed before the change (the token was lost); passes after | automated | none |
| AC2 | ✅ | T2: a changed `login`, `tenantId` and `accessToken`, plus an extra field, are all restored or removed by a re-seed. T2 also asserts the token survives, so it failed before the change as well (for the token, not for the reset); passes after | automated | The test plan expected T2 to pass before the change, since it was meant to pin existing behaviour. It also asserts the token, so it failed before; the reset half passed throughout |
| AC3 | ✅ | T3: with no stored session, or a session with no token, the result is exactly the seed data with no `csrfToken` key. Passed before and after, as planned | automated | none |
| AC4 | ✅ | `tests/e2e/tiso-s1-reseed-keeps-csrf.spec.js` T-E1: POST `/products/confirm` with a held token returns 302, `GET /test/session`, the same token returns 302 again. Before the change the second POST returned 403 `text/plain`; passes after, locally and in CI | automated | none |
| AC5 | ✅ | T4: `seedTestSession` outside `NODE_ENV=test` without `allowOutsideTest` still throws. The existing session and CSRF checks pass unchanged. In CI, `Lint, typecheck, test, build` passed with no new regression against the known baseline | automated | none |
| AC6 | ✅ | `frsr-s1` + `ep2-s1` + `ep2-s2` together, 5 runs after the change: passed in 5 of 5. Before: an `ep2` spec failed in 7 of 8 recorded runs | automated (repeated runs) | none |
| AC7 | ✅ | the merged diff is 4 files: `src/web-ui/middleware/session.js` (9 lines changed, including a 4-line comment), the new check, the new spec, and 6 lines in `tests/e2e/capability-matrix.json` (lane `extended`, added up front after the ctab-s1 CI failure). Artefacts were committed to master before the pull request | manual (diff check) | none |

## Whole-suite measurement (local, same worktree and machine, two runs each, `session.js` reverted for the "before" runs)

| | failing, run 1 | failing, run 2 | failing in both |
|---|---|---|---|
| Before (master `session.js`) | 26 | 31 | 21 |
| After (this change) | 8 | 7 | 6 |

No test failed after that did not fail before. 26 tests that failed in at least one "before" run failed in no "after" run.

## CI evidence

| Run | Passing | Failing |
|---|---|---|
| master baseline (run `44685372791`) | 253 | 16 |
| pull request #1170 | 268 | 6 |

All 9 checks on the pull request passed, including `Lint, typecheck, test, build`, Core browser tests and both scenario jobs. The 6 failures are the consistent ones, all also failing on the master run: `bmau-s1`, `dsa-s2` (2 tests), `ep3-s1`, `fpd-s4`, `wuce18`. This run had no intermittent failures. Before this change the same job swung between 8 and 13 failures from run to run. One clean run does not prove the noise is gone; it matches the local measurement.

## Observations and follow-ups

- **Three specs still fail intermittently locally after the fix**, each in one of the two "after" runs: `ep2-s1`, `ep2-s3`, `ep4-s1`. This is not the CSRF cause. Not seen in the CI run. If they recur, shared data is the likely place to look.
- **The six consistent failures are separate causes.**
  - `bmau-s1` is a stale spec that clicks a checkbox inside a collapsed group without opening it (the `frsr-s1` repair pattern).
  - `dsa-s2` counts journeys other specs created in the shared `e2e-tester` tenant. This is the one case where a per-spec tenant would help (`/test/session?sessionId=&tenantId=` already supports it; a tenant must start with `e2e-`).
  - `ep3-s1`, `fpd-s4` and `wuce18` have causes not yet found.
- **Per-spec sessions and tenants are not done.** The evidence so far says the larger change is not needed for the CSRF noise; whether it is needed for `dsa-s2` and the intermittent three is open.
- **The capability matrix still lists the five esh-s1 specs as `quarantined`** (`ep1-s3`, `ep1-s4`, `fpux.1`, `jcx-s6`, `frsr-s1`) with stale reasons, and `ctab-s1` and `tiso-s1` as `extended`. The operator asked for these to be updated together after isolation. That is the next step. `extended` is the non-blocking default; moving anything to `core` makes it blocking and is the operator's call.
- **Two local-only `npm test` failures** (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`) fail on the master checkout too and are not shown by CI.
- **The staging bypass reaches the same function** (`allowOutsideTest`), so the Scenario A and B specs get the same protection on their shared session. Not separately measured.
- `continue-on-error` on the E2E job is unchanged. With the failing list now at 6 stable known entries, whether to drop it is a question for the operator once those are repaired or quarantined.

## Scope Deviations

None.
