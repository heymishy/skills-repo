## Story: The Playwright install in CI no longer downloads Ubuntu packages, so it takes seconds on every runner

**Epic reference:** None - short-track (CI speed)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-20-ci-speed/reference/ci-performance-measurement-2026-11-20.md` finding 1. The install step has a median of 16 s on Azure runners and 212 s on AWS runners (p90 478 s); 54% of sampled jobs ran on AWS. The time is the `apt-get` that `--with-deps` runs, fetching 32.1 MB of fonts from an AWS mirror at about 72 kB/s.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci]

## User Story

As **the operator who waits on pull request checks**,
I want **the browser install step in CI to stop depending on Ubuntu's package mirrors**,
So that **E2E, core browser and staging jobs finish in the same time on every runner instead of taking up to 8 minutes longer when GitHub places them on AWS**.

## Benefit Linkage

**Metric moved:** the 90th percentile of the install step falls from 478 s to under 60 s, which removes most of the gap between each browser job's median and its p90 (for example Scenario B 1.9 min median against 6.9 min p90).
**How:** `npx playwright install --with-deps chromium` becomes `npx playwright install chromium` in the eight test-only install steps. `--with-deps` adds only nine font packages and upgrades four Mesa libraries that are already installed; Chromium's own shared libraries are already on the `ubuntu-24.04` image. The apt cache steps (`rcfx-s1`) are removed because they never prevented the download.

## Architecture Constraints

- Change confined to `.github/workflows/e2e.yml` (3 install steps), `core-browser-tests.yml` (1), `staging-deploy.yml` (2), `bri-s3.4-cross-tenant-repeat-gate.yml` (1), `playwright-spec-coverage.yml` (1), one sentence in `.github/architecture-guardrails.md` (line 1251), one new test and artefacts. Workflow changes go through a pull request.
- `.github/workflows/ppc-capture-worker.yml` is NOT changed. It renders the screenshots and videos users see as playback evidence, so the fonts that `--with-deps` installs can change its output. A test pins that it keeps `--with-deps`.
- The browser binary cache (`~/.cache/ms-playwright`) and the Playwright version are unchanged. `npx playwright install chromium` is a no-op on a cache hit.
- Do not add `if:` conditions or change `continue-on-error`; `tests/check-a5-ci-gate-config.js` and the b2 check count `continue-on-error` in `e2e.yml`.
- No new third-party action is introduced.

## Dependencies

- **Upstream:** rcfx-s1 (introduced the apt cache steps being removed).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given the five in-scope workflow files (`e2e.yml`, `core-browser-tests.yml`, `staging-deploy.yml`, `bri-s3.4-cross-tenant-repeat-gate.yml`, `playwright-spec-coverage.yml`), When their non-comment lines are read, Then none contains `--with-deps` or `install-deps`.
**AC2:** Given the same five files, When their non-comment lines are read, Then none references `/var/cache/apt` or `apt-playwright-deps`.
**AC3:** Given the same five files, When they are read, Then there are exactly eight `npx playwright install chromium` steps (3 in `e2e.yml`, 1 in `core-browser-tests.yml`, 2 in `staging-deploy.yml`, 1 in the repeat gate, 1 in `playwright-spec-coverage.yml`), each still named "Install Playwright browsers (Chromium only)".
**AC4:** Given `ppc-capture-worker.yml`, When it is read, Then it still installs with `--with-deps`.
**AC5:** Given `.github/architecture-guardrails.md`, When the Playwright devDependency rule is read, Then it no longer recommends `--with-deps` for CI and says why.
**AC6 (manual, recorded in the DoD):** Given this pull request's own CI run, When the E2E, core browser and staging smoke jobs run, Then they pass, and the install step takes under 60 s on both an Azure-hosted and an AWS-hosted runner (the DoD cites run ids and the cloud of each).

## Out of Scope

- `ppc-capture-worker.yml` (see constraints).
- Making `--with-deps` work faster by fixing the apt cache or changing the apt mirror. Dropping the apt dependency is simpler and removes the failure mode.
- The unit chain speed (next story) and the 92 s purge step and the E2E smoke tail (third story).

## NFRs

- **Reliability:** if a runner image ever lacks a library Chromium needs, the browser launch fails loudly with a "shared libraries" error in the first test step, not silently. The fix is then a one-line `install-deps` for that library. Noted in `decisions.md`.
- **Security:** no new action, secret or permission.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
