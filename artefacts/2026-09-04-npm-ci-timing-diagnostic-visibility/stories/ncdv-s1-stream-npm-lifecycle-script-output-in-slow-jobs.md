# Story: Stream npm lifecycle-script output in the two slow staging-deploy.yml jobs

**Slug:** ncdv-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-04

---

## Problem

While verifying `cpco-s1` (CI install/cache optimization) on its own first real `staging-deploy.yml` run, `deploy-staging` and `post-deploy-e2e-confirm`'s own `npm ci` steps each took 6-7 minutes with zero log output during that entire window -- no per-package progress, no errors, nothing between one deprecation warning and the final `added 235 packages in Nm` line. The third job in the same run (`smoke-test`), sharing the identical `package-lock.json` and reporting the identical npm-cache hit, completed in 50 seconds.

A follow-up investigation found `bcrypt` is the only compiled/native dependency in this repo's own `package-lock.json` (`hasInstallScript: true`, `"install": "node-gyp-build"`) -- a plausible candidate, since native-module install scripts run on every `npm ci` regardless of npm's own tarball cache, and two of the three observed durations landed on the exact same duration to the second (7m01s, twice), which is more consistent with a deterministic fallback/timeout path than random network jitter. However, direct local inspection found `bcrypt` ships a matching prebuilt Linux binary (`node_modules/bcrypt/prebuilds/linux-x64/bcrypt.glibc.node`) inside its own package, which `node-gyp-build` should resolve near-instantly on a standard glibc-based `ubuntu-latest` runner with no compilation or extra network fetch needed -- in tension with the "falls back to compiling from source" theory. `bcrypt` is plausible but not yet confirmed as the cause.

Today's log output cannot resolve this either way, because `npm`'s own default behaviour buffers/suppresses lifecycle-script (`preinstall`/`install`/`postinstall`) output unless explicitly asked to stream it in real time.

## As a / I want / So that

As the operator investigating this repo's own CI install-time variance
I want the two affected jobs' `npm ci` output to stream lifecycle-script activity in real time
So that the next real occurrence of this slowness produces a log that actually shows what npm is doing during the silent window, instead of another unexplained gap

## Acceptance Criteria

- **AC1:** `deploy-staging` and `post-deploy-e2e-confirm`'s own `npm ci` steps in `.github/workflows/staging-deploy.yml` pass `--foreground-scripts` (npm's own documented flag for streaming lifecycle-script stdout/stderr to the parent process's own output in real time, rather than buffering it).
- **AC2:** No other behavioural change -- `--foreground-scripts` only affects log visibility, not install outcome, timing, or exit codes; the existing `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` env and `cache: 'npm'` settings (from `cpco-s1`) are untouched.
- **AC3 (regression guard):** `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js`, `tests/check-bri-s2.6-smoke-test-promote-gate.js`, `tests/check-sdsb-s1-staging-deploy-paths-ignore.js`, and `tests/check-cpco-s1-playwright-download-skip-and-cache.js` all still pass unmodified.
- **AC4 (real-world, RISK-ACCEPTed):** the next real `staging-deploy.yml` run that hits the slow pattern again produces log output during the previously-silent window, confirming or ruling out `bcrypt`'s own postinstall as the cause -- cannot be verified locally or on this PR's own CI (which is fast today), only on a future real occurrence.

## Out of scope

- Any fix for the slowness itself -- this story is diagnostic-visibility only. A real fix (e.g. caching `node_modules/bcrypt`'s own prebuild resolution, pinning a different `bcrypt` version, or something else entirely) is explicitly deferred until the next real occurrence's log confirms the actual mechanism.
- `pr-checks.yml`, `e2e.yml`, `bri-s3.4-cross-tenant-repeat-gate.yml`, `archive-session-turns.yml` -- none of these have shown the slow pattern; only `staging-deploy.yml`'s `deploy-staging` and `post-deploy-e2e-confirm` jobs have.

## Benefit linkage

Closes an observability gap that is directly blocking root-cause diagnosis of a real, evidenced CI-timing anomaly -- the next occurrence will finally produce actionable log data instead of another silent multi-minute gap. No formal benefit-metric artefact -- short-track story.
