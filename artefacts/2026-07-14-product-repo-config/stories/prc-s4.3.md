## Story: Automated cross-tenant repo isolation E2E spec

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-4-product-crud-and-isolation.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **platform operator**,
I want to **have an automated test proving two tenants' outer-loop writes can never cross into each other's repos**,
So that **Metric 3's isolation claim is continuously verified in CI, not just true by code inspection at one point in time**.

## Benefit Linkage

**Metric moved:** Metric 3 — Cross-tenant repo isolation
**How:** This story IS Metric 3's measurement mechanism — the metric's own definition names this exact automated E2E spec as its measurement method.

## Architecture Constraints

Matches the existing `bri-s3.4` cross-tenant isolation spec pattern exactly — same epic-level Medium oversight rationale ("given its security-critical scope").

## Dependencies

- **Upstream:** prc-s1.3, prc-s2.3, prc-s2.4, prc-s3.1 (every write path this feature introduced must exist before isolation across all of them can be tested)
- **Downstream:** None — this is the feature's terminal story.

## Acceptance Criteria

**AC1:** Given two different tenants, each with a product connected to a different repo, When each tenant's operator performs a sign-off, annotation, artefact write, and standards edit in their own product, Then every resulting commit lands only in that tenant's own repo — verified across all 4 write paths this feature introduced, not just one.

**AC2:** Given tenant A's session, When a request is crafted attempting to write to tenant B's product (e.g. by manipulating a product ID in a request), Then it is rejected before any write occurs — proving isolation holds even under an adversarial/malformed request, not just the happy path.

**AC3:** Given this spec runs in CI, When any future change regresses cross-tenant isolation, Then this spec fails and blocks merge — zero-tolerance, matching `bri-s3.4`'s existing gate.

## Out of Scope

- Load/performance testing of concurrent cross-tenant writes — this spec proves correctness, not throughput under load.

## NFRs

- **Performance:** Not applicable — this is a test, not a production path.
- **Security:** This story's entire purpose is the security guarantee.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

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
