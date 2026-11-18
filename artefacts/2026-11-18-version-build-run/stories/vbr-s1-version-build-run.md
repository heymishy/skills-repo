## Story: The build stamp records the workflow run that built the image, so an operator can find the run from the running app

**Epic reference:** None - short-track (bounded change to an existing script)
**Discovery reference:** None - short-track skips discovery. Evidence: `scripts/write-version-file.js` (alrf-s2) already writes the commit SHA and PR number into `version.json`, which the app serves at `GET /version`; the operator chose, on 2026-11-18, to add the build run identity to that same record (option 1 of a three-way choice, recorded in the session transcript).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [pipeline] [deploy]

## User Story

As **the operator checking which build is live on staging**,
I want **the version record to name the GitHub Actions run that built it**,
So that **from the running app I can open the exact run, its logs and its status, without matching a commit SHA by hand**.

## Benefit Linkage

**Metric moved:** None formal. Operator time to find the build run for a live deploy.
**How:** `version.json` gains `buildRunId` and `buildRunAttempt`, read from the Actions environment variables `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT`, which GitHub sets on every run without any workflow change.

## What this record does and does not say

The record names the run that built the image. It does not say the tests in that run passed. `deploy-staging` in `.github/workflows/staging-deploy.yml` has no `needs:` on any test job, so a build can deploy before, or despite, a failing test. Adding a "verified" claim would be false until the deploy waits for tests; that is a separate decision and is out of scope here.

## Architecture Constraints

- Change confined to `scripts/write-version-file.js`: two fields added to the object `buildVersionInfo()` returns. No workflow file changes.
- Fields are `null` when the environment variables are absent (local runs), never a guessed value.
- Existing fields (`sha`, `shortSha`, `prNumber`, `commitSubject`, `deployedAt`) keep their names and values.
- `src/web-ui/utils/version-info.js` reads only the fields it already knows, so the new keys need no change there.

## Dependencies

- **Upstream:** alrf-s2 (the version writer and `GET /version`).
- **Downstream:** none in this story. Surfacing the run link in the footer UI is a follow-up.

## Acceptance Criteria

**AC1:** Given `GITHUB_RUN_ID` is set, When `buildVersionInfo()` runs, Then `buildRunId` equals that value.
**AC2:** Given `GITHUB_RUN_ATTEMPT` is set, When `buildVersionInfo()` runs, Then `buildRunAttempt` equals that value.
**AC3:** Given neither variable is set, When `buildVersionInfo()` runs, Then both fields are `null`.
**AC4:** Given any run, When `buildVersionInfo()` runs, Then `sha`, `shortSha`, `prNumber`, `commitSubject` and `deployedAt` are still present with their existing types.

## Out of Scope

- Any claim that tests passed in the build run (requires a deploy-to-test dependency; separate decision).
- Changing `deploy-staging` or `deploy-production` job ordering or `needs:`.
- Showing the run link in the web UI footer.

## NFRs

- **Reliability:** the script still exits 0 when the new variables are absent.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
