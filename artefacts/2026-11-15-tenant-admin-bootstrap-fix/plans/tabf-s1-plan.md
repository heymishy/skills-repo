# Make the tenant-admin bootstrap statement valid on a real Postgres - Implementation Plan

> Executed in this session with /tdd (a two-line SQL change; two tasks).

**Goal:** the claim statement in `bootstrapTenantAdminIfNeeded` runs on a real Postgres and keeps its single race-safe shape.
**Branch:** `feature/tabf-s1-valid-bootstrap-statement`
**Worktree:** `.worktrees/tabf-s1-valid-bootstrap-statement` (verify this prefix before every edit)
**Test command:** `node tests/check-tabf-s1-bootstrap-real-postgres.js` with `TAB_TEST_DATABASE_URL` set to a throwaway local Postgres; the file prints SKIPPED without it.

## File map
```
Create:
  tests/check-tabf-s1-bootstrap-real-postgres.js - U1 (always) and P1 to P6 (real Postgres, gated, local-host guard)
Modify:
  src/web-ui/modules/tenant-admin-bootstrap.js    - the claim statement's parameters only (lines 69-75)
```

## Task 1: The tests, red (AC1 to AC5, AC6 structural)
- [ ] Start `docker run --rm -d --name tabf-pg -p 127.0.0.1:25432:5432 -e POSTGRES_PASSWORD=test postgres:16-alpine`; wait until it accepts connections.
- [ ] Write the test file (U1, P1 to P6) per the test plan; `freshDb()` refuses a non-local URL, builds the schema with the real `migrateTeamSchema` and `migrateTenantAdminBootstrapSchema`, drops and recreates only `tenant_admin_bootstrap` and `team_memberships`/`people` rows for its generated tenants.
- [ ] Run with the variable set: expect U1 FAIL (no casts), P1 PASS (characterises the defect), P2 FAIL (the call throws the P1 error), P3 to P6 FAIL or error for the same reason. Run without the variable: expect `1 failed` (U1) and 6 SKIPPED.
- [ ] Commit `test: tabf-s1 real-Postgres bootstrap tests (red)`.

## Task 2: The fix (green)
- [ ] In `src/web-ui/modules/tenant-admin-bootstrap.js` change `'SELECT $1, $2 WHERE NOT EXISTS ('` to `'SELECT $1::varchar, $2::integer WHERE NOT EXISTS ('` and `tenant_id = $1 AND role` to `tenant_id = $1::varchar AND role`. Change nothing else.
- [ ] Run the new file with the variable: 7 passed, 0 failed, 0 skipped. Run the existing `tests/check-tab-s1-tenant-admin-bootstrap.js`: unchanged result. Non-ASCII count 0; `git diff --stat` shows 1 src file and the new test.
- [ ] Commit `fix: type the bootstrap claim statement parameters so it runs on a real Postgres`.