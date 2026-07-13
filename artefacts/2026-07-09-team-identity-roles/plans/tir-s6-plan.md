## Implementation Plan: tir-s6 — Team-membership lookups stay indexed at ~100 members per tenant

**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s6.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s6-schema-scale-validation-test-plan.md
**DoR contract:** artefacts/2026-07-09-team-identity-roles/dor/tir-s6-dor-contract.md

---

### Design decision (judgment call — flagged for PR review)

The DoR contract's Assumptions section asks the first task to confirm whether tir-s1's existing `PRIMARY KEY (person_id, tenant_id)` on `team_memberships` (shipped in PR #463, `src/web-ui/modules/user-roles.js`) already satisfies AC1's indexing requirement before assuming a new index is needed. Reading `migrateTeamSchema` directly confirms the table is declared with `PRIMARY KEY (person_id, tenant_id)`. Postgres always backs a `PRIMARY KEY` with a unique btree index over exactly its declared column(s), in declared order. tir-s7's `resolveRoleForPerson` (the current production lookup path, PR #467) queries `team_memberships` with `WHERE person_id = $1 AND tenant_id = $2` — an exact match on both primary-key columns in the same order the index is built on.

Decision: **no schema change, no new index.** The existing composite primary key already provides exactly the index this story's AC1/AC2 require. This story is test-only: it adds the `DATABASE_URL`-gated evidence (real `EXPLAIN`, real timing, real batch-insert comparison) that proves this is true at 100-row scale, per the RISK-ACCEPT decision (decisions.md, 2026-07-13). If the real-Postgres run ever showed a sequential scan instead, that would indicate a Postgres planner choosing not to use the index at low row counts (a known Postgres behaviour below its cost-based threshold, not a missing index) — out of scope to chase further per the story's Out of Scope section, and not expected at 100 rows with no other complicating factors.

This matches the DoR contract's own framing ("Whatever index (or confirmation an existing one suffices)...") — confirmation is the expected and sufficient outcome here.

---

### Tasks

1. **RED — write the failing test file** `tests/check-tir-s6-schema-scale-validation.js`:
   - AC3 (unit, unconditional): mocked in-memory pool (narrow, explicit branches, following `check-tir-s7-person-scoped-login-resolution.js`'s `makeFakePool` convention) with exactly one `team_memberships` row for a solo tenant; call the production lookup path (`resolveRoleForPerson`) and assert it returns the correct role, unaffected by anything this story does.
   - AC1/AC2/AC4 (integration, `DATABASE_URL`-gated): a single `describe`-less block that, at file-load time, checks `process.env.DATABASE_URL`. If unset: print `[tir-s6] SKIPPED: DATABASE_URL not set, cannot verify query plan` (and equivalent messages for AC2/AC4) and record 3 explicit skips — never silently passed, never counted as failed. If set: open a real `pg.Pool` (mirroring `scripts/smoke-test-pg.js`'s connection pattern), run `migrateTeamSchema` to ensure the schema exists, seed 100 synthetic `team_memberships` rows for one fresh synthetic tenant, then:
     - AC1: `EXPLAIN` the `SELECT role FROM team_memberships WHERE person_id = $1 AND tenant_id = $2` lookup, assert the plan text contains an index-scan node type and not a sequential scan.
     - AC2: time the same lookup with `Date.now()` around the query, assert elapsed `< 50`ms.
     - AC4: insert 100 rows as one batched multi-row `INSERT`, time it; separately time 100 sequential single-row inserts for a second fresh tenant; assert the batch path completes and is not an order-of-magnitude slower than the sequential baseline (and does not time out).
     - Clean up all seeded rows/tenants in a `finally` block; close the pool.
   Confirm the file fails for the right reason before implementation (AC3 fails on missing/incorrect fixture wiring if applicable; AC1/2/4 report as explicit skips in this sandbox with no `DATABASE_URL`, which is the expected/correct state, not a failure to fix).

2. **No production code changes** — per the design decision above, `src/web-ui/modules/user-roles.js` needs no new index or schema statement. This task is a no-op by design; noted explicitly so `/verify-completion` doesn't look for a missing schema diff.

3. **GREEN — confirm test file passes in this sandbox's actual conditions**: AC3 passes for real (no `DATABASE_URL` needed). AC1/AC2/AC4 correctly skip with visible messages (no `DATABASE_URL` available in this environment) — this is the correct, gated behaviour per the RISK-ACCEPT, not a gap to fix.

4. **Full regression check** — `node scripts/run-all-tests.js`, diffed against `tests/known-baseline-failures.json` (69 known pre-existing failures + the documented `check-md-3-adr.js` Windows/Linux CI split). Zero *new* failures required.

5. **/verify-completion** — confirm all 4 ACs verified (AC3 for real; AC1/AC2/AC4 verified as correctly-gated-and-skipping in this sandbox), 0 new regressions.

6. **/branch-complete** — push, open draft PR noting the DATABASE_URL-gated tests could not be run for real in this sandbox and must be run at least once against a real Postgres environment before the story is considered fully verified in practice (per the DoR's Oversight note), then stop (no merge).

---

### Touch points

- `tests/check-tir-s6-schema-scale-validation.js` (new — the only file this story adds)

### Out of scope (unchanged from story)

No real concurrent-traffic load testing. No validation beyond 100 members. No schema change (per design decision above — existing composite primary key already satisfies AC1).
