## Implementation Plan: tir-s1 — Person and team-membership schema replaces tenant-wide role lookup

**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s1.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s1-person-team-schema-test-plan.md
**DoR contract:** artefacts/2026-07-09-team-identity-roles/dor/tir-s1-dor-contract.md

---

### Design decision (judgment call — flagged for PR review)

The DoR contract's Assumptions section states the new adapter should reuse the D37 throw-on-unwired contract and prefers "extending in place... over a parallel adapter" to avoid "a second, parallel isolation/lookup mechanism" (this refers to ADR-025 tenant-scoping, not to D37 function naming). Story AC6 and Architecture Constraints separately describe this as "an equivalent adapter for the new lookup" (implying a distinct adapter from the existing `getUserRole`/`setGetUserRole`), and the test plan's own AC3 integration test requires spying on "the legacy `getUserRole(tenantId)` call" and asserting it is *never* called when the new adapter resolves the role — which is only meaningful if the new adapter is a genuinely separate function.

Decision: add a new, distinct D37 adapter pair — `getRoleForTenant` / `setGetRoleForTenant` — inside the *same* `user-roles.js` file (no new module/file, satisfying "no parallel adapter" at the file level). `getUserRole`/`setGetUserRole` are left completely untouched (existing behaviour, existing tests unaffected when called directly).

Constraint driving this: many existing tests (`check-arl-s1-user-roles.js` T3, `check-arl-s4-admin-billing-bypass.js`, `check-bri-s3.6-auth-journey.js`) wire *only* the legacy `setGetUserRole` and expect `req.session.role` to resolve correctly through `auth.js`/`auth-email.js` — this is AC4, a hard "must not modify assertions" requirement. To satisfy both ACs simultaneously, `getRoleForTenant`'s stub default (when `setGetRoleForTenant` has not been called) falls back to the legacy `getUserRole` *if that has been wired* — and only throws (D37-compliant) if neither adapter has been wired. This is not a silent/empty-value stub — it is an explicit delegation to another real, wired adapter, preserving the spirit of D37 (misconfiguration is never masked by fake data) while giving pre-tir-s1 tests a working code path with zero modification. In production, `server.js` (AC6) always wires `setGetRoleForTenant`, so the fallback branch is dead in production and only serves old test callers.

---

### Tasks

1. **RED — write the failing test file** `tests/check-tir-s1-person-team-schema.js` (7 tests per the test plan: 2 unit, 4 integration, 1 NFR/audit). Confirm all 7 fail for the right reason (missing exports/behaviour), not typos.

2. **GREEN — schema bootstrap + backfill** (`src/web-ui/modules/user-roles.js`): add `migrateTeamSchema(pool, logger)` (creates `people` + `team_memberships` via `CREATE TABLE IF NOT EXISTS`, then backfills every legacy `user_roles` row, skipping tenants already migrated — idempotent) and the internal `resolveRoleForTenant(pool, tenantId)` helper (team_memberships lookup, falling back to a lazy legacy-migrate-on-miss path per AC5, defaulting to `'user'` if neither table has a row). Satisfies AC1, AC2, AC5, and the Audit NFR test.

3. **GREEN — the new D37 adapter + call-site rewiring** (`src/web-ui/modules/user-roles.js`, `src/web-ui/routes/auth.js`, `src/web-ui/routes/auth-email.js`): add `getRoleForTenant`/`setGetRoleForTenant` (throw-on-unwired, legacy-fallback bridge as above). Update the 4 login call sites (`handleAuthCallback`, `handleAuthGoogleCallback` in `auth.js`; `handleEmailSignup`, `handleEmailLogin` in `auth-email.js`) from `_userRoles.getUserRole(...)` to `_userRoles.getRoleForTenant(...)`. Satisfies AC3.

4. **GREEN — server.js production wiring (AC6, separate task per D37)** (`src/web-ui/server.js`): leave the existing arl-s1 `setGetUserRole` block completely untouched (legacy adapter stays wired but is no longer called by any production code path — matches "leave the legacy table/adapter in place, unused"). Add a new block: `setGetRoleForTenant(tenantId => resolveRoleForTenant(_userRolesPool, tenantId))`, and chain `migrateTeamSchema(_userRolesPool)` to run *after* the existing `user_roles` table-creation + arl-s4 admin-seeding promise settles (so the backfill picks up admin-seeded rows too). Satisfies AC6.

5. **Full regression check** — `node scripts/run-all-tests.js`, diffed against the pre-change baseline captured before any edits and against `tests/known-baseline-failures.json`. Zero new failures required (AC4).

6. **/verify-completion** — confirm all 6 ACs verified, all 7 new tests passing, 0 regressions.

7. **/branch-complete** — push, open draft PR, stop (no merge).

---

### Touch points

- `src/web-ui/modules/user-roles.js` (extended in place)
- `src/web-ui/routes/auth.js` (2 call sites updated)
- `src/web-ui/routes/auth-email.js` (2 call sites updated)
- `src/web-ui/server.js` (new wiring block added, task 4, separate from tasks 2/3 per D37)
- `tests/check-tir-s1-person-team-schema.js` (new)

### Out of scope (unchanged from story)

No UI, no historical/audit-event backfill, no removal of the legacy `user_roles` table.
