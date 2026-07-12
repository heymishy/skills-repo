## Story: An admin adds a teammate by identity and assigns a role

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As a **Team admin / tech lead**,
I want to **add a teammate to my tenant by their identity (GitHub login, Google email, or email/password account) and assign them a role**,
So that **my team can genuinely share a tenant with each person holding their own, individually meaningful role — the first real proof this whole model works**.

## Benefit Linkage

**Metric moved:** Per-person role assignment exists.
**How:** This is the first story where the metric's target — "100% of team members in a shared tenant have a distinct, individually assigned role" — becomes observable with a real second person, not just a migrated solo tenant. Completing this story is what a test can assert against: a tenant with 2+ people, each holding a different role, created via a real admin action.

## Architecture Constraints

- **ADR-025:** only an admin of the *same* tenant can add teammates or assign roles for that tenant — tenant-scoped authorization, consistent with the existing tenant-isolation guard.
- Builds directly on tir-s1's `people`/`team_memberships` schema — this story's add/assign action is what actually populates a second row in an existing tenant, rather than the migration-only seeding tir-s1 performs.
- **D37:** the add-teammate action's underlying data-write function follows the injectable adapter pattern if it introduces any new external dependency (none currently anticipated — this is app-layer DB logic).

## Dependencies

- **Upstream:** tir-s1 (schema must exist).
- **Downstream:** tir-s4 (retrofits the existing admin/credits panel to read this story's role model), tir-s5 (bulk-add reuses this story's underlying add-teammate operation).

## Acceptance Criteria

**AC1:** Given an admin is on their team management page and a teammate has already logged in at least once (an existing `people` row exists for their identity), When the admin adds that teammate by identity and specifies a role (admin/engineer/product/viewer), Then a `team_memberships` row is created linking that person to the admin's tenant with the specified role.

**AC2:** Given an admin assigns the "engineer" role to a teammate, When that teammate next logs in, Then `req.session.role` resolves to "engineer" for that tenant — distinct from the admin's own "admin" role in the same tenant.

**AC3:** Given a non-admin (engineer, product, or viewer role) attempts to call the add-teammate or assign-role endpoint, When the request is made, Then it is denied with 403 Forbidden, consistent with the existing `requireAdmin`-style gating convention.

**AC4:** Given an admin adds a teammate who is already a member of that same tenant, When the add action is repeated, Then the existing membership's role is updated in place (idempotent) — not duplicated as a second row for the same person/tenant pair.

**AC5:** Given an admin attempts to add a teammate by an identity that has never logged in before (no `people` row exists for it), When the add action is attempted, Then it is rejected with a clear error explaining the teammate must log in at least once before they can be added — no placeholder `people` row is created.

## Out of Scope

- Self-serve invite links or email-based invitations — the admin adds by an identity that can already authenticate (existing or first-time login), not a signup-via-invite flow.
- Adding someone who has never logged in (no existing `people` row) — per AC5, this story requires the teammate to have authenticated at least once first. A pre-creation/placeholder-record mechanism for never-logged-in identities is deferred; revisit if real usage shows admins frequently need to add people before their first login.
- Removing a teammate from a team — this story only adds/assigns; removal is a natural near-term follow-up, not built here.
- A dedicated "pending invite" state — an added teammate's membership is active immediately, there is no pending/accept step.

## NFRs

- **Performance:** None identified — single-row writes, no scale concern at this story (scale is tir-s6's concern).
- **Security:** Add/assign-role actions are scoped to the calling admin's own tenant only — an admin of tenant A cannot add or assign roles for tenant B. Tested by AC3's denial case and by a same-tenant-only check on the endpoint.
- **Accessibility:** The team management page's add-teammate control meets WCAG 2.1 AA.
- **Audit:** Role assignment logged (admin's person ID, target person ID, role, tenant, timestamp).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
