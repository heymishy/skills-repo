## Test Plan: Install dependencies before the staging-deploy seed step

**Story reference:** artefacts/2026-07-25-staging-deploy-seed-fix/stories/dsds-s1-install-deps-before-seed-step.md

## AC Coverage

| AC | Description | Verification | Gap type | Risk |
|----|-------------|--------------|----------|------|
| AC1 | Set up Node.js + npm ci steps present, correctly ordered | Static YAML check | — | 🟢 |
| AC2 | Real CI re-run no longer fails with "Cannot find module 'pg'" | Live re-run of the actual GitHub Actions job | — | 🟢 |

## Verification

### workflowYamlHasNodeSetupAndInstallBeforeSeed
- **Verifies:** AC1
- **Action:** Parse `.github/workflows/staging-deploy.yml`, confirm `deploy-staging` job's step list order: checkout, setup-flyctl, Deploy to wuce-staging, Set up Node.js, Install dependencies, Seed staging database
- **Expected result:** Steps present in that exact order

### realCiReRunNoLongerFailsOnMissingPgModule
- **Verifies:** AC2
- **Action:** Push this fix to master, then re-run the resulting `Staging Deploy` job (or a subsequent push's own run)
- **Expected result:** `Seed staging database` step succeeds (assuming `STAGING_DATABASE_URL` is also set) -- no `Cannot find module 'pg'` error

## Out of Scope for This Test Plan

- Testing `seed-staging.js`'s own idempotency/seeding logic -- pre-existing, covered by `tests/check-bri-s2.4-anonymized-seed-script.js`, unchanged by this story.
