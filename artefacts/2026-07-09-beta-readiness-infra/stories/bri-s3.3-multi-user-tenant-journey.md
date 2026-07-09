## Story: Multi-user within one tenant journey spec

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As a **first beta customer onboarding as a team, not a solo user**,
I want role-based permissions and concurrent access within my tenant to actually work as designed,
So that the first time a real team (not just Hamish's own solo account) exercises the per-person role model, it's protected by deterministic coverage rather than being untested in production.

## Benefit Linkage

**Metric moved:** Metric 4 — Risk-critical journeys have deterministic E2E coverage
**How:** Closes 1 of the 5 required journeys — specifically the one that only matters once a tenant has more than one person in it, which is exactly the scenario `2026-07-09-team-identity-roles` is building toward.

## Architecture Constraints

- ADR-018: browser-driven Playwright spec.
- ADR-025: this spec exercises the tenant-scoping model, but for *within*-tenant role differentiation, not *across*-tenant isolation (that's S3.4).
- Consumes S3.1's mock LLM gateway for the `@mocked` variant.

## Dependencies

- **Upstream — cross-feature (external to this feature's own stories):** `2026-07-09-team-identity-roles` must deliver the per-person role model (admin/engineer/product/viewer) and the many-to-many person↔team schema before this spec has real role behaviour to test against. `[External: 2026-07-09-team-identity-roles must reach at least definition-of-ready before this story can be implemented (writing the spec now is fine; it cannot pass until that feature's role model exists) — confirmed by operator on 2026-07-09]` **Formal RISK-ACCEPT/PROCEED-BLOCKED gate recorded in `decisions.md` (2026-07-09, post-/review)** — this story's DoR pre-check "no dependency on an incomplete upstream story" is expected to fail until the gate is cleared; do not silently override it.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given two people in the same tenant with different roles (admin and engineer, per the `team-identity-roles` role model), When each accesses a role-gated feature (e.g. the admin/credits panel), Then the admin succeeds and the engineer is denied — proving per-person role differentiation within one tenant.

**AC2:** Given two people in the same tenant access the same shared resource concurrently (e.g. both viewing the same product's dashboard), When their sessions overlap, Then neither session's actions corrupt or overwrite the other's unrelated to their own action — basic concurrent-access safety, not a full collaborative-editing guarantee.

**AC3:** Given a viewer-role team member (read-only, per `team-identity-roles`), When they attempt any write action, Then it is denied — proving the read-only role boundary holds under an actual browser-driven attempt, not just a unit-test assertion.

**AC4:** Given this spec is tagged `@mocked` and `@multi-tenant` (touches the tenant/role model even though it's within-tenant, not cross-tenant), When it runs in CI, Then it uses S3.1's mock gateway and completes without real LLM calls.

## Out of Scope

- Cross-tenant isolation (a different person in a *different* tenant) — that is S3.4's responsibility, not this story's.
- Real-time collaborative editing conflict resolution — AC2's "concurrent access" is about safety (no corruption), not a live-collaboration feature.

## NFRs

- **Performance:** Contributes to the shared under-10-minute `@mocked` suite budget (Metric 6).
- **Security:** This spec is the primary regression guard against a role-boundary regression (e.g. a future change accidentally granting engineer access to admin-only routes) — treat any failure here as high-priority, not routine flake.
- **Accessibility:** Not applicable beyond the app's existing bar.
- **Audit:** None beyond standard CI logging.

## Complexity Rating

**Rating:** 3 (raised from 2 at /review — the story depends entirely on an as-yet-unspecified role schema from an unbuilt sibling feature, which is high ambiguity, not just "some ambiguity")
**Scope stability:** Unstable — depends on `team-identity-roles`' final role list/schema, which could still change before that feature reaches DoR.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
