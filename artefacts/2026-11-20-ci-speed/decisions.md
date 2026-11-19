# Decisions: CI and test speed

## D1. Drop `--with-deps` from test-only Playwright installs instead of fixing the apt cache (2026-11-20)

**Context:** the install step takes a median of 212 s on AWS-hosted runners and 16 s on Azure-hosted ones, because `--with-deps` downloads 32.1 MB of fonts from a mirror that serves about 72 kB/s on AWS.
**Decision:** run `npx playwright install chromium` without `--with-deps` in the eight test-only install steps, and remove the apt cache steps.
**Rationale:** `--with-deps` installs only nine font packages and upgrades four Mesa libraries that are already present; Chromium's shared libraries are already on the `ubuntu-24.04` image. The `rcfx-s1` apt cache never prevented the download (fixed key, so stale `.deb` files; saves fail to reserve). Fixing the cache would keep a network dependency that fails slowly; removing the dependency removes the failure mode.
**Alternatives rejected:** a self-refreshing apt cache keyed by week (more moving parts, still downloads weekly); the `mcr.microsoft.com/playwright` container (large change to jobs that start their own Postgres and server); pointing apt at another mirror (cloud-specific, brittle).
**Revisit if:** a runner image drops a library Chromium needs. The failure is loud (shared-library error at browser launch), and the fix is `npx playwright install-deps <library>` for that one library.

## D2. `ppc-capture-worker.yml` keeps `--with-deps` (2026-11-20)

**Context:** that workflow renders the screenshots and videos shown to users as playback evidence.
**Decision:** leave it unchanged and pin that with a test (T4).
**Rationale:** the fonts it installs can change what users see; the speed gain there is not worth a visible change. It is dispatched on demand, not run on every pull request.

## D3. Three stories, one at a time, in this order (2026-11-20)

1. `pwi-s1` Playwright install (this one): largest saving, smallest change.
2. `utp-s1` unit chain: isolate the heaviest test files in a parallel job, then reconsider the pool size.
3. `dgn-s1` diagnose the 92 s staging purge step and the E2E smoke tail before changing them.

## Delivery log: pwi-s1 (2026-11-20)

**Change:** `npx playwright install --with-deps chromium` became `npx playwright install chromium` in 8 install steps (e2e.yml 3, core-browser-tests.yml 1, staging-deploy.yml 2, bri-s3.4-cross-tenant-repeat-gate.yml 1, playwright-spec-coverage.yml 1). 7 "Cache apt packages for Playwright browser deps" steps and their rcfx-s1 comments were removed; one pwi-s1 comment per file at the first install step explains why. `.github/architecture-guardrails.md` rule 3 now says not to use `--with-deps` in test-only CI jobs and why. 6 files changed, 24 lines added, 88 removed. Browser cache steps, `if:` conditions, `continue-on-error`, permissions and job order are unchanged; every file keeps its CRLF line endings (0 bare-LF lines).

**Test:** `tests/check-pwi-s1-playwright-install-without-apt.js` (T1 to T5, 20 assertions). Red first: 3 passed, 17 failed before the change (T4 passes by design because it pins the capture worker keeping `--with-deps`); 20 passed, 0 failed after. T1 and T2 ignore comment lines.

**Regression check:** the 43 existing `tests/check-*.js` files that mention any edited workflow (or the guardrails file) all pass; all five workflows parse as YAML and contain 8 install steps with no `--with-deps` in total.

**Not yet verified (AC6):** that the install step is under 60 s on both an Azure-hosted and an AWS-hosted runner. This needs the pull request's own CI run and, because GitHub picks the cloud, possibly re-runs. To be recorded in the DoD with run ids and the "Cloud:" line of each log.

**Scope note:** the same-named failure mode exists in `ppc-capture-worker.yml` (on-demand, user-facing output). It is deliberately unchanged (D2).
