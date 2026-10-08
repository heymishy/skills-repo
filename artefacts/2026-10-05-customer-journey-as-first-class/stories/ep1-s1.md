## Story: Create journey entity: POST route, Postgres insert, and journey canvas shell
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-entity-and-stage-management.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **to create a new journey by submitting a name, which creates a tenant-scoped record in Postgres and takes me to its canvas shell page**,
So that **I have a persistent, tenant-isolated journey record to build stages on**.
## Benefit Linkage
M1 — Journey adoption — this story creates the journey record that M1 counts.
## Architecture Constraints
ADR-025 (application-layer tenant_id scoping) — `tenantId` from `req.session.tenantId` must be set on every insert; no cross-tenant query path. ADR-027 (live SaaS features are app code, not skills) — journey routes live in `src/web-ui/routes/journeys.js`. ADR-016 (two-file state authority) — `pipeline-state.json` is not written by journey routes. No new npm runtime dependencies (product/constraints.md #11).
## Dependencies
ep5-s1
## Acceptance Criteria
**AC1:** Given I submit a valid journey creation form (name provided, `tenantId` from session),
When the POST handler processes the request,
Then a `customer_journeys` record is inserted into Postgres with `id` (UUID), `tenant_id`, `name`, `description` (nullable), `product_id` (nullable), `created_at`, `updated_at`, and the response redirects to `/journeys/:id`.

**AC2:** Given I submit a journey creation form with no name,
When the POST handler processes the request,
Then a 400 response is returned and no record is inserted.

**AC3:** Given a POST request includes a `tenantId` field in its body that differs from the authenticated session's `tenantId`,
When the POST handler processes the request,
Then the inserted record's `tenant_id` is the session's `tenantId` — the request body's `tenantId` value is never used, so a caller cannot insert a journey under a different tenant's ID. (Cross-tenant READ/UPDATE/DELETE protection for this and other journey routes is covered by ep5-s2's own adversarial test suite, not duplicated here — this AC covers the write-path tenant-spoofing guard only.)

**AC4:** Given I am redirected to `/journeys/:id` after creation,
When the canvas shell page renders,
Then the journey name is displayed and the stage area shows the empty state "No stages yet. Add your first stage."
## Out of Scope
Stage creation (ep1-s2), feature mapping (ep2-s2), journey list page (ep4-s1), database migration script (ep5-s1 — this story assumes the tables already exist), cross-tenant READ/UPDATE/DELETE protection for journey routes (ep5-s2's own adversarial suite).
## NFRs
`tenantId` set on every insert per ADR-025. Injectable adapter pattern (D37) for Postgres calls. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
