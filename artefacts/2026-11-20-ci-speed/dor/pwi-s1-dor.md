## Definition of Ready: The Playwright install in CI no longer downloads Ubuntu packages, so it takes seconds on every runner

**Story reference:** artefacts/2026-11-20-ci-speed/stories/pwi-s1-playwright-install-without-apt.md
**Test plan reference:** artefacts/2026-11-20-ci-speed/test-plans/pwi-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `.github/workflows/e2e.yml`, `core-browser-tests.yml`, `staging-deploy.yml`, `bri-s3.4-cross-tenant-repeat-gate.yml`, `playwright-spec-coverage.yml` (AC1 to AC3): replace `npx playwright install --with-deps chromium` with `npx playwright install chromium`; remove the "Cache apt packages for Playwright browser deps" steps and the `rcfx-s1` comments that explain them; add one short comment per file saying why `--with-deps` is not used.
- `.github/architecture-guardrails.md` line 1251 (AC5): drop `--with-deps` from the CI example and add the reason.
- `tests/check-pwi-s1-playwright-install-without-apt.js` (T1 to T5).
- `decisions.md` and a DoD.
- Not built: no change to `ppc-capture-worker.yml`, no new action, no apt mirror change, no container image, no change to the browser cache steps.

## Contract Review
Contract review passed. Every acceptance criterion maps to a named test or the manual step; no workflow file is both required by a test and excluded by the contract. `ppc-capture-worker.yml` is excluded and T4 asserts it is unchanged, so the exclusion has a test.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Workflow changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who waits on pull request checks |
| H2 | At least 3 ACs in Given / When / Then | Pass | 6 ACs |
| H3 | Every AC has a test | Pass | AC6 is a recorded manual step |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no CSS-layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | Fonts for CJK and other scripts are no longer installed in the test jobs. No test compares screenshots (one comment in `tests/e2e/csd-s1-data-model-diagram.spec.js` says so explicitly), so test results do not depend on fonts. Failure screenshots uploaded as artefacts may show missing glyphs for non-Latin text; accepted. |
| W2 | Accepted | The four Mesa libraries are no longer upgraded to the mirror's newest version; the image's own versions are used. Verified only by the PR's own CI run (AC6). If a launch fails with a shared-library error, the fix is a one-line targeted `install-deps` for that library. |
| W3 | Accepted | AC6 needs an AWS-hosted run to prove the improvement; GitHub chooses the cloud, so the DoD may need re-runs to get a sample. |

## Oversight level
**Low** - CI configuration only; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-ci-speed/stories/pwi-s1-playwright-install-without-apt.md
Test plan: artefacts/2026-11-20-ci-speed/test-plans/pwi-s1-test-plan.md
Goal: write tests/check-pwi-s1-playwright-install-without-apt.js first and confirm T1, T2, T3 and T5 fail; then edit the five workflows and the guardrail line.
Constraints:
- Do not touch ppc-capture-worker.yml.
- Keep the browser cache steps (~/.cache/ms-playwright) exactly as they are.
- Do not change continue-on-error, if:, permissions or job order in any workflow.
- Preserve each file's existing line endings (check with the file bytes before and after).
- Check the absolute path contains .worktrees/pwi-s1/ before every edit.
```
