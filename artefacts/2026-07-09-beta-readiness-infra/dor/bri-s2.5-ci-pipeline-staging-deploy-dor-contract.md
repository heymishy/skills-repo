# DoR Contract Proposal: Build the CI pipeline — PR checks through staging deploy

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.5-ci-pipeline-staging-deploy.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.5-ci-pipeline-staging-deploy-test-plan.md
**Date:** 2026-07-10

---

## What will be built

The existing `.github/workflows/fly-deploy.yml` (which today deploys straight to prod on push to `main`) is rewired so that: (1) every PR runs lint/typecheck/`npm test`/build, blocking merge on failure; (2) every merge to `main` auto-deploys to `wuce-staging` (never `wuce-prod`); (3) the seed script (S2.4) runs automatically as the next step in the same pipeline. A CI-native static-analysis check asserts no push-to-main-triggered workflow step deploys to `wuce-prod` outside the S2.6 promote job.

## What will NOT be built (explicit exclusions)

- No per-PR/feature-branch preview environments (per story Out of Scope) — one shared staging environment only
- No rollback automation (per story Out of Scope) — a documented manual rollback path is S2.6's scope
- No modification to `wuce-prod`'s deploy path — this story removes it from the automatic push-to-main flow entirely; any future prod deploy goes through S2.6's separate promote job
- No implementation of the promote job itself — that is S2.6's scope; this story only guarantees the automatic path never reaches prod

## AC → Test-approach table

| AC | Test approach |
|----|----------------|
| AC1 — PR runs lint/typecheck/test/build, merge blocked on failure | Unit: T1 (all 4 checks present in a `pull_request`-triggered workflow), T2 (`continue-on-error` not set on any of them). Manual: Scenario 1 — confirm GitHub branch protection lists these as required (External-dependency, partial) |
| AC2 — merge to main auto-deploys to `wuce-staging`, never `wuce-prod` | Unit: T3 (deploy job triggered by push to main only), T4 (`--app wuce-staging`, not `wuce-prod`). Manual: Scenario 2 |
| AC3 — seed script runs automatically as next step | Integration: IT1 (seed step immediately follows deploy step in the same job). Manual: Scenario 3 |
| AC4 — no push-to-main workflow deploys to `wuce-prod` outside S2.6's promote job | Unit: T5 (static scan for `--app wuce-prod` outside the allowlisted promote job), T6 (synthetic fixture proves the check actually detects a violation) |
| NFR-Security | Inspect staging deploy job's secret references for prod-only secrets (soft assertion pending a naming convention — see Assumptions) |

## Assumptions

- T5/T6's promote-job allowlist uses a documented job-id/name convention (e.g. `promote-to-prod`) established by S2.6; if S2.6 names the job differently, the allowlist string in this story's test is updated to match — the underlying check logic does not change.
- NFR2's "no prod secret accessible to staging deploy" assertion is a soft check pending an environment-prefixed secret naming convention (e.g. `STAGING_DATABASE_URL` vs `PROD_DATABASE_URL`); if no such convention exists by implementation time, the check instead asserts no literal prod connection value leaks into staging job logs — a runtime/manual concern rather than a purely static one.
- Today's `fly-deploy.yml` deploys with no explicit `--app` flag differentiation (relies on `fly.toml` in the working directory); this story introduces explicit `--app` targeting.

## Estimated touch points

- `.github/workflows/fly-deploy.yml` (modified) — or a renamed/restructured workflow reflecting the new staging-first flow
- `tests/` — new test file for T1–T6, IT1 (e.g. `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js`)
- GitHub repo Settings → branch protection rules (not a repo file — configured separately, covered by manual Scenario 1)

## Contract Review

Checked against the story's 4 ACs and the test plan's AC Coverage table — no mismatch found. AC4's static-analysis check (T5) is explicitly required to be "real" and not vacuous — T6's synthetic-fixture test proves this. No hard block from contract review.
