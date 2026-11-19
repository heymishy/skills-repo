## Test Plan: The Playwright install in CI no longer downloads Ubuntu packages, so it takes seconds on every runner

**Story reference:** artefacts/2026-11-20-ci-speed/stories/pwi-s1-playwright-install-without-apt.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-pwi-s1-playwright-install-without-apt.js`, plain Node, reads workflow files only, no network.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No `--with-deps` or `install-deps` on a non-comment line in the five in-scope workflows | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | No apt cache path or key on a non-comment line in the five | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Exactly eight `npx playwright install chromium` steps, each with the same step name | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | `ppc-capture-worker.yml` still uses `--with-deps` | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Guardrail text no longer recommends `--with-deps` for CI and gives the reason | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | The PR's own CI passes and the install step is under 60 s on both Azure and AWS runners | - | - | - | 1 (M1) | Needs a real runner | 🟡 |

## Red-first plan

T1, T2, T3 (the count is 8 only after the change if the current text is matched exactly; today the steps read `--with-deps`), and T5 fail before the change. T4 passes before and after by design: it pins a scope decision, so it is checked to fail only if `--with-deps` is removed from `ppc-capture-worker.yml` (verified by temporarily editing a copy in the test's own fixture, not the real file).

Comment lines are excluded from T1 and T2 (the replacement comments explain the change and necessarily mention `--with-deps`).

## Manual step (AC6)

After the pull request's checks finish, the DoD records the run id of the E2E and staging jobs, the cloud each ran on (from the log header, "Cloud:"), and the install-step duration. If every sampled job landed on Azure, re-run the failed-or-passing jobs until at least one AWS-hosted run is recorded, or say plainly in the DoD that no AWS sample was obtained. Rollback is reverting the pull request.
