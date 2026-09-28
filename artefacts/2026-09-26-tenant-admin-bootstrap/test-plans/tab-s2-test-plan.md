## Test Plan: Backfill admin for every existing real tenant that has members but no admin

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s2.md
**Epic reference:** artefacts/2026-09-26-tenant-admin-bootstrap/epics/real-admin-bootstrap.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-28

<!-- tab-s2 is a migration-story.md-formatted story with data-condition ACs, not GWT. See workspace/capture-log.md, 2026-09-28, for the /test-plan entry-condition wording gap this surfaced. -->

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Every real tenant with zero admin beforehand has exactly one admin after | 2 tests | — | — | — | — | 🟢 |
| AC2 | The promoted row is verifiably the minimum-created_at row | 2 tests | — | — | — | — | 🟢 |
| AC3 | Already-admin'd and zero-member tenants both untouched | 2 tests | — | — | — | — | 🟢 |
| AC4 | Running twice makes zero further changes | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This story's transformation logic is entirely testable via a fake pool seeded with synthetic tenant configurations — no real Postgres or browser rendering required.

---

## Test Data Strategy

**Source:** Synthetic — a fake pool seeded with various tenant configurations (already-admin'd, zero-member, multi-member-no-admin, and a deliberate tie case). The migration's actual run against real `wuce-staging`/production data is a DoD-time deployment concern, not a test-plan concern, matching `tab-s1`'s own approach.
**PCI/sensitivity in scope:** No — synthetic identities and tenant IDs only.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fake pool with a tenant having 3+ `team_memberships` rows, none `role='admin'`, distinct `created_at` values | Synthetic | None | Asserts exactly the minimum-`created_at` row is promoted |
| AC2 | Same fixture as AC1, plus a separate tenant with 2 rows sharing the exact same `created_at` (tie case) | Synthetic | None | Asserts deterministic tie-break by lowest `person_id`, logged as WARNING |
| AC3 | Fake pool with one tenant already having `role='admin'`, and no rows at all for a separate tenant_id | Synthetic | None | Asserts zero changes to the already-admin'd tenant; asserts no row is ever created for a tenant with zero members |
| AC4 | Fake pool with a tenant needing backfill | Synthetic | None | Migration run twice against the same fake pool instance; second run must be a true no-op |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### A tenant with multiple members and no admin gets its earliest member promoted

- **Verifies:** AC1, AC2
- **Precondition:** Fake pool has `tenant-a` with 3 `team_memberships` rows, none `role='admin'`, with distinct, known `created_at` timestamps
- **Action:** Run the migration script against the fake pool
- **Expected result:** Exactly the row with the minimum `created_at` for `tenant-a` now has `role='admin'`; the other 2 rows are completely unchanged
- **Edge case:** No

### A tenant that already has an admin is left completely untouched

- **Verifies:** AC3 (TR-03)
- **Precondition:** Fake pool has `tenant-b` with 2 rows, one already `role='admin'`
- **Action:** Run the migration script
- **Expected result:** Zero rows changed for `tenant-b` — a before/after snapshot is byte-identical
- **Edge case:** Yes — the story's own named already-admin'd case

### A tenant with zero members gets no new row

- **Verifies:** AC3 (TR-02)
- **Precondition:** Fake pool has no `team_memberships` rows at all referencing `tenant-c`
- **Action:** Run the migration script
- **Expected result:** No row is ever created for `tenant-c` — the migration's own tenant-discovery query naturally excludes tenants it has no existing rows for, no explicit skip logic needed
- **Edge case:** Yes — the story's own named zero-member case

### A tie on minimum created_at is broken deterministically by lowest person_id

- **Verifies:** AC2 (TR-04)
- **Precondition:** Fake pool has `tenant-d` with 2 rows sharing the exact same `created_at` timestamp, different `person_id`s
- **Action:** Run the migration script
- **Expected result:** The row with the lower `person_id` is promoted to `role='admin'`; a WARNING (not an error) is logged for the tie
- **Edge case:** Yes — the story's own named tie-break edge case

### Running the migration twice makes zero further changes

- **Verifies:** AC4
- **Precondition:** Fake pool has `tenant-e` needing backfill
- **Action:** Run the migration script once against the fake pool, capture the resulting state, then run it a second time against the same, now-already-migrated fake pool instance
- **Expected result:** After the second run, zero additional rows are changed — state after run 2 is identical to state after run 1
- **Edge case:** Yes — the story's own explicit idempotency/rollback-gate requirement

### A single error among many tenants does not abort the batch

- **Verifies:** Error and rejection handling (STOP gate, below-threshold case)
- **Precondition:** Fake pool has 15 tenants needing valid backfill plus 1 tenant whose row triggers a simulated processing error (1/16 ≈ 6.25%, below the 10% STOP threshold)
- **Action:** Run the migration script
- **Expected result:** All 15 valid tenants are correctly backfilled; the 1 erroring tenant is skipped and logged with its real error; the migration completes normally, does not abort
- **Edge case:** Yes

### An error rate above 10% triggers the STOP gate

- **Verifies:** Error and rejection handling (STOP gate, above-threshold case)
- **Precondition:** Fake pool has 5 tenants: 1 valid, 4 triggering a simulated processing error (4/5 = 80%, above the 10% STOP threshold)
- **Action:** Run the migration script
- **Expected result:** The migration stops automatically once the error-rate threshold is breached and alerts (logs, in the absence of a real paging integration) rather than silently completing as if successful
- **Edge case:** Yes — the story's own explicit STOP-gate requirement

---

## Integration Tests

### Backfilled admin resolves correctly via the real resolveRoleForPerson function afterward

- **Verifies:** Cross-cutting correctness — the migration's plain `team_memberships` write is genuinely compatible with the app's real, already-shipped role-resolution path, not a separate/parallel mechanism
- **Components involved:** `user-roles.js`'s real, unmodified `resolveRoleForPerson`, the fake pool
- **Precondition:** Fake pool has `tenant-f` needing backfill, plus a resolvable `person_identities` row for the person who will be promoted
- **Action:** Run the migration script, then call the real `resolveRoleForPerson(pool, identityKey, 'tenant-f')`
- **Expected result:** Resolves to `'admin'` — proving the migration's write is directly usable by the real, unmodified resolution logic with zero new code needed there

---

## NFR Tests

### Migration completes in well under 1 minute at realistic scale

- **NFR addressed:** Performance
- **Measurement method:** Run the migration against a synthetic fake-pool dataset sized at 100 tenants (well above this platform's actual expected current scale), assert wall-clock execution time against a generous threshold
- **Pass threshold:** Under 10 seconds for 100 tenants in the fake-pool test environment (real Postgres at real scale is expected to be well under the story's own stated 1-minute NFR; this test provides a fast local proxy signal, not the final real-environment measurement)
- **Tool:** `node scripts/run-all-tests.js`

### Tenant isolation

- **NFR addressed:** Security
- **Measurement method:** Covered structurally by the functional ACs above (AC1/AC3) — every operation is inherently scoped by `tenant_id`, per ADR-025; no dedicated test beyond the functional coverage already present.
- **Pass threshold:** N/A
- **Tool:** N/A

### Pre-migration role is logged before each overwrite, enabling rollback

- **NFR addressed:** Audit (rollback-enabling requirement from the story's own Rollback procedure)
- **Measurement method:** Seed a spy logger, run the migration against a tenant needing backfill, assert a log entry exists containing the `tenant_id`, `person_id`, and the row's ORIGINAL (pre-migration) `role` value, logged before the overwrite is applied
- **Pass threshold:** Log entry present with all 3 required fields for every row the migration modifies
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- Any test of `tab-s1`'s own login-time bootstrap mechanism — separate story, separate test plan; this plan does not exercise the `tenant_admin_bootstrap` table at all.
- Any test of `tab-s3`'s own legacy-removal.
- The real migration run against `wuce-staging`/production data — a DoD-time deployment action, not a pre-implementation test.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
