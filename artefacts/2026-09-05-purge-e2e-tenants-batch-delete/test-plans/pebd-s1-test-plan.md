# Test Plan: purge-e2e-tenants uses batched deletes instead of per-tenant sequential loops

**Story reference:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/stories/pebd-s1-batch-delete-purge-e2e-tenants.md
**Date:** 2026-09-05

---

## Test approach

AC1-AC5 are testable locally via the existing fake-DB-adapter convention (`setDbConnection`, matching `check-alrf-s11`'s own established pattern). AC6 (does the real backlog actually clear) cannot be verified locally -- RISK-ACCEPTed with mandatory post-merge observation of the next real run's own log output.

## Tests

| # | AC | Test | Type |
|---|----|------|------|
| T1 | AC1 | `purgeTenantsBatch` issues exactly 11 queries for a batch of 3 tenant IDs, each using `= ANY($1::text[])` with all 3 IDs in one array parameter (not 3x11=33 queries) | Automated (new) |
| T2 | AC1 | `purgeTenantsBatch` actually removes rows for all tenants in the batch, verified against a fake DB with rows for 3 different tenants, only 2 of which are in the batch -- the 3rd (not in the batch) is left untouched | Automated (new) |
| T3 | AC2 | `purgeE2eTenants` chunks a 450-tenant found list into exactly 3 batches (200 + 200 + 50) when `BATCH_SIZE=200`, confirmed via a fake DB that records how many `purgeTenantsBatch`-shaped calls it received and the size of each | Automated (new) |
| T4 | AC2 | `purgeE2eTenants`'s own returned summary (`tenantCount`, `tenantIds`) is unchanged in shape/values whether the underlying implementation processes 1 tenant or 450 -- confirms the batching is an internal implementation detail, not a breaking API change | Automated (new) |
| T5 | AC3 | `purgeTenant(db, tenantId)` (single-tenant) still exists, is still exported, and still works exactly as before -- direct regression check, not just "the export exists" | Automated (new) |
| T6 | AC4 | `tests/check-alrf-s11-purge-e2e-tenants.js` (11 tests) passes unmodified | Automated (existing, regression) |
| T7 | AC5 | `tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` (7 tests) passes unmodified | Automated (existing, regression) |
| T8 | AC6 | Manual: after merge, watch the next real CI or scheduled purge run's own log output; confirm it reports a real `Purged N e2e-test- tenant(s)` success message for the full existing backlog, not another `timed out` failure | Manual (verification script) |

**Total logical tests:** 8 (T1-T8).

## Gaps

No real Neon database available in this local test environment -- all tests use the existing fake-DB-adapter convention. T8's manual re-check against the real, currently-existing backlog is the only way to confirm this story's own stated purpose (clearing 2260+ real orphaned rows) is actually achieved, not just that the query shape is correct in isolation.
