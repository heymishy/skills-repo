## Epic: A broken build cannot reach production

**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

Every merge to `main` deploys to a dedicated `wuce-staging` environment first — separate Fly app, separate Neon Postgres branch, separate Upstash Redis instance — and only reaches `wuce-prod` after a green regression + Playwright suite and an explicit manual approval. Staging costs stay near-zero.

## Out of Scope

- Kubernetes, microservices split, event-driven service mesh — explicitly rejected in discovery; Fly.io + Neon + Upstash cover both layers.
- Fly-managed Postgres/Redis — Neon and Upstash are used instead, not Fly's own managed database offerings.
- Multi-region or HA staging, canary/blue-green deploys — staging is a single environment with a single promote gate.
- Full production monitoring/alerting overhaul — this epic is about pre-prod rehearsal, not production observability.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Metric 1 — A broken build cannot reach prod | 0% (direct merge-to-prod today) | 100% of merges pass staging + smoke test + manual approval before prod | Delivers the staging Fly app, CI pipeline, and promote gate that structurally enforces this |

## Stories in This Epic

- [ ] S2.1 — Provision the wuce-staging Fly app
- [ ] S2.2 — Provision a Neon staging branch for Postgres
- [ ] S2.3 — Provision an Upstash staging instance for Redis
- [ ] S2.4 — Build an idempotent anonymized seed script for staging
- [ ] S2.5 — Build the CI pipeline: PR checks through staging deploy
- [ ] S2.6 — Add staging smoke test + manual promote gate to prod

**Cross-epic dependency (added 2026-07-09, post-/review):** S2.6, this epic's terminal story, is not fully self-contained within Epic 2 — its smoke-test gate requires at least bri-s3.1 (mock LLM gateway, Epic 3) to exist so there's a real `@mocked` suite to run. S2.6's own AC1 is written to cover whatever suite coverage actually exists at its DoD point, growing as Epic 3 lands, rather than assuming a "full regression suite" is ready. This means S2.6 cannot reach DoD strictly before Epic 3 begins — only S2.1–S2.5 are fully independent of Epic 3.

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Infrastructure and CI/CD pipeline changes — a misconfigured promote gate is the exact risk this epic exists to prevent, so PR review is warranted even though no regulated or customer data is directly touched.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
