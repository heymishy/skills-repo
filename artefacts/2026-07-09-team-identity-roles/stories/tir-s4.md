## Story: The admin/credits panel is gated by per-person role, not tenant membership

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As an **Engineer on a team that shares a tenant with an admin**,
I want **the admin/credits panel to remain inaccessible to me even though I'm in the same tenant as an admin**,
So that **my role's actual permissions are enforced by who I am, not by which tenant I happen to belong to**.

## Benefit Linkage

**Metric moved:** At least one feature is gated by per-person role, not tenant membership.
**How:** This story retrofits `requireAdmin` (`src/web-ui/middleware/require-admin.js`) and the routes it protects (`admin-credits.js`) to read the per-person role from tir-s1's schema instead of the tenant-wide `user_roles` table. The metric's target — a non-admin denied access despite sharing the admin's tenant — becomes directly testable the moment this ships.

## Architecture Constraints

- Directly modifies `src/web-ui/middleware/require-admin.js` (arl-s2) and its consumers (`admin-credits.js`).
- **ADR-025:** tenant-scoping stays enforced underneath — this story adds person-scoping *within* the tenant boundary, it does not relax or replace the existing tenant guard.
- Fail-closed default: any ambiguity in role resolution denies access rather than granting it (see AC4).

## Dependencies

- **Upstream:** tir-s1 (schema must exist — this story's tests seed `team_memberships` rows directly via fixtures rather than requiring tir-s3's admin UI to exist first, so tir-s3 is not a hard blocker).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a non-admin team member (engineer/product/viewer role) shares a tenant with an admin, When they request the admin/credits panel or its underlying API route, Then they receive 403 Forbidden — extending the existing `check-arl-s2-admin-middleware.js` test pattern to assert against the new per-person role source.

**AC2:** Given the admin of that same tenant, When they request the same admin/credits panel, Then they are granted access — confirming admin access is preserved, not broken, by the retrofit.

**AC3:** Given `requireAdmin` now reads the per-person role from tir-s1's schema instead of the tenant-wide `user_roles` table, When a solo tenant (single person, no team) logs in as before, Then their admin access to their own tenant's credits panel is unchanged — zero regression for solo tenants.

**AC4:** Given a person's session role is somehow stale, missing, or ambiguous at request time, When they request the admin/credits panel, Then access is denied by default (fail closed) rather than granted.

## Out of Scope

- Gating any other existing UI surface beyond the admin/credits panel — the full feature-access matrix across every screen is deferred to a future epic, per this epic's Out of Scope.
- Changing what an admin can DO within the credits panel — this story only changes who can reach it, not its internal behaviour.

## NFRs

- **Performance:** None identified beyond the existing `requireAdmin` check's cost (a single indexed lookup, per tir-s1's schema).
- **Security:** This is the core security-relevant story of the epic. Must fail closed on any ambiguity (AC4) — this is a hard requirement, not a nice-to-have, since the entire benefit of the epic depends on this gate actually holding.
- **Accessibility:** Not applicable — no new UI, only a backend gating change.
- **Audit:** Denied access attempts logged (person ID, tenant ID, timestamp), at the same level as existing `requireAdmin` denials.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
