## Story: Provision a Neon staging branch for Postgres

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want a separate Neon project or copy-on-write branch off the prod schema dedicated to staging,
So that staging has cheap, disposable, schema-accurate test data without ever touching production data.

## Benefit Linkage

**Metric moved:** Metric 1 — A broken build cannot reach prod
**How:** A staging environment that shares prod's database isn't real isolation — this story ensures a broken migration or bad query in staging can never touch or corrupt production data.

## Architecture Constraints

- Discovery Constraints: no Fly-managed Postgres — Neon only.
- ADR-025: any tenant-scoped tables (`products`, `credits`, `standards`, `user_roles`, etc.) carry the same schema in staging as prod — the branch must be schema-identical, not a hand-maintained approximation.
- Per `decisions.md` (validated 2026-07-09): Neon's free tier (100 CU-hours/month, 0.5GB/project, autosuspend after 5 min idle) is confirmed sufficient for this use — no paid tier needed.

## Dependencies

- **Upstream:** S2.1 (Fly staging app) — the connection string this story produces is consumed by that app.
- **Downstream:** S2.4 (seed script) writes into this branch; S2.5/S2.6 (CI, smoke test) depend on it being reachable.

## Acceptance Criteria

**AC1:** Given a Neon copy-on-write branch is created off the prod schema, When `wuce-staging` connects using the staging connection string, Then all tables present in prod (`products`, `credits`, `user_roles`, `github_first_login`, etc.) are present and structurally identical in staging.

**AC2:** Given a write is made to the staging Neon branch, When the prod Neon project/branch is inspected, Then the write is not present there — confirming true data isolation, not a shared connection pointed at two schemas.

**AC3:** Given staging has been idle for more than 5 minutes (Neon autosuspend triggers), When a request is made to `wuce-staging`, Then the connection succeeds within 10 seconds of cold-start (grounded in Neon's own published benchmarks — typical cold start 500ms–3.1s worst-case observed across 200 samples — see NFRs) rather than hanging indefinitely or erroring.

## Out of Scope

- Automatic nightly re-branching from prod (to keep staging data "fresh") — the branch is created once for MVP; a refresh cadence is a future enhancement if staleness becomes a real problem.
- Migrating existing dev/local Postgres data into this branch — staging is seeded via S2.4's synthetic seed script, not a copy of developer-local data.

## NFRs

- **Performance:** Neon autosuspend cold-start must resolve within 10 seconds — grounded in Neon's own published latency benchmarks (typical cold start 500ms–800ms; 95th percentile 2.6s; worst case observed 3.1s across a 200-sample benchmark; source: neon.com/docs/guides/benchmarking-latency, verified 2026-07-09). This is the concrete timeout budget referenced by S2.5/S2.6's CI pipeline and S3.x's Playwright config — the number discovery flagged as needing resolution at /definition, now sourced rather than asserted.
- **Security:** Staging Neon connection string is set via Fly secrets, never committed to the repo.
- **Accessibility:** Not applicable.
- **Audit:** Neon's own branch/query history is sufficient; no additional custom audit logging for this story.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
