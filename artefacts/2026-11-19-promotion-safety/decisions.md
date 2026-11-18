# Decisions: promotion safety (spg-s1, fhc-s1, ppv-s1)

**2026-11-19 | DECISION | Three short-track stories, in this order: stale-promotion guard, Fly health check, post-promotion verification**
**Context:** the 2026-11-17 audit (findings 4 and 5) found no verification after production promotion, no health check in `fly.toml`, and 131 stale Staging Deploy runs waiting for approval. Each promote job checks out and builds its own run's commit, so approving an old run deploys an old commit over newer production code. Measured again on 2026-11-19: 125 runs still waiting (`reference/ci-health-measurement-2026-11-19.md`).
**Decision:** write three stories under one feature folder. spg-s1 first because the later two verify a deploy and should not sit on top of a path that can deploy the wrong commit.
**Rationale:** the guard removes a way to ship the wrong code; the health check stops a dead process taking traffic; the verification tells the operator that what was promoted is what is running.

**2026-11-19 | DECISION | The promote job refuses a stale commit; it does not rebuild at the head**
**Context:** the operator approves a specific run for a specific commit.
**Decision:** the guard fails the job when its commit is not the current head of master. It never substitutes a different commit.
**Rationale:** deploying code the operator did not approve is worse than a failed job. A failed job is visible and the operator can approve the newest run instead. The guard fails closed: if the head cannot be read, the job fails.

**2026-11-19 | DECISION | Superseded waiting runs are cancelled by a job after a successful staging deploy**
**Context:** older runs waiting for production approval are superseded the moment a newer commit reaches staging. A job-level concurrency group might replace pending jobs, but whether a job waiting for environment approval counts as pending is not something this story can establish without a live run.
**Decision:** a small job runs after `deploy-staging`, lists Staging Deploy runs in the waiting state that were created before this run, and cancels them through the Actions API. A cancel that fails is logged and does not fail the job.
**Rationale:** explicit and testable with an injected API. **Consequence for the operator:** the first run after this merges cancels every older waiting run, about 125 today, including the vbr-s1 run (`44270386578`) still waiting for approval. The guard would have refused those anyway. Cancelling is the least destructive way to clear them (nothing is deployed or deleted).

**2026-11-19 | DECISION | The Fly health check is shallow and production only**
**Context:** `/health` answers `{"status":"ok"}` without touching the database. `fly.toml` is production (`skills-framework`); staging has `fly.staging.toml`, and `staging-deploy.yml` verifies that file's contents after deploy.
**Decision:** add one `[[http_service.checks]]` entry to `fly.toml` with a 60 second grace period (startup migrations have taken several boots to settle in a fresh environment), checking `GET /health`. No change to `fly.staging.toml`.
**Rationale:** a shallow check flags a dead or wedged process, not a slow database, so it will not flap on a database blip. **Accepted risk:** production runs one machine (`min_machines_running = 1`), so an unhealthy machine means a 503 rather than a broken page. That is the intended trade. Whether a failing check interacts badly with `auto_stop_machines = 'suspend'` cannot be tested in CI; the operator confirms with `flyctl status -a skills-framework` after the first promotion that carries it.

**2026-11-19 | DECISION | Post-promotion verification is read-only and does not roll back**
**Context:** the vbr-s1 stamp puts `sha`, `buildRunId` and `buildRunAttempt` in `GET /version`, and the promote job writes the stamp for its own image.
**Decision:** a job after `promote-to-prod` polls production `/version` until `sha` and `buildRunId` match this run, then checks `/health`. On failure it goes red and opens one GitHub issue labelled `production-verification`. It issues only GET requests to production. No automatic rollback.
**Rationale:** a wrong automatic rollback is worse than a loud failure the operator acts on. Revisit after the check has run clean for a few weeks. The separate label keeps these issues out of the `production-error` flow that the error bridge and incident recorder use.

**2026-11-19 | OPEN | Repository security settings are all disabled**
**Context:** Dependabot security updates, secret scanning, push protection and code scanning are off (measurement reference).
**Decision:** none in these stories. They are repository Settings changes for the operator; code scanning also needs a workflow.
**Rationale:** it is not a code change, so it does not belong in a story unless a workflow is wanted.

**2026-11-19 | OPEN | Required checks and the unit chain name**
**Context:** the ruleset requires the assurance gate and Scenarios A and B only; the unit chain job ("Lint, typecheck, test, build") and the core browser job can be red while a PR merges.
**Decision:** none here. Requiring them is an operator ruleset change.
**Rationale:** the guard and the verification protect production; they do not replace a required test gate.
