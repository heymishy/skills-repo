## Story: Add staging smoke test + manual promote gate to prod

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want a staging deploy to run the full regression + Playwright suite, and require my explicit manual approval before anything reaches `wuce-prod`,
So that promotion to production is a deliberate, evidence-backed decision — never an automatic side effect of merging code.

## Benefit Linkage

**Metric moved:** Metric 1 — A broken build cannot reach prod
**How:** This story is the actual gate — S2.1–S2.5 build the rehearsal environment, but without this story's green-suite-then-manual-approval requirement, staging would just be a second place code deploys to automatically, not a real safety check.

## Architecture Constraints

- Depends on S2.5's staging deploy pipeline as its trigger point.
- Depends on Epic 3's test suite (mock LLM gateway + key journeys) existing to have a meaningful suite to gate on — this story's AC1 assumes at least the `@mocked` suite exists; full richness grows as Epic 3 stories land.
- Neon cold-start timeout budget: 10 seconds, grounded in Neon's published latency benchmarks (per S2.2 NFRs, corrected 2026-07-09) — the smoke test must tolerate this without false-failing.
- ADR-018: Playwright is the sole E2E framework governing what "green suite" means for this gate.

## Dependencies

- **Upstream:** S2.5 (CI pipeline), and at least early Epic 3 stories (S3.1 mock gateway) for the suite this gate runs.
- **Downstream:** None — this is the terminal story of Epic 2; Epic 3 stories continue to add coverage that strengthens this gate over time.

## Acceptance Criteria

**AC1:** Given a staging deploy completes and the seed script (S2.4) has run, When the currently-available `@mocked`-tagged suite executes against the staging URL (starting with bri-s3.1's mock gateway smoke coverage and growing as further Epic 3 stories land), Then the pipeline reports a clear pass/fail result before any promotion step is offered. The suite's coverage is expected to grow from a minimal smoke check at this story's own DoD to the full 5-journey `@mocked` suite once Epic 3 completes — this AC covers whatever the suite actually contains at the time it runs, not a fixed "full regression" claim.

**AC2:** Given the staging suite is green, When Hamish reviews the CI run, Then an explicit manual "approve promote to prod" action is required (e.g. a GitHub Actions environment protection rule or manual workflow dispatch) — promotion does not happen automatically even on a fully green suite.

**AC3:** Given the staging suite has any failure, When the promote step is reached, Then it is not offered/available at all — a red suite structurally blocks the option to promote, not just a warning that's easy to click past.

**AC4:** Given a rollback is needed after a bad promotion, When Hamish follows the documented rollback path, Then he can revert `wuce-prod` to the previous known-good release without needing to reconstruct the steps from memory — the rollback path is written down (e.g. in a runbook or this story's implementation notes), not tribal knowledge.

## Out of Scope

- Automated rollback on post-promote failure detection — rollback is manual-but-documented (AC4), not automatic.
- A staging environment that itself has its own pre-staging rehearsal tier — one staging tier is sufficient for MVP, not a staging-of-staging cascade.

## NFRs

- **Performance:** The full staging suite (regression + Playwright) completing before the promote gate is offered should not force Hamish to wait an unreasonable time — coordinate with Metric 6's `@mocked` suite runtime target (under 10 minutes) as the primary budget; `@live` (nightly/pre-release) tests are not part of this per-merge gate.
- **Security:** The manual promote action requires Hamish's own GitHub authentication — no service account or automated credential can trigger promotion.
- **Accessibility:** Not applicable.
- **Audit:** Every promote action (who approved, when, which staging run it was based on) is recorded in GitHub Actions' own run history — sufficient audit trail for a solo operator, no separate system needed.

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
