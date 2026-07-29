## Story: Agency-Client relationships, shared-access grants, and read-only enforcement

**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Benefit-metric reference:** artefacts/2026-07-30-agency-client-organisations/benefit-metric.md
**Domain:** [security, data, auth, web-ui]

## User Story

As a **Client org member (read-only)**,
I want to **see only the specific products/features an Agency has explicitly shared with my organisation through our particular relationship, and nothing shared by a different Agency my org also works with**,
So that **I get real visibility into the work being done for me, without one agency's confidential work leaking to a competing agency serving the same organisation**.

## Benefit Linkage

**Metric moved:** Agency-led client provisioning
**How:** A Client-org user viewing a shared product/feature is the final observable step in the metric's definition ("client-user login event and views at least one product/feature the Agency has shared"). This story is what makes that view event both possible and correctly scoped.

## Architecture Constraints

- **ADR-025 (Multi-tenancy enforced at the application layer):** this story extends the existing `requireJourneyAccess`/`isSameTenant` guard pattern to a materially new relationship shape (many-to-many, per-relationship scoping) — there is no infrastructure backstop if this guard is missed, so every new read path touching a Client-org user's view of shared data must go through it or an equivalent guard. This is the single highest-risk story in the epic, directly analogous in kind (though not in cause) to the real cross-tenant access bug fixed in `bri-s3.4`.
- **Guardrail:** no direct DB access from the UI layer for access checks — all grant/relationship reads go through a dedicated adapter function, not ad hoc queries scattered across route handlers, so the enforcement logic has exactly one place to audit.

## Dependencies

- **Upstream:** Story 1 (organisation entity) must exist — the relationship table references `organisations.org_id`.
- **Downstream:** Story 3 (self-service provisioning) creates the relationships this story enforces. Story 5 (comments) attaches to the same shared-resource concept this story establishes.

## Acceptance Criteria

**AC1:** Given an Agency organisation and a Client organisation with an established relationship, When the Agency shares a specific product with that Client through that relationship, Then a grant record is created scoped to that specific relationship (not to the Client org broadly).

**AC2:** Given a Client organisation has relationships with two different Agencies (Agency A and Agency B), and Agency A has shared Product X with the Client through the Agency A relationship, When a Client-org user (logged in, scoped to that Client org) requests the list of products visible to them, Then Product X appears, and no product shared only via a separate Agency B relationship that the Client does not have a grant for appears.

**AC3:** Given a Client-org user has a grant to view Product X, When that user attempts to access an edit-capable route or action on Product X (e.g. a PUT/POST mutation endpoint), Then the request is rejected (403) — the grant conveys read-only access, never write/edit access to the underlying shared resource.

**AC4:** Given a Client-org user has no grant for a given product (never shared with their org, or shared only via a different relationship), When that user requests that product directly by ID (e.g. guessing or reusing a URL), Then the request returns 404 (matching this codebase's existing FORBIDDEN-vs-NOT_FOUND policy in `middleware/journey-access.js` — not found, not a 403 that would confirm the resource's existence to an unauthorised viewer).

**AC5:** Given an Agency revokes a previously-granted product from a Client relationship, When a Client-org user who previously had access requests that product again, Then access is denied (404, per AC4's policy) — revocation takes effect immediately, not after a caching delay.

**AC6 (regression guard):** Given the existing tenant-isolation test suite (`bri-s3.4` and related tenant-scoping tests), When this story's changes are merged, Then all pre-existing tenant-isolation tests continue to pass unchanged — this story is additive to the access-control surface, not a replacement of the existing tenant boundary.

## Out of Scope

- The Agency-side UI/flow for actually creating a relationship and granting access — that is Story 3 (self-service provisioning). This story defines and enforces the data model and access check; Story 3 is what an Agency admin actually clicks through.
- Any notion of the Client org granting anything back to the Agency, or any bidirectional sharing model — access flows one direction (Agency shares with Client) in this MVP.
- Comments/collaboration on shared resources — that is Story 5, which depends on this story's grant model existing.

## NFRs

- **Performance:** Grant-check lookups (relationship + grant existence) must be indexed and add no more than one additional query per protected route, matching the existing tenant-scoping guard's cost profile.
- **Security:** This is the epic's primary security-critical story. Every new read path must go through the grant-check guard; no route may check only `org_id` equality without also checking the relationship-scoped grant when the requester is a Client-org user. AC4/AC5 (404-not-403, immediate revocation) are hard requirements, not aspirational.
- **Accessibility:** Not applicable at this story's layer (access-control logic, not UI) — covered by Story 3.
- **Audit:** Every grant creation, revocation, and denied-access attempt (AC4) is logged with `relationship_id`, `org_id`, `resource_id`, and timestamp — this is the audit trail the next `bri-s3.x`-style investigation would need if a leak were ever suspected.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

<!-- Highest complexity in the epic — genuinely new relationship shape with no precedent in this codebase, directly extends a security-critical guard. Flag for closer review at /review and /definition-of-ready than the epic's default Medium oversight might otherwise suggest. -->

## Data Model

---CANVAS-JSON: {"type":"data-model","title":"Agency-Client relationships and shared-access grants","content":{"mermaid":"erDiagram\n    ORGANISATIONS {\n        text org_id PK\n        text name\n        text org_type\n        timestamptz created_at\n    }\n    AGENCY_CLIENT_RELATIONSHIPS {\n        text relationship_id PK\n        text agency_org_id FK\n        text client_org_id FK\n        timestamptz created_at\n    }\n    SHARED_ACCESS_GRANTS {\n        text grant_id PK\n        text relationship_id FK\n        text resource_type\n        text resource_id\n        timestamptz granted_at\n        timestamptz revoked_at\n    }\n    ORGANISATIONS ||--o{ AGENCY_CLIENT_RELATIONSHIPS : \"agency_org_id\"\n    ORGANISATIONS ||--o{ AGENCY_CLIENT_RELATIONSHIPS : \"client_org_id\"\n    AGENCY_CLIENT_RELATIONSHIPS ||--o{ SHARED_ACCESS_GRANTS : \"scopes\""}}---

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
