# CI and test performance measurement, 2026-11-20

Measured from GitHub Actions run history for the last week (runs from 2026-11-12 to 2026-11-19), read-only. Job and step timings come from the Actions jobs API; per-test-file timings come from the `test-results.json` artefact that every PR Checks run uploads.

## Job timings (median / 90th percentile)

| Job | Median | p90 |
|---|---|---|
| PR Checks (lint, typecheck, test, build) | 3.1 min | 3.4 min |
| E2E: Playwright smoke | 6.5 min | 15.6 min |
| E2E: Scenario A | 4.3 min | 9.3 min |
| E2E: Scenario B | 1.9 min | 6.9 min |
| Core browser tests | 1.9 min | 6.8 min |
| Staging smoke (@mocked) | 4.2 min | 10.1 min |
| Post-deploy real-staging confirmation | 3.2 min | 8.1 min |

Queue time is about 2 seconds for every job, so runner capacity is not a constraint.

## Finding 1: the Playwright install is slow on AWS-hosted runners

80 sampled jobs, step "Install Playwright browsers (Chromium only)":

| Runner cloud | Samples | Median | p90 |
|---|---|---|---|
| Azure | 37 | 16 s | 21 s |
| AWS | 43 | 212 s | 478 s |

The browser binary cache hits in both. The time is in `--with-deps`, which runs `apt-get`. In the slowest sampled run (44358650175, AWS us-east-1) the package index update took 7 seconds, then 32.1 MB of packages took 7 min 26 s from `us-east-2.ec2.archive.ubuntu.com` at 71.9 kB/s, with single packages stalling for 2 to 3 minutes. In a fast run (44250404593, Azure eastus) the same 32.1 MB came from `azure.archive.ubuntu.com` in under a second.

What `--with-deps` installs, identical in every sampled job: 9 newly installed packages, all fonts (`fonts-ipafont-gothic`, `fonts-freefont-ttf`, `fonts-tlwg-loma-otf`, `fonts-unifont`, `fonts-wqy-zenhei`, `xfonts-encodings`, `xfonts-utils`, `xfonts-cyrillic`, `xfonts-scalable`), and 4 upgraded Mesa libraries that are already present. Chromium's shared libraries are already on the `ubuntu-24.04` image.

The existing apt cache (`rcfx-s1`, key `Linux-apt-playwright-deps-v1`) restores but does not help: the key never changes, so the saved `.deb` files are a stale snapshot, and the apt step still downloads all 14 packages in both clouds. Saves fail with "Unable to reserve cache". No test in the repo compares screenshots.

## Finding 2: the unit chain runs two test files at a time

910 test files, 182 s wall time, 341 s summed test time, so about 1.9x parallelism. `scripts/run-all-tests.js` sets the pool to `ceil(cpus / 3)`, which is 2 on a public 4-vCPU runner; this was set deliberately to stop timing flakes in `check-cat-s1-core-trace-builder.js` and `check-rb-s3-harness-agnostic-instructions.js`. The five exclusive-phase files take 20 s. The slowest files: `check-p3.5-validate-trace.js` 33.8 s, `check-pcr-s1-test-runner.js` 21.1 s, `check-ccb-s1-continue-bound.js` 20.3 s, `check-coha-s5-error-capture.js` 16.7 s, `check-alrf-s11-purge-e2e-tenants.js` 12.2 s. The 20 slowest files are 53% of summed time; 861 of 910 files take under a second.

## Finding 3: not yet explained

- The "Purge e2e-test- tenants created by this run" step takes a flat 92 s in both staging-deploy jobs (median 92 s, p90 92 s, max 93 s).
- E2E smoke "Run E2E tests" has median 165 s and p90 887 s.

## Reliability

PR Checks: 20 of 100 runs failed across 16 branches; 9 of those branches were fixed by a new commit, so the gate caught real defects. The `check-p4-enf-second-line.js` and `check-p3.5-validate-trace.js` cluster was one branch (`feat/lpw-s3-board-advance-works`) failing three times. E2E: 11 failed runs across 6 branches. Few failures look like flakes (1 E2E branch and 2 core-browser branches went green on a re-run, matched by branch, not by commit). Staging Deploy's median of about 70 hours is time spent waiting for production approval, and 75 of 99 runs were cancelled by the `cancel-superseded` job, by design.
