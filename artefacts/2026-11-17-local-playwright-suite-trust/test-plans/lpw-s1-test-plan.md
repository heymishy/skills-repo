## Test Plan: The local Playwright suite becomes a trustworthy, measured, non-blocking signal

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s1-make-the-local-playwright-suite-trustworthy.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. The browser specs run separately with `npm run test:e2e` (Playwright). New files: `tests/check-lpw-s1-fake-db-journeys.js`, `tests/check-lpw-s1-playwright-job.js`, `tests/check-lpw-s1-spec-text.js`, `tests/check-lpw-s1-summarise-report.js` (T2 was dropped: the first-login adapter was already wired in test mode).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fake database answers the journey and stage queries | 1 (T1) | - | 8 existing specs | - | - | 🟡 |
| AC2 | `bri-s3.6` AC1 result and cause recorded (no code change) | - | - | `bri-s3.6` in CI order | - | Measured only | 🟡 |
| AC3 | The six staging-targeted specs are excluded from the local suite | 1 (T3) | - | CI run (291 tests) | - | - | 🟢 |
| AC4 | Stale spec text fixed | 1 (T4) | - | 9 existing tests | - | - | 🟢 |
| AC5 | Repository fixture lets a product start a feature | - | - | `frsr-s1` plus 4 measured specs | - | - | 🟡 |
| AC6 | Job enabled, non-blocking, report and summary | 1 (T3, T5) | - | CI run | - | - | 🟢 |
| AC7 | Server coverage baseline reported | 1 (T3) | - | CI run | - | - | 🟡 |
| AC8 | Two consecutive CI runs recorded | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs two real CI runs | AC8 | Live-only | Run the pull request's CI twice on the same commit and record the per-test results in `decisions.md` |
| The 8 existing specs are the behavioural check for AC1; a unit test on the fake database alone would pass even if the specs still failed | AC1 | Wiring (D37 point 4) | The 8 specs must pass in the CI job, recorded in the evidence; T1 only guards the query shapes |

## Tests

- **T1 (AC1).** `createFakeTestDb()` answers the query shapes in `routes/journeys.js` for `customer_journeys` and `customer_journey_stages`: insert a journey returns an id; insert stages with positions; select the max position; select a journey by id and tenant; update a stage's name, position and coordinates; select stages ordered by position; the join selects (`cjs JOIN cj`); the list with stage counts; persona update. A second tenant cannot read the first tenant's journey. Fails today ("unhandled query", empty rows).
- **T2 (dropped).** Planned as a first-login test against the fake database. Reading the code showed the test server already wires a first-login adapter (`server.js`, bri-s3.6), and `bri-s3.6` AC1 fails only after other specs have run on the same server (see the story's AC2). No test added; the result is recorded in `decisions.md`.
- **T3 (AC3, AC6, AC7, workflow text and config).** The `e2e` job in `e2e.yml`: keeps its name `Playwright E2E smoke tests`; has `continue-on-error`; `timeout-minutes` is 30; sets `E2E_LOCAL_SUITE: 'true'` and never `E2E_STAGING_BASE_URL`; `playwright.config.js` ignores exactly the specs that import the staging URL when that variable is set (compared against the files themselves), and the Scenario jobs do not set it; the run uses the JSON reporter and uploads `pw-report.json` with `always()`; the report summary and coverage summary steps are present; coverage runs a pinned `c8` through `npx` and `c8` is not in `package.json`; and `context.yml` has `e2e_tests: true`.
- **T4 (AC4).** No file in `tests/e2e/` contains the literal `localhost:3000` as an expected URL; the four named specs (`artefact-read`, `feature-navigation`, `wuce20`, `wuce23`) build the expected URL from the configured base URL; the three specs with the `nav` locator use a locator that resolves to one element; the focus-walk check in `csd-s2` records element identity.
- **T5 (AC6).** `scripts/summarise-playwright-report.js` turns a small Playwright JSON fixture into a Markdown table (spec, passed, failed, skipped, seconds), sorted failures first, and tolerates an empty report.
- **E2E (the suite itself, run in the CI job).** The 8 specs for AC1, `bri-s3.6` AC1, `b1` and `dsh-s4`, the 9 tests for AC4 and `frsr-s1` pass. Recorded per test in the evidence.

## Out of scope for this plan

Kanban board, model-session and pod groups (measured only), and the capability matrix.
