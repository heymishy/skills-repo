# Test Plan: CI jobs skip unneeded Playwright browser downloads and cache the browsers they do need

**Story reference:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/stories/cpco-s1-skip-unneeded-playwright-downloads-and-cache-browsers.md
**Date:** 2026-09-04

---

## Test approach

AC1-AC3 are static YAML-shape assertions, testable locally. AC4/AC6 are real GitHub Actions runtime behaviour (does the cache actually hit, does the install actually still work, does the duration actually drop) -- cannot be simulated locally, RISK-ACCEPTed with post-merge observation, matching the `sdsb-s1`/B2 precedent already established this session. AC5 is existing regression-guard suites run directly.

## Tests

| # | AC | Test | Type |
|---|----|------|------|
| T1 | AC1 | Every one of the 9 `npm ci` steps across the 5 named workflow files has `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'` in its step `env` | Automated (new) |
| T2 | AC2 | Every one of the 6 job instances that run `npx playwright install --with-deps chromium` has an `actions/cache` step immediately before it, targeting a Playwright browser cache path | Automated (new) |
| T3 | AC3 | Every `actions/setup-node` step across the 5 named workflow files has `cache: 'npm'` set | Automated (new) |
| T4 | AC5 | `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` full suite still passes unmodified | Automated (existing, regression) |
| T5 | AC5 | `tests/check-bri-s2.6-smoke-test-promote-gate.js` full suite still passes unmodified | Automated (existing, regression) |
| T6 | AC5 | `tests/check-sdsb-s1-staging-deploy-paths-ignore.js` full suite still passes unmodified | Automated (existing, regression) |
| T7 | AC4/AC6 | Manual: after merge, observe the next real CI run for a Playwright-needing job (e.g. `Scenario A E2E`) and confirm it still passes with Chromium correctly installed; separately observe a non-Playwright job's (e.g. `deploy-staging` or `Lint, typecheck, test, build`) install-step duration and compare against the pre-fix baseline (7m01s / 5m05s) | Manual (verification script) |

**Total logical tests:** 7 (T1-T7).

## Gaps

Real GitHub Actions cache-hit behaviour and actual install-duration improvement cannot be exercised in this local test environment. T7's manual verification is the closest available confirmation, matching this repo's own established precedent (`sdsb-s1`, CLAUDE.md B2) for GitHub-native-behaviour-dependent ACs.
