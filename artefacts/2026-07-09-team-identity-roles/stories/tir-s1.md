## Story: Person and team-membership schema replaces tenant-wide role lookup

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As a **solo operator (today's persona)**,
I want to **keep logging in exactly as I do today, with no visible change**,
So that **the underlying role model can move from one-role-per-tenant to one-role-per-person with zero risk to existing users, and the foundation for real team roles exists**.

## Benefit Linkage

**Metric moved:** Zero regression for existing solo tenants (primary); Per-person role assignment exists (foundational — this story creates the schema the metric is ultimately measured against, full completion also requires tir-s3's first real 2-person tenant).
**How:** This story replaces the `user_roles` table (`tenant_id VARCHAR PRIMARY KEY, role VARCHAR`) with a `people` + `team_memberships` schema keyed by person, then swaps every login path's role lookup to the new schema. Solo tenants are migrated 1:1 with no role change, so the existing regression suite continues to pass — that pass rate, unchanged, is the observable proof this story succeeded.

## Architecture Constraints

- **ADR-025** (multi-tenancy enforced at the application layer, tenant_id scoping): this story adds a person-scoping layer *inside* the existing tenant-scoping guard — it does not introduce a second, parallel isolation mechanism. `team_memberships` rows are still scoped by `tenant_id`; the change is that `tenant_id` no longer implies exactly one role.
- **D37** (injectable adapter pattern): the existing `user-roles.js` module (`getUserRole`, `setGetUserRole`, stub throws when unwired) is either extended or replaced by an equivalent adapter for the new lookup — the throw-on-unwired contract is preserved, not silently dropped.
- Existing migration convention (`journey-store-pg.js`'s `CREATE TABLE IF NOT EXISTS` + startup auto-migrate) is the reference pattern for this story's schema bootstrap — no new migration framework introduced.

## Dependencies

- **Upstream:** None
- **Downstream:** Unblocks tir-s2, tir-s3, tir-s4, tir-s5, tir-s6 — all five remaining stories in this epic read or write this schema.

## Acceptance Criteria

**AC1:** Given a server starts against a clean database (no prior migration run), When the startup auto-migration block executes, Then a `people` table and a `team_memberships` table (columns: `person_id`, `tenant_id`, `role`, `created_at`, primary key `(person_id, tenant_id)`) exist, and re-running the migration (server restart) does not error.

**AC2:** Given an existing solo tenant with a row in the legacy `user_roles` table, When the migration runs, Then a corresponding `people` row and a `team_memberships` row are created for that tenant, with the role value copied unchanged from the legacy table.

**AC3:** Given a user logs in via any of the 3 existing auth providers (GitHub, Google, email/password) after this story ships, When `req.session.role` is set during login, Then it is read via the new person/team-membership lookup path — not the legacy `getUserRole(tenantId)` tenant-wide lookup — and resolves to the identical value a solo tenant would have received under the old model.

**AC4:** Given the full existing auth/billing/tenancy test suite (`check-arl-s1`, `check-arl-s2-admin-middleware`, `check-arl-s4`, `check-lab-s2.3`, and equivalents), When this story's changes are applied, Then every test continues to pass without any modification to its assertions.

**AC5:** Given a solo tenant that has a legacy `user_roles` row but has not logged in since the migration ran (no `team_memberships` row yet), When that person next logs in, Then a `team_memberships` row is lazily created for them from their existing role — login does not fail or silently default them to a different role.

## Out of Scope

- Building UI for a person to switch between multiple teams — the schema supports many-to-many person↔team membership, but no UI surfaces it in this story (or this epic).
- Backfilling historical login/audit events into the new schema — only current role state is migrated, not history.
- Removing the legacy `user_roles` table — it may be left in place (unused after this story) or dropped in a later cleanup story; this story does not decide that.

## NFRs

- **Performance:** Migration must complete within the existing server startup time budget. No specific numeric threshold identified yet — monitor actual startup time at implementation and flag if it becomes noticeable.
- **Security:** The migration must not change any existing user's effective role during the schema swap — zero privilege escalation or de-escalation as a side effect of this story. This is directly tested by AC2 and AC3.
- **Accessibility:** Not applicable — no UI surface in this story.
- **Audit:** Schema migration logged at startup (info level), matching the existing convention in `journey-store-pg.js`.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
