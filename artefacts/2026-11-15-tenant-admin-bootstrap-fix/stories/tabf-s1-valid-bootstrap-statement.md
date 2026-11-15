## Story: Make the tenant-admin bootstrap statement valid on a real Postgres so a new tenant's first user can be granted admin

**Epic reference:** None - short-track (bounded defect fix found by the first real production error, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-09-26-tenant-admin-bootstrap/` (story tab-s1). Found by: PostHog issue 01a1ddc2-f17b-7c23-900b-0558af68b822, GitHub issue #1101, record pull request #1102 (2026-11-15).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, data, auth]

## User Story

As **a person logging in as the first user of a brand-new tenant**,
I want **the bootstrap step that makes me the tenant's admin to actually run**,
So that **new tenants get an admin as tab-s1 intended, instead of the step failing on every login with a database error that is only logged and never surfaces**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Directly closes the unmet intent of tab-s1 (a brand-new tenant's first user is granted admin) on a real database.
**How:** `bootstrapTenantAdminIfNeeded` (src/web-ui/modules/tenant-admin-bootstrap.js, lines 69-75) prepares a statement that uses `$1` twice: as a select-list value inserted into `tenant_id VARCHAR`, and in `WHERE tenant_id = $1` inside the NOT EXISTS subquery. On a real Postgres the parameter cannot be given one type, so the statement fails every time it is prepared with `inconsistent types deduced for parameter $1`. The failure is caught by the caller (`_bootstrapTenantAdmin` in auth.js and auth-email.js), logged as `tenant_admin_bootstrap_failed` and sent to error capture; login carries on. Evidence: 207 staging events and the real production error at 05:51 UTC on 2026-11-15 (tenant heymishy). The existing tab-s1 tests use a pool double, so they never prepared the statement against Postgres.

## Architecture Constraints

- **Smallest fix that keeps the single-statement design.** Give the parameters explicit types in the SQL (for example `$1::varchar` and `$2::integer`) so the statement keeps its documented race-safe shape (one claim statement, `WHERE NOT EXISTS ... ON CONFLICT DO NOTHING RETURNING`) and the NFR performance test's exact query count is unchanged. No change to the transaction structure, the second insert, the logging or the returned shape.
- **A real database proves it, a double cannot.** The proof is a test that runs the real statement against a real Postgres, gated by an environment variable exactly as coha-s6 does (`COHA_S6_TEST_DATABASE_URL` pattern; for this story `TAB_TEST_DATABASE_URL`), printing SKIPPED when unset (a skip is not a pass) and run explicitly at verification. CI does not have Postgres; adding a CI Postgres service is a separate, already-noted follow-up.
- **The fix changes behaviour in production for the first time.** Because the step has never succeeded on a real database, shipping it will start granting admin to the next first-user of any tenant that has no admin yet. That is the designed behaviour, but it must be a known, reviewed change: before production promotion the operator confirms which tenants currently have no admin and who would be granted it (read-only query, approved first).
- **Mock-shape rule (CLAUDE.md):** the existing pool-double tests stay as they are; the real-Postgres test is the evidence. The real error message is quoted in the failing-first test.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-025 (multi-tenancy at the application layer) applies: the fix must not widen tenant scoping (the statement stays keyed on `tenant_id`, and a test proves a second tenant is unaffected); ADR-011 (artefact-first) is satisfied by this story's own chain.
- **Zero new npm dependencies** (`pg` is already a dependency).

## Dependencies

- **Upstream:** tab-s1 (merged). Docker Postgres for the verification run (operator starts Docker; throwaway container bound to 127.0.0.1, as for coha-s6).
- **Operator involvement:** merge; the tenants-without-admin check before production promotion; production promotion; closing issue #1101 after the fix is live; merging or closing record pull request #1102.

## Acceptance Criteria

**AC1:** Given a real Postgres with the `tenant_admin_bootstrap` and `team_memberships` tables, When the CURRENT statement is prepared and run, Then it fails with `inconsistent types deduced for parameter $1` (a test that fails first against the unfixed code; this is the red state).

**AC2:** Given a tenant with no admin, When `bootstrapTenantAdminIfNeeded(pool, tenantId, personId)` runs against the real Postgres, Then it returns `{ granted: true }`, a `tenant_admin_bootstrap` row exists for the tenant with that person, and a `team_memberships` row has role `admin` for that person and tenant.

**AC3:** Given the tenant is already bootstrapped, When the function runs again for the same or a different person, Then it returns `{ granted: false }` and writes nothing new (race-safe no-op preserved).

**AC4:** Given a tenant that already has an admin granted by other means (a `team_memberships` row with role `admin`), When the function runs, Then it returns `{ granted: false }` and creates no `tenant_admin_bootstrap` row.

**AC5:** Given two tenants, When the first is bootstrapped, Then the second tenant has no bootstrap row and no admin (tenant scoping not widened).

**AC6:** Given the existing tab-s1 test file and the whole `check-*.js` suite, When they run, Then every test that passed before still passes (the pool-double tests included, with the query-count NFR unchanged).

**AC7 (live, after deploy):** Given the fix is on production, When the operator logs in as a first user of a tenant, Then the log shows no `tenant_admin_bootstrap_failed` line and PostHog receives no new `$exception` for it; the operator then closes GitHub issue #1101. Evidence class `production-observed`.

## Out of Scope

- Any change to who is allowed to be admin, to roles, or to the login flow.
- Backfilling admins for tenants that have none (a separate decision after the operator sees the list).
- Adding Postgres to CI.
- Any change to the incident record workflow or to error capture.

## NFRs

- **Security:** the change widens nothing; AC4 and AC5 are the tenant-isolation and "does not override an existing admin" checks. Granting admin for the first time in production is a reviewed behaviour change (see Architecture Constraints).
- **Performance:** unchanged query count (4); the existing NFR test is a regression guard.
- **Correctness:** AC1 must fail on the unfixed code, so the real-database proof cannot pass vacuously.

## Complexity Rating

**Rating:** 2 - the SQL change is tiny, but the proof needs a real database and the production behaviour change needs a review step.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity (AC1 to AC5 against a real Postgres; AC7 a live log check)
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic