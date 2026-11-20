## Story: A person with no membership in a tenant gets the lowest role, not another member's role

**Epic reference:** None - short-track (security fix, found by the failing E2E spec `bri-s3.6-auth-journey` AC1)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-20-ci-speed/reference/e2e-failing-specs-triage-2026-11-20.md`, sections "Update" and "Update 2". `resolveRoleForPerson` in `src/web-ui/modules/user-roles.js` falls back to `resolveRoleForTenant`, which runs `SELECT role FROM team_memberships WHERE tenant_id = $1 LIMIT 1` with no `ORDER BY`, so a person with no membership row in a tenant that already has members receives an arbitrary member's role, in practice often admin. Reproduced with the in-memory test database: an admin exists for `e2e-shared-org`, a brand-new person is created through the login path, and the resolved role is `admin`. Production has `TENANT_ORG_ALLOWLIST` set (secret name seen on the `skills-framework` app; value not read), so shared-tenant mode is active there.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [auth] [security]

## User Story

As **the operator of the platform, who relies on a person's role being their own**,
I want **a person who signs in to a shared tenant without a membership row of their own to be treated as an ordinary user**,
So that **no one is silently given another member's role (including admin), and a new person goes through the first-login plan selection as designed**.

## Benefit Linkage

**Metric moved:** the number of ways a person can obtain a role that no one assigned them falls from one (the arbitrary-row fallback) to zero; the E2E spec `bri-s3.6` AC1 changes from failing in every CI run to passing; the first-login redirect to `/welcome` is applied to a new person in a tenant that already has an admin.
**How:** both fallbacks in `resolveRoleForPerson` (an unknown identity, and a known person with no membership in that tenant) return `'user'` instead of calling `resolveRoleForTenant`. Roles that exist are untouched: a person with a membership still resolves to their own role, and a brand-new tenant's first sign-in still gets admin through the existing bootstrap, which writes a membership row.

## Architecture Constraints

- Change confined to `src/web-ui/modules/user-roles.js` (the two fallback returns and their comments), one new test, deliberate updates to any existing test that pins the old fallback, and artefacts. `src/` changes go through a pull request.
- `resolveRoleForTenant` stays exported and unchanged (existing tests and the legacy-named adapter use it); it is no longer called by `resolveRoleForPerson`.
- No schema change, no data change, no change to `routes/auth.js`, the admin bootstrap, `team-management.js`, the middleware, or the workflows. No database write is added.
- The role value returned is the same literal the module already uses as its default, `'user'`.
- **Not decided here:** whether a person who is in the allowlisted organisation but has no membership should get a membership row written at first sign-in. This story only stops the wrong role being handed out; it adds no row.
- **Operator go-ahead (2026-11-20, "Yes")** covers: the fix, and a read-only count on production of people with an identity but no membership (aggregate number only, no names or identifiers, nothing written). It does not cover reading or changing any production row, or changing anyone's role.

## Dependencies

- **Upstream:** tir-s1, tir-s7, tir-s9, tab-s1, tab-s3 (the role and bootstrap modules), bri-s3.3 and bri-s3.6 (the E2E specs that exposed it).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a tenant whose only membership is an admin, and a person who exists (created by the login path) but has no membership in that tenant, When `resolveRoleForPerson` runs for that person and tenant, Then it returns `'user'`.
**AC2:** Given a tenant with an admin, an engineer and a viewer, each with a membership, When `resolveRoleForPerson` runs for each of them, Then each gets their own role (`admin`, `engineer`, `viewer`) and not another person's.
**AC3:** Given a tenant that has members and an identity with no person row at all, When `resolveRoleForPerson` runs, Then it returns `'user'`.
**AC4:** Given a brand-new tenant with no members, When the first person signs in and the admin bootstrap runs, Then that person holds a membership and `resolveRoleForPerson` returns `'admin'` for them (unchanged behaviour).
**AC5:** Given `tests/e2e/bri-s3.6-auth-journey.spec.js` and `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` run in that order on one server (the order that fails today), When both run, Then `bri-s3.6` AC1 passes without any change to either spec.
**AC6:** Given the existing role-related tests (`check-tir-s1`, `tir-s5`, `tir-s6`, `tir-s7`, `tir-s9`, `rtri-s4`, `tab-s2`, `tab-s3`, `sec-perf-s2`), When they run, Then they pass, except any assertion that pinned the arbitrary-row fallback, which is updated deliberately and listed in the PR.
**AC7 (manual, recorded in the DoD):** Given production, When a read-only aggregate counts the people with a `person_identities` row and no `team_memberships` row, Then the DoD records that single number (and says plainly if it was not run), as the measure of how many people the old fallback could have affected.

## Out of Scope

- Writing a membership row at first sign-in, an invitation flow, or any change to who may join the allowlisted organisation.
- Reviewing or changing anyone's existing role in production.
- `routes/auth.js`, `team-management.js`, `require-admin.js`, and the billing and plan-selection flow.
- The other failing E2E specs (selector fixes are separate stories).

## NFRs

- **Security:** the default is the lowest privilege; a lookup failure or a missing row can never raise a role.
- **Compatibility:** no change for anyone who has a membership; the first admin of a new tenant is unchanged.
- **Safety:** the production check is read-only, aggregate, and counts only.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
