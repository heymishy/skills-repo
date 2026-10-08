## Story: Tenant isolation hardening: adversarial path and cross-tenant guard tests for journey routes
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/database-migration-and-tenant-isolation-hardening.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Tech lead / squad lead**,
I want **adversarial test coverage verifying that all journey routes enforce tenant isolation and reject requests attempting to access another tenant's journey data**,
So that **journey data is structurally protected against cross-tenant access**.
## Benefit Linkage
M1 — Journey adoption — operator trust in the platform depends on isolation being provably correct; adoption of a multi-tenant feature requires this confidence.
## Architecture Constraints
ADR-025 — all guards use `requireJourneyAccess`/`isSameTenant` pattern. Adversarial test pattern follows wuce-multi-tenancy Phase 5 (14/14 adversarial path-traversal tests). No new npm runtime dependencies.
## Dependencies
ep5-s1, ep1-s1, ep2-s1
## Acceptance Criteria
**AC1:** Given a request is made to `GET /journeys/:id` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and no journey data is included in the response body.

**AC2:** Given a request is made to `PUT /api/journeys/:id` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and the journey record is not modified.

**AC3:** Given a request is made to `DELETE /api/journeys/:id` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and the journey record is not deleted.

**AC4:** Given a request is made to `POST /api/journeys/:id/stages` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and no stage is created.

**AC5:** Given a request is made to `POST /api/journey-stages/:stageId/mappings` using a stage ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and no mapping is created.

**AC6:** Given all journey and stage routes are exercised in the adversarial test suite,
When all tests pass,
Then zero cross-tenant data leaks are found — no journey, stage, or mapping record belonging to tenant B is returned to a request authenticated as tenant A.

## Out of Scope
Cross-org sharing (out of scope per discovery), performance/load testing of isolation guards, testing non-journey routes.
## NFRs
Follows adversarial test pattern from wuce-multi-tenancy Phase 5. All guards use ADR-025 pattern. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
