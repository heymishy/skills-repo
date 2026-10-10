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
ADR-025 — tenant scoping on every read/write. Adversarial test pattern follows wuce-multi-tenancy Phase 5 (14/14 adversarial path-traversal tests). Cross-tenant responses are 404, not 403, matching this file's own already-established, security-motivated FORBIDDEN-vs-NOT_FOUND convention (decisions.md D13 — no existence leak to a cross-tenant caller) — corrected from this story's own original "403" wording, same resolution pattern as D8/D13. No new npm runtime dependencies.
## Dependencies
ep5-s1, ep1-s1, ep2-s1
## Acceptance Criteria

**ACs corrected 2026-10-10 (decisions.md D19):** the original ACs referenced routes that do not exist in this codebase (`PUT`/`DELETE /api/journeys/:id`, no `/api` prefix anywhere in this feature) and used 403 instead of this file's own established 404-not-403 cross-tenant convention. Retargeted to the 6 real mutating/read routes this feature actually has, confirmed by reading `server.js`'s own dispatch table directly — no journey-level update/delete route exists, so testing one is out of scope for this hardening story (building one would be new feature scope, not isolation hardening).

**AC1:** Given a request is made to `GET /journeys/:id` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 404 response is returned and no journey data is included in the response body.

**AC2:** Given a request is made to `POST /journeys/:id/stages` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 404 response is returned and no stage is created.

**AC3:** Given a request is made to `PATCH /journeys/:id/stages/:stageId` using a stage ID that belongs to a different tenant,
When the request is processed,
Then a 404 response is returned and the stage record is not modified.

**AC4:** Given a request is made to `PATCH /journeys/:id/stages-order` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 404 response is returned and no stage's position is modified.

**AC5:** Given a request is made to `POST /journeys/:id/stages/:stageId/feature-mappings` using a stage ID that belongs to a different tenant,
When the request is processed,
Then a 404 response is returned and no mapping is created.

**AC6:** Given a request is made to `DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId` using a stage ID that belongs to a different tenant,
When the request is processed,
Then a 404 response is returned and the mapping record is not deleted.

**AC7:** Given all 6 journey, stage, and mapping routes above are exercised in the adversarial test suite,
When all tests pass,
Then zero cross-tenant data leaks are found — no journey, stage, or mapping record belonging to tenant B is returned, modified, or deleted by a request authenticated as tenant A.

## Out of Scope
Cross-org sharing (out of scope per discovery), performance/load testing of isolation guards, testing non-journey routes, building a journey-level update/delete route (no such route exists today — out of scope for a hardening/test-only story; would be new feature scope).
## NFRs
Follows adversarial test pattern from wuce-multi-tenancy Phase 5. All guards use ADR-025 pattern. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
