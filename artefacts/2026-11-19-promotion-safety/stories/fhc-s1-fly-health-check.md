## Story: Production declares a Fly health check on /health, so a dead process stops taking traffic and a bad release stops the deploy

**Epic reference:** None - short-track (deploy hardening)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-17-testing-cicd-audit/reference/testing-and-cicd-audit.md` finding 4 (`fly.toml` has no health checks). Production `https://skills-framework.fly.dev/health` answers `{"status":"ok"}` (checked 2026-11-19), so the endpoint exists and is cheap.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [deploy]

## User Story

As **the operator who promotes builds to production**,
I want **Fly to check `/health` on production machines**,
So that **a release that does not start fails the deploy instead of replacing a working version, and a wedged process stops receiving traffic**.

## Benefit Linkage

**Metric moved:** production releases that start broken and are noticed by a person (today: all of them, `fly.toml` declares no check) become failed deploys that leave the previous version serving.
**How:** one `[[http_service.checks]]` entry in `fly.toml`: `GET /health`, generous grace period.

## Architecture Constraints

- Change confined to `fly.toml` (production, app `skills-framework`), one new test and artefacts. `fly.staging.toml` is not changed; `staging-deploy.yml` verifies that file after deploy.
- The check is shallow: `/health` does not touch the database, so a database blip cannot take the machine out of rotation.
- Grace period 60 seconds, interval 15 seconds, timeout 5 seconds: startup migrations have taken several boots to settle in a fresh environment (audit finding 12).
- Production runs one machine (`min_machines_running = 1`). An unhealthy machine therefore means a 503 rather than a broken page. This is accepted.
- `tests/check-ptvs-s1-promote-to-prod-version-stamp.js` and `tests/check-no-prod-deploy-on-push.js` assert on the workflow and `fly.toml`'s `app =`; neither is changed.

## Dependencies

- **Upstream:** none. **Downstream:** ppv-s1 reads `/health` after promotion.

## Acceptance Criteria

**AC1:** Given `fly.toml`, When it is read, Then it declares a `[[http_service.checks]]` entry with `method = 'GET'` and `path = '/health'`.
**AC2:** Given that entry, When its timings are read, Then `grace_period` is at least 60 seconds, `interval` is between 10 and 30 seconds, and `timeout` is under the interval.
**AC3:** Given `fly.toml`, When it is read, Then `app = 'skills-framework'`, the `[http_service]` section and its other settings are unchanged (`internal_port`, `force_https`, `auto_stop_machines`, `min_machines_running`).
**AC4:** Given the web server, When `GET /health` is requested with no session, Then it answers 200 with `{"status":"ok"}` and does not read the database (the existing handler, asserted so it cannot be made deeper by accident).
**AC5:** Given `fly.staging.toml`, When it is read, Then it declares no `[[http_service.checks]]` entry (staging is not changed by this story).

## Out of Scope

- A deep readiness check that reads the database.
- Health checks for staging, and TCP or machine-level checks.
- Fly rollback configuration or an automatic rollback.
- Confirming interaction with `auto_stop_machines = 'suspend'`: the operator confirms with `flyctl status -a skills-framework` after the first promotion that carries this change.

## NFRs

- **Availability:** the grace period covers startup; the check is shallow.
- **Reliability:** the test reads `fly.toml` as text; no network.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
