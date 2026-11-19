# pwi-s1 Definition of Done

Date: 2026-11-20. Story: the Playwright install in CI no longer downloads Ubuntu packages, so it takes seconds on every runner. Pull request #1163 merged 2026-11-20 (`fc1c0fc54`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | no `--with-deps` or `install-deps` on a non-comment line in the five in-scope workflows. Evidence: T1 in `tests/check-pwi-s1-playwright-install-without-apt.js` | automated | none |
| AC2 | ✅ | no apt cache path or key in the five. Evidence: T2 | automated | none |
| AC3 | ✅ | exactly eight `npx playwright install chromium` steps, each still named "Install Playwright browsers (Chromium only)". Evidence: T3 | automated | none |
| AC4 | ✅ | `ppc-capture-worker.yml` still installs with `--with-deps`. Evidence: T4 | automated | none |
| AC5 | ✅ | the guardrail no longer recommends `--with-deps` for CI, and says why. Evidence: T5 | automated | none |
| AC6 | ✅ | the pull request's own CI passes, and the install step is under 60 s on both an Azure-hosted and an AWS-hosted runner. Evidence: see the table below | manual (CI evidence) | none |

Red first: 17 of 20 assertions failed before the change; the 3 that passed included T4, which pins a scope decision and passes by design. All 20 pass after. The 43 existing test files that read the edited workflows and the guardrails file pass, and all five workflows parse as YAML.

## AC6 evidence (install step, from the job logs of pull request #1163's checks)

| Run | Job | Runner | Install step | Result |
|---|---|---|---|---|
| 44580666379 | Scenario A E2E | AWS us-west-2 | 1 s | pass |
| 44580666379 | Playwright E2E smoke | AWS us-west-2 | 0 s | pass |
| 44580666002 | Core browser tests | AWS us-west-2 | 1 s | pass |
| 44580666379 | Scenario B E2E | Azure westus | 0 s | pass |
| 44580665642 | Cross-tenant 20x repeat | Azure northcentralus | 0 s | pass |
| 44580666461 | Per-spec server coverage | Azure eastus2 | 11 s | pass |

Before the change the median was 212 s on AWS-hosted runners and 16 s on Azure-hosted ones (`artefacts/2026-11-20-ci-speed/reference/ci-performance-measurement-2026-11-20.md`). A before-and-after pair on the same day: pull request #1164's branch was cut before this merged, so its CI still ran `--with-deps`, and its Scenario B job spent 279 s in the install step on AWS us-west-2 (run 44581765692), against 0 to 1 s on AWS us-west-2 here. Every job passed, so no runner image was missing a library Chromium needs.

## Observations and follow-ups

- **Every sample was a browser-cache hit.** On a cache miss (any change to `package-lock.json`, which changes the key), `npx playwright install chromium` downloads the browser from Playwright's own CDN; that path was not measured and no longer touches Ubuntu's mirrors.
- **Whole-job percentiles are not yet re-measured.** The 90th percentiles in the reference document (for example Scenario B 6.9 min, Core browser 6.8 min) should be recomputed after about a week of runs, to confirm the gap between median and p90 has closed.
- **The two staging-deploy install steps** (smoke test and post-deploy confirmation) were not sampled at the time of writing; the Staging Deploy run for the merge was still in progress. They use the identical command.
- **Fonts.** Test jobs no longer install CJK and other fonts. No test compares screenshots, but a failure screenshot attached to a run may show missing glyphs for non-Latin text. Accepted at DoR (W1).
- **`ppc-capture-worker.yml` is unchanged** by design (decision D2): its screenshots and videos are user-facing.
- **Next in this feature:** `utp-s1` (isolate the heaviest unit tests) and `dgn-s1` (diagnose the 92 s staging purge step and the E2E smoke tail). The cleanup-script gap found during `vdp-s2` (the purge script swallows a foreign key error) belongs with `dgn-s1`.

## Scope Deviations

- None.
