## Story: After a production promotion, a read-only job confirms production is running the promoted build and answering /health, and opens an issue if not

**Epic reference:** None - short-track (deploy hardening)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-17-testing-cicd-audit/reference/testing-and-cicd-audit.md` finding 4 (nothing runs after `promote-to-prod`; no automated verification or rollback). vbr-s1 now stamps `sha`, `buildRunId` and `buildRunAttempt` into `version.json`, and the promote job writes the stamp for its own image (ptvs-s1), so `GET /version` on production can prove which run built what is running. At measurement time production reported sha `c0c9a46` with no `buildRunId` (it predates vbr-s1).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [deploy]

## User Story

As **the operator who approves production promotions**,
I want **a job after each promotion to check that production is running the promoted build and is healthy**,
So that **a promotion that "succeeded" but is not live, or is live and unhealthy, is flagged within minutes instead of being found by a user**.

## Benefit Linkage

**Metric moved:** time from a bad or missing promotion to the operator knowing falls from "when a user or the error chain notices" to the length of the verification poll (at most 5 minutes).
**How:** a `verify-production` job after `promote-to-prod` polls `GET https://skills-framework.fly.dev/version` until `sha` and `buildRunId` equal this run's, then calls `/health`. On failure the job is red and one issue labelled `production-verification` is opened.

## Architecture Constraints

- Change confined to `.github/workflows/staging-deploy.yml`, one new script under `scripts/`, one new test and artefacts. Workflow changes go through a pull request.
- The job is read-only against production: it issues GET requests only. It does not deploy, restart, roll back or approve anything. Automatic rollback is explicitly deferred (see `decisions.md`).
- The job has `needs: promote-to-prod`, and no `environment:` (it needs no approval). It must not add an `if:` to `promote-to-prod`; `tests/check-bri-s2.6-smoke-test-promote-gate.js` T6 must still pass.
- `fetch` and `sleep` in the script are injectable; the default `fetch` throws `Adapter not wired` (D37); the workflow wiring is verified by a test.
- The issue uses a separate label, `production-verification`, so it never enters the `production-error` flow used by the error bridge and the incident recorder. It is opened with `issues: write` granted on this job only, and only once per run.
- The production URL is `https://skills-framework.fly.dev` (the `app =` in `fly.toml`), overridable by an environment variable for tests.

## Dependencies

- **Upstream:** vbr-s1 (build run stamp), ptvs-s1 (production version stamp), fhc-s1 (the `/health` check), spg-s1 (promotion is of the head commit only).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given `/version` reports this run's `sha` and `buildRunId` and `/health` answers 200 `{"status":"ok"}`, When the verifier runs, Then it exits 0 and prints the verified sha and run id.
**AC2:** Given `/version` keeps reporting another sha or build run until the timeout, When the verifier runs, Then it exits non-zero after the timeout and prints what it last saw.
**AC3:** Given `/version` matches but `/health` does not answer 200 with status ok, When the verifier runs, Then it exits non-zero.
**AC4:** Given a transient request error while polling, When the next poll succeeds, Then the verifier still exits 0 (errors are retried until the timeout, not fatal on the first).
**AC5:** Given any run of the verifier, When its requests are recorded, Then every request is a GET to the production host and no other method or host is used.
**AC6:** Given a failed verification, When the failure handler runs, Then it opens one issue labelled `production-verification` naming the sha, the run URL and the last observed state, and an existing open issue for the same sha is not duplicated.
**AC7:** Given `staging-deploy.yml`, When it is read, Then `verify-production` has `needs: promote-to-prod`, no `environment:`, `issues: write` on that job only, calls the script with the real run sha and run id, and `promote-to-prod` has no `if:` line.

## Out of Scope

- Automatic rollback (deferred until the check has run clean for a few weeks).
- Post-promotion browser or journey tests, and verifying the staging deploy.
- Fly machine-level health checks (fhc-s1).
- Showing the build run in the app footer.

## NFRs

- **Safety:** read-only against production; no secret is printed.
- **Reliability:** deterministic tests with injected `fetch` and `sleep`; no network in tests. Poll interval 10 seconds, timeout 5 minutes.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
