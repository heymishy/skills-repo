## Test Plan: A small required core of browser tests, chosen by capability and measured coverage

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s2-choose-the-required-core-browser-set.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. The browser specs run separately with `npm run test:e2e` (Playwright). New files: `tests/check-lpw-s2-measure.js`, `tests/check-lpw-s2-capability-matrix.js`, `tests/check-lpw-s2-select-core.js`, `tests/check-lpw-s2-workflows.js`; new scripts `scripts/measure-playwright-spec-coverage.js`, `scripts/capability-matrix.js`, `scripts/select-core-specs.js`, `scripts/list-core-specs.js`; new data `tests/e2e/capability-matrix.json`; new workflow `.github/workflows/playwright-spec-coverage.yml`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Per-spec measurement tool and workflow triggers | 2 (T1, T5) | - | one CI run | - | - | 🟡 |
| AC2 | Measurement result recorded | - | - | - | 1 | Live-only | 🟡 |
| AC3 | Matrix lists every spec once; guard fails on each defect | 1 (T2, many cases) | - | - | - | - | 🟢 |
| AC4 | Selection rule applied by a script | 1 (T3) | - | - | - | - | 🟢 |
| AC5 | Coverage comparison recorded; core at least 95% of union | - | - | - | 1 | Live-only (needs the measurement) | 🟡 |
| AC6 | Core job in `e2e.yml` | 1 (T5) | - | CI run | - | - | 🟢 |
| AC7 | Every failing spec fixed or quarantined | 1 (T2: lanes) | - | CI runs | - | Partly live | 🟡 |
| AC8 | Core green twice on one commit | - | - | two CI runs | - | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| The measurement needs a real CI run (V8 coverage cannot be flushed on this Windows machine) | AC1, AC2, AC5 | Live-only | Run the workflow on the pull request; record in `evidence/per-spec-coverage.md` and `evidence/core-coverage.md` |
| The matrix's lane for each spec is judgement plus data; a unit test cannot say a lane is right | AC3, AC7 | Judgement | Guard checks structure and dates; reasons are read at review; lanes `core` are confirmed by the two CI runs (AC8) |
| Fixes to kanban, pod and model-session specs are proven only by CI | AC7 | Live-only | Each fix recorded with the CI result in `decisions.md` |

## Tests

- **T1 (AC1).** `scripts/measure-playwright-spec-coverage.js` exports pure functions: `coveredStatements(coverageFinal)` turns a `c8` JSON (`coverage-final.json` shape: `statementMap` and `s` hit counts per file) into a set of `file:line:column` keys and ignores statements with zero hits and files outside `src/web-ui`; `uniqueStatements(setsBySpec)` returns for each spec the keys no other spec covers; `greedyOrder(setsBySpec)` returns specs in order of new statements added with the cumulative count, breaking ties by name; `buildReport(results)` returns the JSON and Markdown (table with passed, failed, skipped, covered, unique, order). Fixture of three small specs with overlapping sets.
- **T2 (AC3, AC7).** `scripts/capability-matrix.js` exports `validateMatrix(matrix, filesOnDisk, today)` returning a list of problems. Cases: a file on disk missing from the matrix; an entry for a missing file; a duplicate entry; an invalid lane; a missing capability; a quarantined entry missing reason, owner, entry date or review date; a review date before `today`; a review date more than 45 days after the entry date; a `scenario` lane for a file that is not one of the six staging-targeted specs, or one of the six not `scenario`; a valid matrix returns no problems. The check script then runs `validateMatrix` on the real `tests/e2e/capability-matrix.json` and the real file list (95 spec files) and fails on any problem.
- **T3 (AC4).** `scripts/select-core-specs.js` exports `selectCore(measurement, matrix, options)`: picks first, for each capability with a passing spec, the one adding the most statements; then greedily more until the next adds less than the threshold (0.1 percentage point of total `src/web-ui` statements); never picks a spec that failed in the measurement or is on the failed-in-lpw-s1 list; reports capabilities with no passing spec as gaps; is deterministic (same input, same list) and returns the cumulative coverage per step. Cases on a small synthetic measurement.
- **T4 (AC6).** `scripts/list-core-specs.js` prints one path per line, only for matrix entries with lane `core`, all of which exist, in a stable order; exits non-zero and prints a message when no entry has lane `core` (so the job cannot silently run nothing).
- **T5 (AC1, AC6).** Workflow text: `e2e.yml` has a job named `Core browser tests` with no `continue-on-error`, a `timeout-minutes` of 15, a step that runs `scripts/list-core-specs.js`, `NODE_ENV: test`, no `E2E_STAGING_BASE_URL`, and an upload of the report; the `Playwright E2E smoke tests` job still has exactly one `continue-on-error: true` and still runs `npm run test:e2e`; `playwright-spec-coverage.yml` has `pull_request` with `paths` listing only its own workflow and script, `workflow_dispatch`, no `push` and no `schedule`, a `timeout-minutes` of at most 60, and the pinned `c8` version.
- **E2E (CI).** The measurement run (AC2), then `Core browser tests` twice on one commit (AC8), plus the fixed specs from AC7 in the all-specs job.

## Out of scope for this plan

Folding journeys into Scenario A or B; the ruleset change; retiring specs; production behaviour.
