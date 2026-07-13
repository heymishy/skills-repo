## Story: Login role resolution is scoped by person, not just tenant

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As an **Engineer on a team that shares a tenant with an admin**,
I want **my own individually-assigned role to be the one that's actually used when I log in**,
So that **per-person roles work correctly in practice, not just in the schema — sharing a tenant with an admin never accidentally grants or denies me a role that belongs to someone else on the team**.

## Benefit Linkage

**Metric moved:** Per-person role assignment exists.
**How:** tir-s1 shipped a `team_memberships` schema keyed by `(person_id, tenant_id)`, and tir-s3 correctly writes distinct role rows per person. But the login-time read path (`resolveRoleForTenant`, called from `auth.js`/`auth-email.js` via `getRoleForTenant`) queries `team_memberships WHERE tenant_id = $1 LIMIT 1` — no `person_id` filter at all. The moment a tenant has 2+ people with different roles, login resolves an arbitrary row's role for everyone in that tenant, not the authenticating person's own row. This story closes that gap so the metric's target (each person's own role is what's actually used) is true in the real login path, not only in the data model.

## Architecture Constraints

- **ADR-025:** tenant-scoping remains the isolation boundary; this story adds person-scoping to the existing lookup, it does not introduce a parallel mechanism.
- Reuses tir-s2's `resolvePersonForIdentity(pool, identityKey)` (`src/web-ui/modules/identity-links.js`) as the identity → person_id resolution step — this function already checks `person_identities` first, then falls back to `team_memberships.tenant_id = identityKey` (today's convention: `identityKey` equals `tenantId` for anyone who hasn't explicitly linked a second provider). This story does not duplicate that resolution logic.
- **D37:** extends the existing `getRoleForTenant`/`setGetRoleForTenant` adapter pair in `src/web-ui/modules/user-roles.js` (tir-s1) rather than introducing a new one — the stub-throws-when-unwired contract is preserved. The production wiring in `server.js` must be updated to pass the resolved `personId` through (this is the wiring AC, see AC5).
- Follows the same person-resolution convention `identity-links.js` already established, not a new one.

## Dependencies

- **Upstream:** tir-s1 (schema, `getRoleForTenant`/`setGetRoleForTenant`), tir-s2 (`resolvePersonForIdentity`) — both merged (PRs #463, #464).
- **Downstream:** tir-s3, tir-s5, tir-s6 do not need to change — they write/read `team_memberships` correctly already; this story only fixes the login-time read path.

## Acceptance Criteria

**AC1:** Given a tenant has two people with different roles (e.g. person X is `admin`, person Y is `engineer`, both via `team_memberships` rows in the same tenant), When person Y logs in, Then `req.session.role` resolves to `engineer` — person Y's own role, not X's, regardless of row insertion order.

**AC2:** Given the same two-person tenant, When person X (the admin) logs in, Then `req.session.role` resolves to `admin` — confirming both people in the same tenant now resolve independently, not to whichever row happens to be returned first.

**AC3:** Given a solo tenant (today's common case, one person, one role), When that person logs in, Then `req.session.role` resolves exactly as it did before this story — zero regression for the existing common case.

**AC4:** Given a completely new identity that has never logged in before and has no `team_memberships` row and no legacy `user_roles` row (today's normal case for a first-time non-admin signup — confirmed in `server.js`: `user_roles` only ever gets a row via the `ADMIN_GITHUB_LOGINS` startup seed, never at ordinary signup), When they log in, Then they resolve to the default `user` role exactly as before this story — `resolvePersonForIdentity` returning `null` for a genuinely unknown identity must not break login or throw; this story does not add a new auto-person-creation step for ordinary signups.

**AC5 (D37 wiring):** Given `server.js` currently wires `setGetRoleForTenant` to call `resolveRoleForTenant(pool, tenantId)` with no person resolution step, When this story ships, Then the wiring is updated to resolve the authenticating person's `personId` first (via `resolvePersonForIdentity`) and pass it into the corrected, person-scoped lookup — verified by a test, not just a code read.

## Out of Scope

- Changing `team_memberships`' schema shape — the `(person_id, tenant_id)` primary key from tir-s1 is already correct; only the read path was wrong.
- Changing `person_identities` or `resolvePersonForIdentity` themselves — this story is a consumer of tir-s2's existing function, not a modification of it.
- Auto-creating a `people`/`team_memberships` row for a brand-new, never-seen-before signup — that is not how the system works today for ordinary (non-admin-seeded) signups, and this story does not change that (see AC4).
- Any UI change — this is a backend login-path fix only.

## NFRs

- **Performance:** No new NFR — this adds one extra lookup (`resolvePersonForIdentity`) to the existing login path, which already performs multiple queries; no specific threshold identified.
- **Security:** This is a correctness-critical fix with real access-control consequences (a person could otherwise be granted or denied privileges based on database row order, not their actual assigned role) — AC1/AC2 are the core security-relevant tests.
- **Accessibility:** Not applicable — no UI.
- **Audit:** No new audit requirement beyond what tir-s1/tir-s3 already log at role-assignment time.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
