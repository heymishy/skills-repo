## Test Plan: Stop the incident-record pull request: the GitHub issue is the record, and the fix is a short-track story and PR

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/inc-s2-record-incidents-in-the-fix-pr.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16 (rescoped the same day)
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-inc-s2-no-incident-pr.js`. It reads the workflows directory and searches source files as text. The existing `tests/check-coha-s7-error-issue-incident.js` is edited (the workflow-guarding block removed); `tests/check-coha-s6-error-bridge.js` and `tests/check-eit-s1-issue-title.js` are unchanged and must pass.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Workflow file gone; no workflow has an `issues` trigger | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | coha-s7 test no longer reads the workflow; its logic tests and credential scan remain | 1 (T2) | the full suite | - | - | - | 🟢 |
| AC3 | Bridge untouched; its tests pass | 1 (T3) | the full suite | - | - | - | 🟢 |
| AC4 | No reference to the removed workflow outside artefacts, workspace and worktrees | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Library and eit-s1 title check still work | 1 (T5) | the full suite | - | - | - | 🟢 |
| AC6 | Live: next production error opens an issue and no PR | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the next natural production error | AC6 | Live-only | Verification scenario 7; no deliberate error is created |

## Tests (new file `tests/check-inc-s2-no-incident-pr.js`)

- **T1 (AC1).** `.github/workflows/error-issue-incident-record.yml` does not exist; no file in `.github/workflows/` has an `issues:` key under its top-level `on:` block (small extractor as in `check-ciw-s2-deprecated-workflows`). Fails today (the file exists, with an `issues` trigger).
- **T2 (AC2).** `tests/check-coha-s7-error-issue-incident.js` contains neither `error-issue-incident-record` nor `const WORKFLOW`, no test named `W1`..`W13`, `cwt_UT1` or `cwt_UT2`, and still contains the tests named `U1`, `I1`, `N1` and `W12 no credential` (the credential scan). Fails today.
- **T3 (AC3).** `src/web-ui/routes/error-bridge.js` exists and exports `handlePostErrorBridge`; the bridge file is byte-identical to its content at the story's base commit is not asserted (the diff is reviewed in the PR); the behaviour is covered by `check-coha-s6-error-bridge` in the full suite.
- **T4 (AC4).** Walk `scripts/`, `src/`, `tests/`, `.github/` and `docs/` (not `artefacts/`, `workspace/`, `.worktrees/`, `node_modules/`), skipping this test file: no file contains the string `error-issue-incident-record`. Fails today (the workflow file's own name appears in the coha-s7 test).
- **T5 (AC5).** `require('../scripts/lib/error-issue-incident')` still exports `recogniseIssue`, `planRun` and `codeProblem`; `codeProblem` accepts a 120-character code and rejects a 121-character one.

AC2, AC3 and AC5 are also verified by the full suite running `check-coha-s7-error-issue-incident` (edited), `check-coha-s6-error-bridge` and `check-eit-s1-issue-title` as they are.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Deleting tests is a risk to coverage | They guard a file that no longer exists; the logic tests stay | T2 pins which tests must remain; the PR diff shows exactly which tests were removed |

**Total automated tests:** 5 (T1 to T5) plus AC6 live.
