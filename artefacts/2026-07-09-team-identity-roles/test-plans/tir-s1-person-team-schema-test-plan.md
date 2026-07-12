## Test Plan: Person and team-membership schema replaces tenant-wide role lookup

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s1.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Migration creates `people`/`team_memberships` tables; idempotent rerun | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Legacy `user_roles` solo-tenant row migrates to new schema with role unchanged | — | 1 test | — | — | — | 🟢 |
| AC3 | Login role resolution reads the new schema path, not the legacy tenant-wide lookup | — | 1 test | — | — | — | 🟢 |
| AC4 | Full existing auth/billing/tenancy suite passes unmodified | — | — | — | 1 scenario | — | 🟢 |
| AC5 | Lazily creates a `team_memberships` row on first post-migration login for an unmigrated solo tenant | — | 1 test | — | — | — | 🟢 |
| AC6 (D37) | `server.js` wires the real person/team-scoped lookup as the adapter's production implementation, replacing the old tenant-wide query | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC4 is represented as a regression-baseline check (`node scripts/run-all-tests.js` diffed against `tests/known-baseline-failures.json`, per the established pcr-s1/bri-s2.5 pattern) rather than a new test — that mechanism already exists in this repo and is the correct tool for "did anything I didn't intend to touch break."

---

## Test Data Strategy

**Source:** Mocked (in-memory fake DB extending the existing `fake-test-db.js` pattern with `people`/`team_memberships` support, plus a synthetic legacy `user_roles` row for migration tests)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A test DB instance (mocked pool) with no prior tables | Synthetic | None | Asserts `CREATE TABLE IF NOT EXISTS` shape and idempotent rerun |
| AC2 | A synthetic legacy `user_roles` row (`tenant_id`, `role`) | Synthetic | None | Migration function run against this fixture |
| AC3 | Mocked new-schema adapter returning a known role for a known person/tenant pair | Mocked | None | Exercises `auth.js`/`auth-email.js`'s role-assignment call sites |
| AC4 | N/A — process-level regression check, not per-AC test data | N/A | None | Runs the existing full suite |
| AC5 | A synthetic legacy `user_roles` row with no corresponding `team_memberships` row | Synthetic | None | Exercises the lazy-creation path on login |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Migration bootstrap creates the expected table shape

- **Verifies:** AC1
- **Precondition:** Mocked pool with no `people`/`team_memberships` tables.
- **Action:** Call the migration bootstrap function directly.
- **Expected result:** The mocked pool receives `CREATE TABLE IF NOT EXISTS people (...)` and `CREATE TABLE IF NOT EXISTS team_memberships (person_id, tenant_id, role, created_at, PRIMARY KEY (person_id, tenant_id))` statements (or equivalent), and calling the bootstrap function a second time does not throw or issue conflicting statements.
- **Edge case:** No.

### `server.js` wires the new person/team-scoped adapter as the real production implementation

- **Verifies:** AC6 (D37 mandatory wiring)
- **Precondition:** `server.js` module loaded (not `NODE_ENV=test` stub-only — this test asserts the real wiring call itself, similar in spirit to how `check-arl-s1-user-roles.js` verifies arl-s1's own wiring).
- **Action:** Inspect the adapter-setter call site in `server.js` for the person/team-scoped role lookup.
- **Expected result:** The setter is called with a real query function reading from `team_memberships` (not the legacy `user_roles` tenant-wide query, and not left unwired/throwing in production mode).
- **Edge case:** No.

---

## Integration Tests

### Migration bootstrap is idempotent across a simulated server restart

- **Verifies:** AC1
- **Components involved:** Migration bootstrap function, mocked pool.
- **Precondition:** Migration bootstrap already run once against the mocked pool.
- **Action:** Run the migration bootstrap function a second time against the same mocked pool state.
- **Expected result:** No error thrown; no duplicate-table error surfaced.

### Legacy solo-tenant role migrates unchanged into the new schema

- **Verifies:** AC2
- **Components involved:** Migration bootstrap function, mocked pool seeded with one legacy `user_roles` row (`tenant_id: 'acme'`, `role: 'admin'`).
- **Precondition:** Legacy row exists; new schema tables are empty.
- **Action:** Run the migration.
- **Expected result:** A `people` row and a `team_memberships` row exist for `acme`, with `role` still exactly `'admin'` — no value drift during the copy.

### Login resolves `req.session.role` via the new schema, not the legacy tenant-wide lookup

- **Verifies:** AC3
- **Components involved:** `auth.js`/`auth-email.js` login handlers, new person/team-membership role-lookup adapter (mocked to return a known role), spy on the legacy `getUserRole(tenantId)` call.
- **Precondition:** Mocked new-schema adapter returns `'engineer'` for a known person/tenant pair; legacy `getUserRole` spy in place.
- **Action:** Complete a login via each of the 3 providers (GitHub, Google, email/password) with a session mapping to that known person/tenant pair.
- **Expected result:** `req.session.role` resolves to `'engineer'`; the legacy `getUserRole(tenantId)` spy is never called.

### Unmigrated solo tenant gets a lazily-created `team_memberships` row on first post-migration login

- **Verifies:** AC5
- **Components involved:** Login handler, new-schema adapter, mocked pool seeded with a legacy `user_roles` row but no `team_memberships` row for that tenant.
- **Precondition:** Legacy row exists (`tenant_id: 'legacy-tenant'`, `role: 'admin'`); no `team_memberships` row yet for that tenant.
- **Action:** That tenant's user logs in.
- **Expected result:** Login succeeds (does not error or default to a different role); a `team_memberships` row is created for `legacy-tenant` with `role: 'admin'`, matching the legacy value.

---

## NFR Tests

### Zero privilege change during the schema migration

- **NFR addressed:** Security
- **Measurement method:** Compare each seeded solo tenant's role value immediately before migration to its `team_memberships` role value immediately after — covered directly by the "Legacy solo-tenant role migrates unchanged" integration test above; no separate test needed.
- **Pass threshold:** 100% of migrated roles exactly match their pre-migration value — zero escalations, zero de-escalations.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s1-person-team-schema.js`.

### Performance

- **NFR addressed:** Performance — no specific numeric threshold identified for migration startup time (per NFR profile: "monitor at implementation"). No dedicated test written.

### Audit

- **NFR addressed:** Audit (schema migration logged at startup)
- **Measurement method:** Assert the migration bootstrap function calls the logger with an info-level message identifying the migration, matching the existing `journey-store-pg.js` convention.
- **Pass threshold:** Exactly one log call per migration run, containing an identifiable migration name.
- **Tool:** Hand-rolled Node.js assertion (spy on the injected logger).

---

## Out of Scope for This Test Plan

- Testing the many-to-many person↔team schema's UI (no UI exists — schema-only story).
- Historical/audit-event backfill — story explicitly does not migrate history, only current role state.
- Legacy `user_roles` table removal — story does not decide whether/when to drop it.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real production migration behaviour against the actual live `user_roles` table content | No live customers exist pre-launch (per discovery); this test plan validates the migration function's logic against synthetic fixtures, not real production data | Re-verify against a real staging database once one exists (Epic 2 precedent), before any future production migration of this kind is attempted with real data |
