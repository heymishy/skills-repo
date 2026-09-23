## Story: Expose the real team roster as a read API
**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Discovery reference:** artefacts/2026-09-23-team-roster-integration/discovery.md
**Benefit-metric reference:** artefacts/2026-09-23-team-roster-integration/benefit-metric.md
**Domain:** web-ui

## User Story

As a **product owner or feature lead**,
I want **the app to know who the real, invited members of my team are**,
So that **any picker or page that needs to list "my team" can show real people instead of a fixed set of demo names**.

## Benefit Linkage

**Metric moved:** Real pod membership; /team/members shows a real list
**How:** This story adds the one, shared read path (`listTeamMembers`) both downstream stories (`rtri-s2`, `rtri-s3`) consume — without it, neither picker/page has any real data to read from.

## Architecture Constraints

- **ADR-025 (tenant isolation, application-layer scoping):** the new read function must filter strictly by `tenant_id`, matching every existing `team_memberships` query's own established convention (`resolveRoleForTenant`, `resolveRoleForPerson`, `getRoleForPersonInTenant`).
- **ADR-026 (reuse an existing entity's shape rather than introduce a new one):** no new table. `team_memberships` (`person_id`, `tenant_id`, `role`) and `person_identities` (`identity_key`, `person_id`, `provider`) already exist, already tested (`tir-s1`/`tir-s2`), and are joined read-only here.
- A `team_memberships` row with no matching `person_identities` row is silently omitted from the result — matches `user-roles.js`'s own established "no auto-creation, fall through unchanged" convention for unresolvable identities (`resolveRoleForPerson`, AC4).

## Dependencies

- **Upstream:** None — consumes only already-shipped, already-merged `tir-s1`/`tir-s2` schema.
- **Downstream:** `rtri-s2` (pod-manager.html picker) and `rtri-s3` (/team/members listing) both consume this story's own new function/endpoint.

## Acceptance Criteria

**AC1:** Given a tenant with 2 real `team_memberships` rows (each with a matching `person_identities` row), When the new read function is called for that tenant, Then it returns exactly 2 entries, each with the real `identity_key` and `role`.

**AC2:** Given a tenant with a `team_memberships` row that has NO matching `person_identities` row (an unresolvable identity), When the new read function is called for that tenant, Then that row is silently omitted from the result — the function returns only the resolvable entries, with no error and no placeholder row.

**AC3:** Given two different tenants, each with their own real `team_memberships` rows, When the new read function is called for tenant A, Then it returns only tenant A's members — none of tenant B's members appear (tenant isolation, ADR-025).

**AC4:** Given the new `GET /api/team/members`-style endpoint, When an authenticated user of a tenant with real members requests it, Then the response is a JSON array matching the read function's own output (identity + role per real member).

**AC5:** Given the same endpoint, When an unauthenticated request is made, Then it is rejected the same way every other `authGuard`-protected route in this app already is — no new auth mechanism introduced.

## Out of Scope

- Wiring any picker or page to actually USE this new function/endpoint — that is `rtri-s2` and `rtri-s3`.
- Any change to how `team_memberships`/`person_identities` rows are created (the invite/add-teammate flow itself) — reused read-only.
- Pagination or filtering beyond "all real members of this tenant" — no tenant in this app currently has enough real members to need it; revisit if that changes.

## NFRs

- **Performance:** The read function/endpoint responds in well under 1 second for any realistic tenant member count (a single indexed JOIN over two small tables — no different in shape from `resolveRoleForPerson`'s own already-proven query pattern).
- **Security:** No new auth mechanism — reuses this app's existing `authGuard` + tenant-scoping convention exactly.
- **Accessibility:** Not applicable — this story is a pure data/API layer, no rendered UI.
- **Audit:** Not applicable — this is a read-only path; no new write/mutation to audit.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    PEOPLE {\n        integer id PK\n        timestamptz created_at\n        text timezone\n        text date_format\n    }\n    TEAM_MEMBERSHIPS {\n        integer person_id PK,FK\n        varchar tenant_id PK\n        varchar role\n        timestamptz created_at\n    }\n    PERSON_IDENTITIES {\n        varchar identity_key PK\n        integer person_id FK\n        varchar provider\n        timestamptz created_at\n    }\n    PEOPLE ||--o{ TEAM_MEMBERSHIPS : \"has memberships\"\n    PEOPLE ||--o{ PERSON_IDENTITIES : \"has identities\""}}---

