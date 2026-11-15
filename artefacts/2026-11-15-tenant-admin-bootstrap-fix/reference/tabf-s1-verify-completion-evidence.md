# tabf-s1 verify-completion evidence (2026-11-15)

**Story:** Make the tenant-admin bootstrap statement valid on a real Postgres so a new tenant's first user can be granted admin
**Branch:** `feature/tabf-s1-valid-bootstrap-statement`, verified at commit `a6d698a4e` (2 commits on top of `1ae1a492c`; `src/web-ui/modules/tenant-admin-bootstrap.js` 2 insertions and 2 deletions, new `tests/check-tabf-s1-bootstrap-real-postgres.js`)
**Run on:** Windows 11, Node 22, Docker Desktop with a throwaway `postgres:16-alpine` container bound to 127.0.0.1:25432 (still running; stopped at the end of the session)

| Check | Result |
|---|---|
| Red run (commit 494a8e8a3, unfixed statement, real Postgres) | 1 passed (P1), 6 failed: U1, and P2 to P6 each failed with the exact production error `inconsistent types deduced for parameter $1` raised by the real `bootstrapTenantAdminIfNeeded` |
| `node tests/check-tabf-s1-bootstrap-real-postgres.js` after the fix, with `TAB_TEST_DATABASE_URL` set | 7 passed, 0 failed, 0 skipped |
| Same file without the variable | 1 passed, 0 failed, 6 skipped (a skip is not a pass; the real-database run above is the evidence) |
| `node tests/check-tab-s1-tenant-admin-bootstrap.js` (existing pool-double tests) | unchanged: 14 passed, 0 failed |
| `npm test` full suite with the variable set | 854 files, 4 failed, all on the acknowledged baseline: pipeline-state integrity (tfhc-s1), p3.5 (PowerShell), pcr-s1 (timing), rtvap-s1 (no WSL bash). The new file passed 7 of 7 inside the suite. No new failures. |
| Non-ASCII | test file 0; source file 1, already present at HEAD (an existing comment character), none added |

| AC | Evidence | Result |
|---|---|---|
| AC1 real database rejects the old statement | P1 | Verified (integration-real-code, real Postgres) |
| AC2 fresh tenant gets an admin, both rows written | P2 | Verified (real Postgres) |
| AC3 second login is a no-op | P3 | Verified (real Postgres) |
| AC4 existing admin never overridden, no bootstrap row | P4 | Verified (real Postgres) |
| AC5 tenant scoping not widened (and concurrent first logins) | P5, P6 | Verified (real Postgres) |
| AC6 existing tests and suite unchanged | U1, the existing tab-s1 file, the full suite | Verified |
| AC7 live: production login logs no `tenant_admin_bootstrap_failed` | Needs merge, the activation check and a production deploy | Not yet verified (live) |

6 of 7 acceptance criteria verified; AC7 is live-only.

## Independent review (one reviewer, whole diff)

- Code: correct. Casts match the real column types (`tenant_id` VARCHAR, `admin_person_id` INTEGER); `personId` always comes from a SERIAL `people.id`, so `$2::integer` cannot fail for real callers; the single-statement race-safe shape is preserved; the local-host guard in `freshDb` cannot drop tables on a non-local host.
- **Activation risk (MEDIUM, the reason this story is Medium oversight):** bootstrap has never worked, so no tenant has a `tenant_admin_bootstrap` row. Production has `TENANT_ORG_ALLOWLIST` set (name confirmed from `fly secrets list`, value not read), so tenants there are shared GitHub organisations. Any tenant that already has members but no admin row will make the first member to log in after the deploy its admin. Solo tenants (own login, Google sub, email) are safe: the first login becomes admin of its own tenant, as designed.
- LOW (reviewer's claim, not independently verified): a GitHub username consisting only of digits could equal a not-yet-bootstrapped Google user's `sub`, giving that user the same tenant id; the data sharing already exists today and this change adds admin to it.
- LOW: no test covers "members present, no admin row" (the case that would grant); suggested optional P-test.

## Required before production promotion
A read-only production query listing tenants that have `team_memberships` rows but no admin row (for example `SELECT tenant_id, count(*) FROM team_memberships GROUP BY tenant_id HAVING bool_and(role <> 'admin')`), run only with the operator's explicit approval, printing no credentials and writing nothing. For each tenant it lists, either insert a correct admin by hand or insert a `tenant_admin_bootstrap` row to block the automatic grant, BEFORE promoting this change.