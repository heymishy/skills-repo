## Story: Provision the wuce-staging Fly app

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want a distinct `wuce-staging` Fly app using the same Dockerfile as `wuce-prod` (skills-framework) but its own `fly.staging.toml`,
So that staging genuinely mirrors production's runtime, not a divergent approximation of it.

## Benefit Linkage

**Metric moved:** Metric 1 — A broken build cannot reach prod
**How:** Without a distinct staging app to deploy to, there is no rehearsal target at all — this story is the foundational infrastructure the rest of the epic builds on.

## Architecture Constraints

- Discovery Constraints: no Fly-managed Postgres/Redis; no Kubernetes/microservices — this app is compute-only, same shape as the existing `wuce-prod` Fly app.
- Staging costs must stay near-zero — Fly compute plan for staging matches or is smaller than prod's, not a larger/more expensive tier.

## Dependencies

- **Upstream:** None
- **Downstream:** S2.2, S2.3 (Neon/Upstash wiring), S2.5 (CI deploy target), S2.6 (smoke test target) all depend on this app existing.

## Acceptance Criteria

**AC1:** Given the same `Dockerfile` used by `wuce-prod`, When `fly deploy --config fly.staging.toml --app wuce-staging` is run, Then the app builds and starts successfully on Fly.io as a distinct app from `wuce-prod`.

**AC2:** Given `wuce-staging` and `wuce-prod` are both running, When their configuration is compared, Then they use the same Dockerfile and application code path — `fly.staging.toml` differs only in app name, secrets, and any staging-specific env vars, not in build/runtime behaviour.

**AC3:** Given `wuce-staging` receives no traffic, When Fly's billing is reviewed after a week, Then compute cost is near-zero (matches the "near-zero staging cost" constraint) — no idle compute is billed as if it were always-on production traffic.

## Out of Scope

- Custom domain/DNS for `wuce-staging` — the default Fly-provided `*.fly.dev` URL is sufficient for staging; no custom domain is needed.
- Multi-region deployment for staging — single region, matching prod's current single-region deployment.

## NFRs

- **Performance:** None specific to this story beyond Fly's standard compute tier behaviour.
- **Security:** Staging app secrets (once wired in later stories) are set via `fly secrets set --app wuce-staging`, never committed to the repo.
- **Accessibility:** Not applicable.
- **Audit:** Fly deploy history for `wuce-staging` is available via `fly releases --app wuce-staging` — no additional custom audit logging needed for this story.

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
