# Contract Proposal: Bootstrap a brand-new tenant's first admin automatically on login

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
**Date:** 2026-09-28

---

## What will be built

- A new Postgres table `tenant_admin_bootstrap` (`tenant_id VARCHAR PRIMARY KEY`, `admin_person_id INTEGER`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`), migrated via a `CREATE TABLE IF NOT EXISTS` block in `server.js`'s startup migration sequence, matching `tenant_plan`'s own established convention.
- A new plain function `bootstrapTenantAdminIfNeeded(pool, tenantId, personId, logger)` in a new module `src/web-ui/modules/tenant-admin-bootstrap.js` — takes `pool` directly as a parameter, **not** a D37 injectable `setX()` adapter, matching this codebase's own established convention for this exact class of function (`addOrUpdateTeammate`, `listTeamMembers`, `backfillIdentityIfNeeded` all take `pool` directly).
- Implementation of the atomic transaction: `BEGIN`; `INSERT INTO tenant_admin_bootstrap (tenant_id, admin_person_id) VALUES ($1, $2) ON CONFLICT (tenant_id) DO NOTHING RETURNING admin_person_id`; if the returned row's `admin_person_id` matches `personId`, `INSERT INTO team_memberships ... ON CONFLICT (person_id, tenant_id) DO UPDATE SET role='admin'`; `COMMIT` (or `ROLLBACK` on any failure — the whole point of AC6).
- Wiring into all 3 real first-login call sites: `routes/auth.js`'s GitHub OAuth callback, `routes/auth.js`'s Google OAuth callback, `routes/auth-email.js`'s sign-up handler — called after `tenantId`/`personId` resolve, before role resolution completes for that request.
- An `admin_bootstrap_granted` audit log call (person id, tenant id, timestamp — never raw identity) on successful grant, matching `identity-links.js`'s own established logging convention.

## What will NOT be built

- No change to `resolveRoleForPerson`/`getRoleForTenant`'s own existing logic — the bootstrap is a new, separate call inserted into the login flow, not a modification of existing role-resolution functions.
- No UI/notification telling the new admin "you're now admin."
- No admin-demotion or transfer capability.
- No handling for pre-existing tenants that already have members — that is `tab-s2`'s job.
- No removal of the legacy `ADMIN_GITHUB_LOGINS`/`user_roles` path — that is `tab-s3`'s job; this story only adds the new mechanism.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Direct call to `bootstrapTenantAdminIfNeeded` against a fake pool with zero existing rows for a fresh `tenant_id` | unit |
| AC2 | Fake pool pre-seeded with an existing `tenant_admin_bootstrap` row (claimed by a different person) | unit |
| AC3 | Two concurrent calls via `Promise.all` against a fake pool with real `ON CONFLICT` emulation | unit |
| AC4 | Provider-agnostic unit test + 3 integration tests dispatching through the real GitHub/Google/email route handlers | unit + integration |
| AC5 | Fake pool pre-seeded with an existing real `role='admin'` row, no `tenant_admin_bootstrap` row present | unit |
| AC6 | Test hook forcing the `team_memberships` insert to fail after the `tenant_admin_bootstrap` insert succeeds; asserts both writes rolled back | unit |

## Assumptions

- `req.session.tenantId` and the resolving `personId` are both already available/resolvable at the point in the login flow where this bootstrap call is inserted — confirmed by reading `auth.js`/`auth-email.js` directly during `/review`, not assumed.
- The fake-pool convention established throughout this feature (narrow, self-contained, per-test-file, extended with `BEGIN`/`COMMIT`/`ROLLBACK` emulation) is the correct test infrastructure pattern — no new shared test-helper module needed.
- Postgres's real `ON CONFLICT (tenant_id) DO NOTHING RETURNING` behaves as designed in the actual deployed database — a standard, well-established Postgres feature, low risk.

## Estimated touch points

**Files:**
- `src/web-ui/modules/tenant-admin-bootstrap.js` (new)
- `src/web-ui/routes/auth.js` (modified — 2 call sites)
- `src/web-ui/routes/auth-email.js` (modified — 1 call site)
- `src/web-ui/server.js` (modified — new table migration + module wiring)
- `tests/check-tab-s1-tenant-admin-bootstrap.js` (new)

**Services:** None (in-process only).
**APIs:** None new.
