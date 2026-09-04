# Test Plan: Stream npm lifecycle-script output in the two slow staging-deploy.yml jobs

**Story reference:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/stories/ncdv-s1-stream-npm-lifecycle-script-output-in-slow-jobs.md
**Date:** 2026-09-04

---

## Test approach

AC1-AC3 are static YAML-shape assertions, testable locally. AC4 (does the next real slow occurrence actually produce useful log output) cannot be verified until it happens again -- RISK-ACCEPTed with manual post-merge observation, matching this repo's own established precedent for GitHub-native-behaviour-dependent ACs.

## Tests

| # | AC | Test | Type |
|---|----|------|------|
| T1 | AC1 | `deploy-staging`'s own `npm ci` step includes `--foreground-scripts` | Automated (new) |
| T2 | AC1 | `post-deploy-e2e-confirm`'s own `npm ci` step includes `--foreground-scripts` | Automated (new) |
| T3 | AC2 (regression) | `smoke-test`'s own `npm ci` step does NOT gain `--foreground-scripts` (out of scope -- it's already fast, no diagnostic need) | Automated (new) |
| T4 | AC2 (regression) | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` env and `cache: 'npm'` settings on both affected jobs are unchanged from `cpco-s1`'s own already-merged state | Automated (new) |
| T5 | AC3 | `check-bri-s2.5-ci-pipeline-staging-deploy.js` passes unmodified | Automated (existing, regression) |
| T6 | AC3 | `check-bri-s2.6-smoke-test-promote-gate.js` passes unmodified | Automated (existing, regression) |
| T7 | AC3 | `check-sdsb-s1-staging-deploy-paths-ignore.js` passes unmodified | Automated (existing, regression) |
| T8 | AC3 | `check-cpco-s1-playwright-download-skip-and-cache.js` passes unmodified | Automated (existing, regression) |
| T9 | AC4 | Manual: watch the next several real `staging-deploy.yml` runs; if the slow pattern recurs, read the now-streamed log for the previously-silent window | Manual (verification script) |

**Total logical tests:** 9 (T1-T9).

## Gaps

The actual root cause (AC4) cannot be confirmed until the slow pattern happens again for real -- this story's own scope is limited to making that future occurrence diagnosable, not to fixing or reproducing the slowness on demand.
