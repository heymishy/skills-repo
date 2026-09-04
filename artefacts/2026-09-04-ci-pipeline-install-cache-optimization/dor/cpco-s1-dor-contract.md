# DoR Contract: CI jobs skip unneeded Playwright browser downloads and cache the browsers they do need

**Story reference:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/stories/cpco-s1-skip-unneeded-playwright-downloads-and-cache-browsers.md
**Test plan:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/test-plans/cpco-s1-test-plan.md
**Date:** 2026-09-04

---

## Scope

**MUST touch:**
- `.github/workflows/staging-deploy.yml` (3 `npm ci` steps get `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`; `smoke-test` and `post-deploy-e2e-confirm` get a cache step before their `playwright install`; `post-deploy-e2e-confirm`'s `setup-node` gets `cache: 'npm'`)
- `.github/workflows/e2e.yml` (3 jobs: `npm ci` env, cache step before `playwright install`, `cache: 'npm'` on `setup-node`)
- `.github/workflows/bri-s3.4-cross-tenant-repeat-gate.yml` (same 3 changes, 1 job)
- `.github/workflows/pr-checks.yml` (`npm ci` env only -- this job never runs Playwright, already has `cache: 'npm'`)
- `.github/workflows/archive-session-turns.yml` (`npm ci` env, plus `cache: 'npm'` -- never runs Playwright)
- `tests/check-cpco-s1-playwright-download-skip-and-cache.js` (new)

**MUST NOT touch:**
- `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js`, `tests/check-bri-s2.6-smoke-test-promote-gate.js`, `tests/check-sdsb-s1-staging-deploy-paths-ignore.js` -- confirmed by direct grep that none of the three reference `npm ci`, `playwright install`, or `env` blocks anywhere in their own assertions; zero risk of collision.
- Any job body logic beyond the install/cache steps named above -- no test execution logic, no deploy logic, no smoke-test assertion logic changes.
- The 8 workflow files that never run `npm ci` at all (already confirmed fast per the deep-dive; out of scope per the story's own scope section).

## Assumptions verified before sign-off

1. **`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` is the correct, officially-documented Playwright env var** to suppress the postinstall browser download without needing `--ignore-scripts` (which would also break other packages' legitimate postinstall hooks) -- confirmed against Playwright's own documented CI-environment-variable behaviour.
2. **The three existing regression-guard test files have zero assertions that would collide with this story's changes** -- confirmed directly via grep (`npm ci`, `playwright install`, `env` all produce zero matches across all three files).
3. **`package.json` and `package-lock.json` both exist and are the correct source for the Playwright-version cache key** -- confirmed present at repo root; `actions/cache`'s `hashFiles('package-lock.json')` is the standard, already-idiomatic GitHub Actions pattern for this.
4. **`~/.cache/ms-playwright` is the correct default Playwright browser cache path on the `ubuntu-latest` runners this repo uses** (confirmed via `runs-on: ubuntu-latest` on every affected job) -- Playwright's own documented default `PLAYWRIGHT_BROWSERS_PATH` location on Linux.
5. **`deploy-staging`'s own `npm ci` (line ~115) exists solely to install `pg` for the seed-staging step, confirmed by reading the job in full** -- it never touches Playwright and does not need a cache step before any `playwright install`, since it never runs one.

## Risk

**Rating: 2** (mechanical, low-behavioural-risk change across many files; the one real risk is a typo/YAML-shape mistake across 5 files x up to 3 edits each -- mitigated by the new automated test file covering every call site individually, and by AC5's full regression-guard run).

**RISK-ACCEPT:** AC4/AC6 (real cache-hit behaviour and actual duration improvement) cannot be verified by a local automated test -- accepted via the manual verification script (T7), consistent with the `sdsb-s1`/CLAUDE.md B2 precedent. Logged in this feature's own `decisions.md`.

## Coding Agent Instructions

1. Apply the three mechanical changes (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` env, cache step, `cache: 'npm'`) to each of the 5 named workflow files, per the exact call-site list in AC1-AC3.
2. Write `tests/check-cpco-s1-playwright-download-skip-and-cache.js` covering T1-T3, asserting on EVERY individual call site by name/line proximity, not just "at least one instance found" -- this story's whole point is completeness across all 9/6/6 call sites, so the test must be able to catch a single missed instance.
3. Run the three existing regression-guard suites directly to confirm T4-T6 pass unmodified.
4. Run the full suite (`npm test`) before considering the task complete -- standing practice this session.
5. TDD RED-state verification: stash all workflow-file changes, re-run the new test file, confirm it fails against pre-fix content, then restore.

## Proceed: Yes
