# Contract Proposal: Backfill admin for every existing real tenant that has members but no admin

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s2.md
**Date:** 2026-09-28

---

## What will be built

- A new one-time script `scripts/backfill-tenant-admin.js` implementing transformation rules TR-01 through TR-04:
  1. Query every `tenant_id` with ≥1 `team_memberships` row and zero `role='admin'` rows.
  2. For each, promote the row with minimum `created_at` (tie-broken by lowest `person_id`, TR-04) to `role='admin'`.
  3. Log each modified row's pre-migration `role` before overwriting — this is what enables the story's own rollback procedure to do a direct restore, not a guess.
  4. Track error count vs. total processed; if error rate exceeds 10%, stop automatically and alert (log) rather than continuing silently.
- Each tenant's own `UPDATE` is atomic at the Postgres statement level — no cross-tenant batch transaction is needed, unlike `tab-s1`'s single-tenant atomic bootstrap. This matches the story's own explicit "skip and continue" error-handling design (a bad row for one tenant should never block or roll back a good row for another).
- Idempotency (AC4) falls out naturally from the same query that selects the target set on step 1 — a tenant already `role='admin'` is simply excluded from any re-run, no separate "already migrated" flag needed.

## What will NOT be built

- No change to `tab-s1`'s own `tenant_admin_bootstrap` table or bootstrap function — this migration writes only to the existing, unmodified `team_memberships` table.
- No change to `team_memberships`'s own schema.
- No operator-facing UI for running or monitoring the migration — it runs directly via `node scripts/backfill-tenant-admin.js`, matching this repo's own established convention for one-off migration scripts.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (Record count) | Fake pool with a multi-member, no-admin tenant; run script; assert exactly one `role='admin'` row exists afterward | unit |
| AC2 (Transformation accuracy) | Same fixture, plus a tie-case fixture; assert the promoted `person_id` matches a direct `MIN(created_at)` computation | unit |
| AC3 (No side effects) | Fixture with an already-admin'd tenant and a zero-member tenant; assert both untouched | unit |
| AC4 (Idempotent) | Run the script twice against the same fake pool; assert the second run changes zero rows | unit |
| STOP gate (below/above threshold) | Fixtures with 1/16 and 4/5 simulated error rates | unit |
| Cross-cutting correctness | Real `resolveRoleForPerson` called after the migration runs, confirms `'admin'` resolves | integration |
| Performance | 100-tenant synthetic dataset, wall-clock assertion | NFR |
| Audit (rollback-enabling log) | Spy logger, assert pre-migration role logged before overwrite | NFR |

## Assumptions

- The script is idempotent by construction (via its own target-set query), not just by convention — safe to run multiple times without a separate "already ran" guard.
- `created_at` on existing `team_memberships` rows is reliable enough to determine "earliest member" meaningfully — a `NOT NULL DEFAULT NOW()` column per the real schema, not nullable/unreliable.

## Estimated touch points

**Files:**
- `scripts/backfill-tenant-admin.js` (new)
- `tests/check-tab-s2-backfill-tenant-admin.js` (new)

**Services:** None. **APIs:** None new.
