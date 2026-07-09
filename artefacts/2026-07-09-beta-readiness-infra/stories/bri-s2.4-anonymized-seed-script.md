## Story: Build an idempotent anonymized seed script for staging

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want an idempotent seed script that populates staging with anonymized/synthetic tenant data as a post-deploy step,
So that every staging deploy has realistic, schema-accurate test data without ever containing real customer information.

## Benefit Linkage

**Metric moved:** Metric 1 — A broken build cannot reach prod
**How:** A smoke test or Playwright run against an empty staging database can't meaningfully validate anything — this story provides the realistic data those tests need to be trustworthy.

## Architecture Constraints

- ADR-025: seed data must respect the same tenant_id-scoping model as real data (multiple synthetic tenants, not one flat dataset) so tenant-isolation tests (S3.4) have something real to isolate between.
- D37: the seed script's DB connection is injected, consistent with other adapters, not hardcoded.

## Dependencies

- **Upstream:** S2.2 (Neon staging branch) — this script writes into it.
- **Downstream:** S2.6 (smoke test) and all of Epic 3's journey specs depend on this seed data existing and being consistent run-to-run.

## Acceptance Criteria

**AC1:** Given the seed script is run against a freshly-branched staging database, When it completes, Then at least 2 synthetic tenants exist, each with representative rows in `products`, `credits`, `user_roles`, and other tenant-scoped tables — enough for a cross-tenant isolation test to have two real tenants to compare.

**AC2:** Given the seed script is run a second time against a database it has already seeded, When it completes, Then the result is identical to running it once (idempotent) — no duplicate rows, no unique-constraint errors.

**AC3:** Given the seed script's synthetic data, When inspected for PII, Then it contains zero real customer names, emails, or identifiers — all data is clearly synthetic (e.g. `tenant-demo-1`, `engineer@example-staging.test`).

**AC4:** Given a staging deploy completes, When the post-deploy step runs, Then the seed script executes automatically as part of that deploy — not as a manual step Hamish has to remember to run.

## Out of Scope

- Seeding realistic Stripe billing/subscription state — billing-related seed data (trial/paid states) is covered separately by S3.5's billing journey spec setup, not this general-purpose seed script.
- Configurable seed data volume/scale (e.g. "seed 100 tenants") — MVP seeds a small, fixed set of synthetic tenants sufficient for the test suite; load-testing-scale seeding is out of scope (matches discovery's non-goal on load testing at real scale).

## NFRs

- **Performance:** Seed script completes in under 30 seconds as part of the post-deploy step — it must not meaningfully delay the deploy pipeline.
- **Security:** Zero real customer data ever appears in the seed script or its output (AC3) — this is a hard security/privacy requirement, not just a nice-to-have.
- **Accessibility:** Not applicable.
- **Audit:** Seed script run is logged (success/failure, row counts) as part of the deploy pipeline's own logging — no separate audit mechanism needed.

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
