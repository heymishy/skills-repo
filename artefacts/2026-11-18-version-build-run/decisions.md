# Decisions: the build stamp names the build run (vbr-s1)

**2026-11-18 | DECISION | Record the build run, not a test verdict**
**Context:** the operator asked for a CI result in `version.json`. `deploy-staging` in `.github/workflows/staging-deploy.yml` has no `needs:` on any test job, so the deploy does not wait for tests.
**Decision:** add `buildRunId` and `buildRunAttempt` only. Do not add a field that says tests passed.
**Rationale:** a "verified" field written by a job that does not wait for tests would be false. The operator chose option 1 of three, which is the accurate one.

**2026-11-18 | DECISION | Read the Actions environment variables, no workflow change**
**Context:** GitHub sets `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT` on every run, and both deploy jobs already run `scripts/write-version-file.js`.
**Decision:** read the two variables inside the script. Leave every workflow file unchanged.
**Rationale:** the smallest change that reaches both staging and production records.
