## Test Plan: Make the tenant-admin bootstrap statement valid on a real Postgres so a new tenant's first user can be granted admin

**Story reference:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/stories/tabf-s1-valid-bootstrap-statement.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node assert scripts. New file: `tests/check-tabf-s1-bootstrap-real-postgres.js`. Existing file `tests/check-tab-s1-tenant-admin-bootstrap.js` stays unchanged.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real Postgres rejects the old statement with the exact error | - | 1 (P1, real DB) | - | - | - | 🟢 |
| AC2 | Fresh tenant is granted admin; rows written | - | 1 (P2, real DB) | - | - | - | 🟢 |
| AC3 | Already-bootstrapped tenant: no-op | - | 1 (P3, real DB) | - | - | - | 🟢 |
| AC4 | Tenant with an existing admin: no-op, no bootstrap row | - | 1 (P4, real DB) | - | - | - | 🟢 |
| AC5 | A second tenant is not affected | - | 1 (P5, real DB) | - | - | - | 🟢 |
| AC5+ | Two simultaneous first logins: exactly one admin | - | 1 (P6, real DB) | - | - | - | 🟢 |
| AC6 | Existing tab-s1 tests and the whole suite still pass | 1 (U1 structural) | - | - | 1 (run the suite) | - | 🟢 |
| AC7 | Live: no `tenant_admin_bootstrap_failed` on production login | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Real-database tests need Docker, which CI does not have | AC1-AC5 | Environment | P1 to P6 print SKIPPED without `TAB_TEST_DATABASE_URL` (a skip is not a pass) and are run explicitly at `/verify-completion` with a throwaway local Postgres; U1 always runs in CI as a cheap structural guard. A CI Postgres service is the already-noted follow-up. This is a classification, not an accepted risk: the story is not verified until P1 to P6 have actually run. |
| Needs deployed production and an operator login | AC7 | Live-only | Verification scenario 7, `production-observed`. |

No layout-dependent ACs.

## Test Data Strategy

**Source:** Synthetic, against a throwaway local Postgres 16 container bound to 127.0.0.1 (the coha-s6 pattern). Schema is created by the REAL migration functions (`migrateTeamSchema` from `src/web-ui/modules/user-roles.js` and `migrateTenantAdminBootstrapSchema`), never hand-written DDL, so the test uses the production tables exactly. Tenants and people are created per test with generated ids (`tabf-<random>`); every test drops and recreates the two bootstrap tables via a `freshDb()` helper that REFUSES to run unless the URL host is local (same guard as coha-s6). **PCI/sensitivity:** No. **Owner:** self-contained.

## Integration Tests (real Postgres, in `tests/check-tabf-s1-bootstrap-real-postgres.js`)

- **P1 - the old statement is rejected by a real database (AC1).** Run the verbatim old claim statement (copied into the test as a constant, with a comment naming the commit it came from) with parameters `['t', 1]`. Expected: the query rejects with a message containing `inconsistent types deduced for parameter $1`. This is a characterisation of the defect: it passes before and after the fix, and exists so the root cause stays pinned.
- **P2 - a fresh tenant gets an admin (AC2).** Create a person; call `bootstrapTenantAdminIfNeeded(pool, tenantId, personId)`. Expected: `{ granted: true }`; one `tenant_admin_bootstrap` row with that person; one `team_memberships` row with role `admin`. **Fails before the fix** (the call throws the P1 error). This is the red state.
- **P3 - second call is a no-op (AC3).** Call again for the same person, then for a second person. Expected: both `{ granted: false }`; still one bootstrap row; the second person has no membership.
- **P4 - an existing admin wins (AC4).** Insert a `team_memberships` admin row for the tenant by other means, then call. Expected: `{ granted: false }` and NO `tenant_admin_bootstrap` row.
- **P5 - tenants are isolated (AC5).** Bootstrap tenant A. Expected: tenant B has no bootstrap row and no admin; bootstrapping B then grants B's own person.
- **P6 - concurrent first logins (race safety).** Start two calls for different people on the same fresh tenant with `Promise.all`. Expected: exactly one `{ granted: true }`, one `{ granted: false }`, one bootstrap row, exactly one admin membership.

## Unit Tests

- **U1 - structural guard, always runs (AC6, and a cheap CI guard for AC1).** Read `src/web-ui/modules/tenant-admin-bootstrap.js` and assert that the claim statement carries explicit parameter casts (`$1::varchar` and `$2::integer`) and still contains `WHERE NOT EXISTS`, `ON CONFLICT (tenant_id) DO NOTHING` and `RETURNING admin_person_id` (the single-statement race-safe shape is preserved). Reads the file with line endings normalised (learnings D61).

## NFR Tests

- **NFR-SEC1:** P4 and P5 above (an existing admin is never overridden; tenant scoping is not widened).
- **NFR-PERF1:** the existing tab-s1 NFR test (exactly 4 queries) must still pass unchanged; that is the guard that the fix did not add queries.
- Cost: none.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Casts could still disagree with the real column types (for example the person id column) | Only a real database proves it | P2 to P6 run the real statement against the real tables |
| CI never runs P1 to P6 | No Postgres in CI | Run explicitly at verify-completion; follow-up story for a CI Postgres service |

**Total automated tests:** 7 (1 always-run, 6 real-database). Expected counts: without a database, `1 passed, 0 failed, 6 skipped`; with one, `7 passed, 0 failed, 0 skipped`.