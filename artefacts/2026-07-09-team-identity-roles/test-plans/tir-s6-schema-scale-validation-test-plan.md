## Test Plan: Team-membership lookups stay indexed at ~100 members per tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s6.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Query plan uses an index at 100 rows, not a full scan | — | 1 test | — | — | External-dependency | 🟡 |
| AC2 | Lookup query executes under 50ms at 100 rows | — | 1 test | — | — | External-dependency | 🟡 |
| AC3 | 1-member tenant lookup unaffected (regression) | 1 test | — | — | — | — | 🟢 |
| AC4 | 100-row batch insert doesn't degrade vs. sequential inserts | — | 1 test | — | — | External-dependency | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable pre-implementation | Handling |
|-----|----|----------|--------------------------------------|---------|
| A real Postgres `EXPLAIN` query plan cannot be produced by this repo's in-memory `fake-test-db.js` mock — it has no query planner | AC1, AC2, AC4 | External-dependency | This repo's existing unit/integration tests always mock `pool.query` and never hit a real database; a real query-plan/timing assertion requires an actual Postgres connection | Per the operator's confirmed decision (2026-07-13): these three tests run for real (seed 100 rows, run `EXPLAIN`, assert index usage and timing) only when `DATABASE_URL` is set in the test environment — same convention as bri-s2.2's Neon staging branch. When `DATABASE_URL` is absent, these tests are skipped with an explicit, visible skip message (never silently passed) so CI never reports false confidence |

---

## Test Data Strategy

**Source:** Seeded database (real Postgres, gated by `DATABASE_URL`) for AC1/AC2/AC4; Mocked (`fake-test-db.js`) for AC3
**PCI/sensitivity in scope:** No
**Availability:** Dependency — see gap note below
**Owner:** Self-contained when `DATABASE_URL` is set in the test environment; otherwise the gap is logged, not silently treated as passing

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | 100 synthetic `team_memberships` rows in a real Postgres instance | Seeded database | None | Requires `DATABASE_URL` |
| AC2 | Same 100-row seed | Seeded database | None | Requires `DATABASE_URL` |
| AC3 | A single `team_memberships` row (1-member tenant) | Mocked | None | Runs against `fake-test-db.js`, no real DB needed |
| AC4 | 100 synthetic rows inserted as one batch vs. 100 sequential inserts, both against a real Postgres instance | Seeded database | None | Requires `DATABASE_URL` |

### PCI / sensitivity constraints

None.

### Gaps

**TEST DATA GAP:** AC1, AC2, and AC4 require a real Postgres connection (`DATABASE_URL`) to produce meaningful query-plan and timing evidence — this is not available in a plain `npm test` run with no database configured. This is a dependency before these three tests produce real evidence, not before the coding agent can write them. Logged here per Step 3; the operator has confirmed (2026-07-13) the handling: run for real when `DATABASE_URL` is set, skip with a visible message otherwise. No RISK-ACCEPT needed beyond this documented decision, since the alternative (mocking a canned "used index" result) was explicitly rejected as providing false confidence.

---

## Unit Tests

### Single-member tenant lookup is unaffected by the schema/indexing change

- **Verifies:** AC3
- **Precondition:** Mocked `fake-test-db.js` seeded with exactly one `team_memberships` row for tenant `solo-acme`.
- **Action:** Run the role/team-membership lookup query for that tenant.
- **Expected result:** Returns the correct single row; behaviour and interface are unchanged from before this story's indexing work — no dependency on a real DB for this assertion.
- **Edge case:** No.

---

## Integration Tests

### Role lookup at 100 members uses an index, not a full table scan

- **Verifies:** AC1
- **Components involved:** `team_memberships` table (real Postgres, gated by `DATABASE_URL`), the lookup query.
- **Precondition:** `DATABASE_URL` is set; 100 synthetic `team_memberships` rows seeded for one tenant.
- **Action:** Run `EXPLAIN` (or the Postgres-appropriate equivalent) against the lookup query for a specific person+tenant pair.
- **Expected result:** The query plan shows an index scan, not a sequential/full-table scan. **If `DATABASE_URL` is not set: test is skipped with an explicit "skipped — no DATABASE_URL, cannot verify query plan" message, not silently marked passing.**

### Role lookup at 100 members completes under 50ms

- **Verifies:** AC2
- **Components involved:** Same as above.
- **Precondition:** Same 100-row seed; `DATABASE_URL` set.
- **Action:** Time the lookup query's execution.
- **Expected result:** Execution time is under 50ms. **Same skip behaviour as AC1 if `DATABASE_URL` is absent.**

### Batch-inserting 100 members does not degrade compared to 100 sequential inserts

- **Verifies:** AC4
- **Components involved:** `team_memberships` table (real Postgres), insert path (shared with tir-s5's bulk-add).
- **Precondition:** `DATABASE_URL` set; empty `team_memberships` table for a fresh tenant.
- **Action:** Insert 100 rows as one batch; separately, time 100 sequential single-row inserts for comparison.
- **Expected result:** Batch insert completes without timing out and is not noticeably slower than the sequential baseline (no order-of-magnitude regression). **Same skip behaviour as AC1/AC2 if `DATABASE_URL` is absent.**

---

## NFR Tests

### Performance (this story's entire purpose)

- **NFR addressed:** Performance — indexed lookups at 100 members/tenant, under 50ms
- **Measurement method:** Directly covered by the "Role lookup at 100 members completes under 50ms" integration test above — no separate NFR test needed.
- **Pass threshold:** Under 50ms, confirmed by the operator (2026-07-12) as the firm target.
- **Tool:** Real Postgres `EXPLAIN ANALYZE` or equivalent timing capture, gated by `DATABASE_URL`.

---

## Out of Scope for This Test Plan

- Real load testing against concurrent traffic — this plan validates single-request query-plan/timing correctness at 100 rows, not concurrent throughput.
- Testing beyond 100 members — ~100 is discovery's stated soft ceiling; not validated at 1,000+.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1/AC2/AC4 produce no real evidence when `DATABASE_URL` is unset (e.g. a contributor's local machine with no Postgres configured) | This repo's default `npm test` run has no database dependency by design | Tests skip visibly rather than silently pass; CI environment for this story must have `DATABASE_URL` set (e.g. via a Neon staging branch, matching bri-s2.2's precedent) for these three tests to produce real signal before /definition-of-ready sign-off |
