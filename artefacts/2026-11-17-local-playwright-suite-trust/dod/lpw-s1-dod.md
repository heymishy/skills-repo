# lpw-s1 Definition of Done

Date: 2026-11-17. Story: make the local Playwright suite a trustworthy, measured, non-blocking signal. PR #1138, merged to master on 2026-11-17 at 03:29 UTC (`8601ce643`). The change is test-environment code (fake test database, specs, Playwright config), one workflow job, one report script, four guard tests and the story's artefacts; no product code changed.

## Result: COMPLETE

AC1 to AC7 (Acceptance Criteria 1 to 7) were verified by 22 automated unit tests, local runs and CI before merge. AC8 (two CI runs on one commit) was observed live on the pull request and recorded in `evidence/ci-runs-1-and-2.md` and `decisions.md`.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | the eight journey specs read their CSRF token from `/customer-journeys`, opt out of default stages, and the fake database answers the journey queries (`check-lpw-s1-fake-db-journeys`, 6 tests); 15 of 17 tests pass locally | automated + local run | two tests (`ep1-s3-stage-panel-focus-management`, `jcx-s6` AC1) fail with new named product-side causes, recorded as the AC allows |
| AC2 | ✅ | result and cause of `bri-s3.6` AC1 recorded in `decisions.md`: passes alone, fails after earlier `bri-s3.x` specs because they share tenant `e2e-shared-org` | recorded | changed from "add first-login support" after the triage was checked in code; the adapter was already wired |
| AC3 | ✅ | `check-lpw-s1-playwright-job` (6 tests); `E2E_LOCAL_SUITE=true` makes `playwright.config.js` ignore the six staging-targeted specs (308 tests become 291); Scenario A and B unchanged and green | automated + CI | changed from "stub secret for the 429s" after finding the 429s came from real staging |
| AC4 | ✅ | `check-lpw-s1-spec-text` (5 tests); the 9 stale-text tests pass | automated | none |
| AC5 | ✅ | shared fixture `tests/e2e/fixtures/product-repo.js`; `pnfc-s1` 4 of 4 pass; `frsr-s1`, `ep3-s1`, `reference-upload`, `dsda-s1` outcomes recorded in `decisions.md` (stale or new named cause) | automated + recorded | none |
| AC6 | ✅ | `audit.e2e_tests: true`; job non-blocking with a 30-minute limit, JSON report artifact and per-spec summary (`check-lpw-s1-summarise-report`, 5 tests; job summary seen on both CI runs) | automated + CI | none |
| AC7 | ✅ | coverage for `src/web-ui` produced and uploaded on Linux CI; baseline 63.3% lines, 40.9% functions; summary says plainly when none is recorded | CI observed | route list of requests no browser test made moved to `lpw-s2`; coverage could not be proven on Windows (no SIGTERM to Node) |
| AC8 | ✅ | run 1: 208 passed, 58 failed, 25 skipped; run 2: 207, 59, 25; the same 58 tests fail in both; 1 flaky (`spdr-s2-metric1-timing`) | production-observed (CI) | none |

## Source Issue Closure

No source issue.

## Observations and follow-ups

- The trial run before this story had sent test traffic to shared staging (`wuce-staging.fly.dev`) from a pull request job, through the six staging-targeted specs. Fixed by AC3.
- The triage was wrong in places (first-login table, rate limit source, journey cause count); corrected in `decisions.md` before any story depended on it.
- 58 tests still fail deterministically across 29 spec files. They are the input to `lpw-s2`: kanban board, model sessions, pods, changed feature flows, order-dependent `bri-s3.6`, and singles.
- Every pull request now runs a non-blocking Playwright job that shows failures; it is not a required check.
- Coverage baseline for `lpw-s2` not to fall below: lines 63.3%, functions 40.9%, statements 63.3%, branches 57.8%.

## Scope Deviations

- T2 (first-login test) dropped: it would have asserted something already true.
- Stub secret for the local job dropped (the 429s were staging's).
- AC7 route-level list moved to `lpw-s2`.
- T4 and T5 tests were written alongside the fix, not before it (stated in the PR body); T1 and T3 were red first.
- `branch-complete` was recorded with plain `advance`, because the gate expects a JSON artefact (same as `bkn-s1`).
