## Migration Story: Backfill admin for every existing real tenant that has members but no admin

**Epic reference:** artefacts/2026-09-26-tenant-admin-bootstrap/epics/real-admin-bootstrap.md
**Workstream reference:** N/A — single-feature, not a programme-track workstream
**Programme reference:** N/A
**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md

## Migration type

- [x] Data migration
- [ ] Cutover
- [ ] Parallel run
- [ ] Consumer migration

## Scope

**Source system:** Real Postgres `team_memberships` table (pre-existing rows) on both `wuce-staging` and production (`skills-framework`).
**Target system:** Same `team_memberships` table, in place — one existing row per affected tenant gets its `role` column updated to `'admin'`. No schema change, no new table for this story (the new `tenant_admin_bootstrap` table from `tab-s1` is not touched by this migration — it is specific to new-tenant login-time bootstrapping, not backfill).
**Data / traffic in scope:** every real `tenant_id` currently represented in `team_memberships` that has zero rows with `role='admin'`.
**Explicitly out of scope:**
- Tenants that already have an admin — untouched.
- Tenants with zero `team_memberships` rows at all — nothing to backfill; these get an admin the next time someone actually logs into them, via `tab-s1`'s own new-login bootstrap, not this migration.
- Any change to `tab-s1`'s own `tenant_admin_bootstrap` table.

## Volume and performance criteria

| Criterion | Requirement | Measurement method |
|-----------|-------------|---------------------|
| Record volume | `[UNKNOWN — established by this story's own first task]`, a direct `COUNT(DISTINCT tenant_id)` query grouped by admin-presence. Expected small given this is an early-stage platform with a limited real tenant count (Metric 2's own baseline in `benefit-metric.md` is also `[UNKNOWN BASELINE]` for the same reason — this story's first task establishes both numbers together). | Reconciliation query, before and after. |
| Throughput | Single one-time batch run; expected to complete in well under 1 minute at realistic current scale — no fixed batch window needed. | Script execution log with start/end timestamp. |
| Latency (if streaming) | N/A — not streaming. | N/A |
| Memory / resource ceiling | N/A — small batch, standard Node process, no special resourcing. | N/A |

## Transformation rules

| Rule ID | Source field / condition | Target field | Transformation logic |
|---------|---------------------------|---------------|------------------------|
| TR-01 | `tenant_id` has ≥1 `team_memberships` row AND zero of those rows have `role='admin'` | `team_memberships.role` | The row with the minimum `created_at` for that `tenant_id` has its `role` updated to `'admin'`. All other rows for that `tenant_id` are left untouched. |
| TR-02 | `tenant_id` has zero `team_memberships` rows at all | — | No action — out of scope (see Scope section). |
| TR-03 | `tenant_id` already has ≥1 row with `role='admin'` | — | No action — idempotent, matches `_backfillOne`'s own existing idempotency convention in this codebase. |
| TR-04 | Two or more candidate rows for the same `tenant_id` share the exact same minimum `created_at` (a tie) | `team_memberships.role` | Deterministic tie-break: promote the row with the lowest `person_id`. Logged as a WARNING (not an error) — rare, harmless edge case, not a rejection. |

## Error and rejection handling

**Error threshold (STOP gate):**
If the migration errors while processing any individual `tenant_id` (e.g. a malformed row), log and skip that `tenant_id`, continue processing the rest — do not abort the whole batch for one bad row. If more than 10% of in-scope tenants error, the migration **stops automatically** and alerts the operator (Hamish King) before any further action — given the expected total volume is small and the transformation itself is a single-column update, an error rate above the noise floor signals a real bug, not expected data mess.

**Rejection categories:**

| Category | Handling | SLA for resolution |
|----------|----------|----------------------|
| Tie on minimum `created_at` (TR-04) | Deterministic tie-break by lowest `person_id`, logged as WARNING | No action needed — resolved automatically, logged for audit only |
| Malformed/unexpected row shape for a given `tenant_id` | Skip that `tenant_id`, log with the real error, continue the batch | Investigate within 24h |

## Acceptance criteria

**AC1 (Record count):** After the migration runs, every real `tenant_id` that had zero admin rows beforehand now has exactly one `team_memberships` row with `role='admin'` — confirmed via a direct reconciliation query (count of adminless tenants: >0 before, 0 after, for the real dataset in scope, on both `wuce-staging` and production).

**AC2 (Transformation accuracy):** For every tenant backfilled, the promoted row is verifiably the one with the minimum `created_at` timestamp for that `tenant_id` among its own existing rows — confirmed by comparing the backfilled admin's `person_id` against a direct `MIN(created_at)` query per `tenant_id`, for every affected tenant, not a sample.

**AC3 (No side effects):** No tenant that already had an admin is modified by this migration, and no tenant with zero members at all gains a row — confirmed via before/after row-count-and-role snapshots for a control set covering both cases.

**AC4 (Idempotent / rollback gate):** Running the migration script a second time against the same, already-migrated dataset makes zero further changes — confirmed via a second dry-run reconciliation showing 0 rows affected.

## Parallel run verification (parallel-run stories only)

N/A — not a parallel-run story.

## Consumer migration criteria (consumer migration stories only)

N/A — not a consumer migration story.

## Rollback procedure

**Rollback trigger:** Any single tenant's promoted admin turns out to be wrong (e.g. the earliest-member heuristic promoted a departed contractor rather than the real owner) — matches the exact revisit trigger already named for this policy in `decisions.md`.

**Rollback steps:**
1. Identify the specific `tenant_id`(s) affected.
2. Restore the specific `team_memberships` row(s)' `role` to its pre-migration value — the migration script logs each row's pre-migration `role` before overwriting it, so this is a direct restore, not a guess.
3. Notify Hamish King.
4. If the issue looks systemic (not an isolated bad pick) rather than a one-off, halt any remaining unbackfilled tenants pending a policy review, rather than continuing to apply a rule that may be wrong.

**Rollback decision authority:** Hamish King (Platform Owner).
**Maximum rollback window:** Technically unlimited — each row's prior state is logged before overwrite, so a role-level restore is always possible. Practically, once a promoted admin has taken real admin actions (invited teammates, changed settings), rolling back their role alone doesn't undo those actions — treat rollback as viable-without-complication only within the first 7 days post-migration.

## Dependencies

- **Upstream:** `tab-s1` (soft dependency — the epic's own risk-first ordering: validate the core admin-bootstrap concept in production before running a batch write against real tenant data. Not a hard code dependency — this migration writes directly to the existing, unmodified `team_memberships` table via its own script, sharing no code with `tab-s1`'s login-time bootstrap).
- **Downstream:** `tab-s3` (legacy-path removal) depends on this story — the legacy path should only be removed once backfill confirms every real tenant has an admin.
- **Infrastructure / environment:** Real Postgres access to both `wuce-staging` and production (`skills-framework`) — this migration must run against both real databases, matching `benefit-metric.md`'s own dual-environment measurement approach for Metric 2.
- **Access / credentials:** `DATABASE_URL` for each real environment — already available to the existing deploy pipeline; no new credential needed.

## Complexity rating

**Rating:** 2
**Scope stability:** Stable
**Reversibility:** Reversible (with rollback) — see Rollback procedure above.
