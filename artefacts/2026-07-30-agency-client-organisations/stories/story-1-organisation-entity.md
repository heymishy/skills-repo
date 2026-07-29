## Story: Organisation exists as a first-class entity with an org_type

**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Benefit-metric reference:** artefacts/2026-07-30-agency-client-organisations/benefit-metric.md
**Domain:** [data, web-ui]

## User Story

As a **Platform operator**,
I want to **have organisations exist as real database rows with a type (standalone, agency, or client), instead of `tenant_id` being a bare string with no backing entity**,
So that **every downstream story in this epic (relationships, provisioning, sharing, conversion) has a real entity to attach to, and existing tenants keep working unchanged**.

## Benefit Linkage

**Metric moved:** Agency-led client provisioning
**How:** This is the foundational entity every later story in the flow depends on — an Agency cannot be created, and a Client cannot be provisioned, until Organisation exists as a real row with a type. This story alone does not complete the metric, but nothing else in the epic can start without it.

## Architecture Constraints

- **ADR-025 (Multi-tenancy enforced at the application layer):** the new `organisations` table extends the existing `tenant_id` string-scoping model — it does not introduce schema-per-tenant or database-per-tenant infrastructure. Every table currently carrying a bare `tenant_id` string continues to do so; `organisations.org_id` becomes the canonical value that `tenant_id` columns reference going forward, not a schema boundary change.
- **ADR-026 (Reuse before introducing new entities):** confirmed during discovery investigation — no existing table or entity in this codebase currently represents "Organisation" (tenant_id is a bare string with no backing row anywhere). This is a genuinely new entity, not a duplicate of something existing.
- **ADR-027 (Live SaaS features are ordinary app code):** this is `src/web-ui/` application code (a new adapter + migration), not a SKILL.md skill.

## Dependencies

- **Upstream:** None
- **Downstream:** Story 2 (Agency-Client relationship), Story 3 (self-service provisioning), Story 4 (dual-path auth), Story 6 (conversion) all require this table to exist.

## Acceptance Criteria

**AC1:** Given the `organisations` table does not yet exist, When the migration runs, Then a new `organisations` table is created with columns `org_id` (primary key), `name`, `org_type` (one of `standalone`, `agency`, `client`), `created_at`.

**AC2:** Given an existing tenant that signed up before this story shipped (identified by an existing `tenant_id` value with no corresponding `organisations` row), When the backfill/default-assignment step runs, Then that tenant gets a corresponding `organisations` row with `org_type = 'standalone'` and no forced re-classification prompt or workflow is shown to that tenant.

**AC3:** Given a brand-new user signs up today (post-this-story) with no `TENANT_ORG_ALLOWLIST` match and no agency/client selection made, When their session's `tenantId` is resolved at OAuth callback, Then a corresponding `organisations` row is created (or resolved, if already existing for that `tenant_id`) with `org_type = 'standalone'`, matching today's existing solo-tenant behaviour exactly.

**AC4:** Given an `organisations` row exists for a given `tenant_id`, When any existing route or test that reads `req.session.tenantId` runs unchanged, Then it continues to behave identically to before this story — this story is additive (a new table + resolution step), not a change to any existing route's read/write behaviour.

## Out of Scope

- Any UI for viewing or editing organisation details — no route or page is added in this story. This is a data-model and resolution-step story only.
- Setting `org_type = 'agency'` or `org_type = 'client'` for any real tenant — that happens in Story 3 (self-service provisioning). This story only establishes the entity and the `standalone` default path.
- The Agency-Client relationship table — that is Story 2.

## NFRs

- **Performance:** Organisation resolution at OAuth callback adds at most one additional indexed lookup (`SELECT ... FROM organisations WHERE tenant_id = $1`) to the existing login path — negligible added latency.
- **Security:** No new tenant-scope surface — `organisations` rows are looked up by the same `tenant_id` value already trusted in the existing session, not by any request-supplied value.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** Organisation creation (new row insert) is logged with `tenant_id`, `org_type`, and timestamp, matching this codebase's existing logging conventions for tenant-lifecycle events (e.g. `journey_created` PostHog events).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Data Model

---CANVAS-JSON: {"type":"data-model","title":"Organisation entity","content":{"mermaid":"erDiagram\n    ORGANISATIONS {\n        text org_id PK\n        text name\n        text org_type\n        timestamptz created_at\n    }"}}---

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
