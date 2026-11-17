## Test Plan: The local Playwright suite becomes a trustworthy, measured, non-blocking signal

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s1-make-the-local-playwright-suite-trustworthy.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. The browser specs run separately with `npm run test:e2e` (Playwright). New files: `tests/check-lpw-s1-fake-db-journeys.js`, `tests/check-lpw-s1-first-login-fake-db.js`, `tests/check-lpw-s1-playwright-job.js`, `tests/check-lpw-s1-summarise-report.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fake database answers the journey and stage queries | 1 (T1) | - | 8 existing specs | - | - | 🟡 |
| AC2 | First sign-in goes to `/welcome`, second to `/dashboard` | 1 (T2) | boot probe | `bri-s3.6` AC1 | - | - | 🟢 |
| AC3 | Stub secret reaches server and tests | 1 (T3) | - | `b1`, `dsh-s4` | - | - | 🟢 |
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
- **T2 (AC2).** The fake database supports `github_first_login`: a new identity has no row so the adapter reports first login; after the flag is cleared the adapter reports not first. A boot probe (child process, `NODE_ENV=test`, no database URL) shows the server's flags adapter is wired to it (two different identities, two different outcomes). Fails today (no adapter wired in test mode, everyone returning).
- **T3 (AC3, AC6, AC7, workflow text).** The `e2e` job in `e2e.yml`: keeps its name `Playwright E2E smoke tests`; has `continue-on-error`; `timeout-minutes` is 30; generates a per-run stub secret with `::add-mask::` and exports `E2E_STAGING_AUTH_STUB_SECRET` to the server and test step; uploads `pw-report.json`; runs the coverage step with a pinned `c8` version and `NODE_V8_COVERAGE`; and `context.yml` has `e2e_tests: true`. The job is not in the ruleset's required list in the repo (it is not named in any workflow `needs` chain used for promotion).
- **T4 (AC4).** No file in `tests/e2e/` contains the literal `localhost:3000` as an expected URL; the four named specs (`artefact-read`, `feature-navigation`, `wuce20`, `wuce23`) build the expected URL from the configured base URL; the three specs with the `nav` locator use a locator that resolves to one element; the focus-walk check in `csd-s2` records element identity.
- **T5 (AC6).** `scripts/summarise-playwright-report.js` turns a small Playwright JSON fixture into a Markdown table (spec, passed, failed, skipped, seconds), sorted failures first, and tolerates an empty report.
- **E2E (the suite itself, run in the CI job).** The 8 specs for AC1, `bri-s3.6` AC1, `b1` and `dsh-s4`, the 9 tests for AC4 and `frsr-s1` pass. Recorded per test in the evidence.

## Out of scope for this plan

Kanban board, model-session and pod groups (measured only), and the capability matrix.
