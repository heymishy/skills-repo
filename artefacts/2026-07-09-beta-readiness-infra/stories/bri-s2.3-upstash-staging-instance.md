## Story: Provision an Upstash staging instance for Redis

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want a separate free-tier Upstash Redis instance dedicated to staging,
So that staging session/cache state is fully isolated from production, mirroring the existing prod pattern with no Fly-managed Redis needed.

## Benefit Linkage

**Metric moved:** Metric 1 — A broken build cannot reach prod
**How:** Completes the data-layer isolation started in S2.2 — session/cache state, like Postgres data, must never bleed between staging and prod.

## Architecture Constraints

- Discovery Constraints: no Fly-managed Redis — Upstash only, mirroring prod.
- Per `decisions.md` (validated 2026-07-09): Upstash's free tier (500K commands/month, 256MB, 10GB bandwidth) is confirmed sufficient — no paid tier needed for MVP staging load.

## Dependencies

- **Upstream:** S2.1 (Fly staging app)
- **Downstream:** S2.5/S2.6 (CI, smoke test) depend on this being reachable for session storage during Playwright runs.

## Acceptance Criteria

**AC1:** Given a separate Upstash Redis instance is provisioned for staging, When `wuce-staging` starts, Then it connects using the staging `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, distinct from the prod instance's credentials.

**AC2:** Given a session is written to staging Redis during a Playwright test run, When the prod Redis instance is inspected, Then that session key does not exist there.

**AC3:** Given staging Redis usage during a full CI run (Playwright suite + smoke test), When monthly command count is reviewed after a week of normal CI cadence, Then usage stays comfortably within the 500K commands/month free-tier allowance.

## Out of Scope

- Redis persistence/backup configuration for staging — staging session data is inherently disposable; no backup strategy is needed.
- Shared Redis instance between staging and any future preview/PR-specific environments — out of scope; this story provisions exactly one staging instance.

## NFRs

- **Performance:** None beyond Upstash's standard free-tier latency characteristics.
- **Security:** Staging Upstash credentials set via Fly secrets, never committed to the repo.
- **Accessibility:** Not applicable.
- **Audit:** None identified beyond Upstash's own usage dashboard.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
