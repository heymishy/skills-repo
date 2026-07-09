## Story: Build the CI pipeline — PR checks through staging deploy

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want every PR to run lint/typecheck/unit tests/build, and every merge to `main` to automatically deploy to `wuce-staging` (never directly to prod),
So that the existing prod-only pipeline (`.github/workflows/fly-deploy.yml`) is replaced with one that always rehearses in staging first.

## Benefit Linkage

**Metric moved:** Metric 1 — A broken build cannot reach prod
**How:** This is the actual pipeline rewiring that makes "broken build cannot reach prod" true — today's `fly-deploy.yml` deploys straight to prod on push to `main`; this story changes that destination to staging, with prod reachable only via S2.6's separate promote gate.

## Architecture Constraints

- None identified — checked against .github/architecture-guardrails.md. No adapter is introduced (D37 not applicable); this is a GitHub Actions workflow change, consistent with existing CI conventions.
- Depends on S2.1–S2.4 (staging app, Neon, Upstash, seed script) all existing as deploy targets.

## Dependencies

- **Upstream:** S2.1, S2.2, S2.3, S2.4
- **Downstream:** S2.6 (smoke test + promote gate) is the next stage this pipeline feeds into; all of Epic 3's specs run against the staging URL this pipeline deploys to.

## Acceptance Criteria

**AC1:** Given a PR is opened against `main`, When CI runs, Then it executes lint, typecheck, `npm test` (unit chain), and a build step — and merging is blocked if any of these fail.

**AC2:** Given a PR is merged to `main`, When the merge completes, Then CI automatically deploys the new build to `wuce-staging` (not `wuce-prod`) — `wuce-prod` is not touched by this workflow at all.

**AC3:** Given the staging deploy completes, When the post-deploy seed script (S2.4) runs, Then it runs automatically as the next step in the same pipeline — not a manually-triggered follow-up.

**AC4:** Given the updated workflow configuration after this story is complete, When every GitHub Actions workflow file triggered by push-to-`main` is inspected, Then none of them deploys to the `wuce-prod` Fly app — verified by a CI-native check (e.g. a script asserting no push-to-main-triggered workflow step contains `--app wuce-prod` or equivalent, outside the manual-approval promote job introduced in S2.6) — not by manual inspection or a narrative assertion that the old workflow "no longer does so."

## Out of Scope

- Deploying feature-branch/PR-specific preview environments (one staging env per PR) — MVP has exactly one shared staging environment, not per-PR ephemeral environments.
- Rollback automation — a documented manual rollback path is covered by S2.6; automated rollback is a future enhancement.

## NFRs

- **Performance:** PR-check pipeline (lint/typecheck/unit/build) completes within a reasonable CI budget — not specified further here since it's an existing, already-tuned pipeline being extended, not built from scratch.
- **Security:** Staging deploy uses staging-scoped Fly/Neon/Upstash/PostHog secrets exclusively (per S2.1–S2.3, S1.2) — no prod secret is ever accessible to the staging deploy job.
- **Accessibility:** Not applicable.
- **Audit:** GitHub Actions run history is the audit trail for every deploy — no additional custom logging needed.

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
