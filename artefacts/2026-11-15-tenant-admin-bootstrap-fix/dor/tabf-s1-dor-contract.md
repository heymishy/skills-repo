# Contract Proposal - Make the tenant-admin bootstrap statement valid on a real Postgres

**What will be built:**
- `src/web-ui/modules/tenant-admin-bootstrap.js`: in the claim statement of `bootstrapTenantAdminIfNeeded`, cast the parameters (`SELECT $1::varchar, $2::integer` and `tenant_id = $1::varchar`) so Postgres can type them. Nothing else changes (same single statement, same transaction, same second insert, same logging and return value).
- `tests/check-tabf-s1-bootstrap-real-postgres.js` (new): U1 (always runs) and P1 to P6 (real Postgres, gated by `TAB_TEST_DATABASE_URL`, local-host guard, SKIPPED when unset).

**What will NOT be built:**
- No change to roles, who is admin, the login flow, `auth.js`, `auth-email.js`, error capture, the migration functions or any table definition.
- No backfill of admins for tenants that have none; no CI Postgres service.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | P1 | integration-real-code (real Postgres) |
| AC2 | P2 | integration-real-code |
| AC3 | P3 | integration-real-code |
| AC4 | P4 | integration-real-code |
| AC5 | P5 (and P6 for races) | integration-real-code |
| AC6 | U1 plus the existing tab-s1 file and the full suite | unit and CI |
| AC7 | Verification scenario 7 | live (production-observed) |

**Assumptions:**
- `team_memberships.person_id` is INTEGER and `tenant_id` is VARCHAR (confirmed from `migrateTeamSchema`); the casts match.
- Docker is available at verify-completion (the operator starts Docker Desktop); without it the story cannot be verified.
- Shipping this changes production behaviour: bootstrap starts succeeding. The operator checks which tenants lack an admin before promotion (read-only query, approved first).

`schemaDepends: []` - reads no `pipeline-state.json` field.

**Estimated touch points:** Files: `src/web-ui/modules/tenant-admin-bootstrap.js` (modified, 2 lines), `tests/check-tabf-s1-bootstrap-real-postgres.js` (new). Services: throwaway local Postgres for verification. APIs: none.