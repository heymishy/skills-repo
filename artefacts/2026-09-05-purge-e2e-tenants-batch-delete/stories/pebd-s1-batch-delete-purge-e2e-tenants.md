# Story: purge-e2e-tenants uses batched deletes instead of per-tenant sequential loops

**Slug:** pebd-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-05

---

## Problem

`stcs-s1` (merged 2026-09-04) added connection retry and a scheduled backstop to `purge-e2e-tenants.js`, correctly addressing Neon cold-start tolerance. It did not address a separate, more severe problem, found while investigating general CI/E2E performance the following day: the script's own per-tenant purge loop is now **routinely timing out with a large, growing backlog of unpurged `e2e-test-` tenants in production**.

Real evidence, pulled directly from two independent real CI runs on 2026-09-04 (`ptvs-s1`'s own merge, run `33922627330`):
```
purge-e2e-tenants failed (non-blocking), found 2260 tenant(s) but did not finish purging them: purgeE2eTenants timed out after 90000ms
purge-e2e-tenants failed (non-blocking), found 2253 tenant(s) but did not finish purging them: purgeE2eTenants timed out after 90000ms
```
Two runs roughly 9 minutes apart show the backlog growing (2253 -> 2260), and the scheduled backstop workflow (`purge-e2e-tenants-scheduled.yml`, daily 03:30 UTC) has not fired even once yet since merging -- there is currently no successful clearing mechanism running against this backlog at all.

Root cause: `purgeTenant(db, tenantId)` runs 11 sequential `DELETE ... WHERE tenant_id = $1` queries per tenant, and `purgeE2eTenants`'s own loop (`for (const tenantId of tenantIds) { await purgeTenant(db, tenantId); }`) processes tenants one at a time, fully sequentially. With 2260+ tenants, that is 24,000+ sequential network round-trips to Neon -- no realistic timeout budget clears that. `stcs-s1`'s own retry/timeout work was correct for what it targeted (a cold connection), but the actual bottleneck is architectural: a fully sequential, per-tenant-per-table loop cannot scale to a backlog of this size, and since new `e2e-test-` tenants are created by every CI run faster than the current approach can clear them, the backlog will keep growing indefinitely without this fix.

## As a / I want / So that

As the operator relying on `purge-e2e-tenants.js` to keep staging's Neon database from accumulating orphaned test data indefinitely
I want the purge to delete tenants in batched, bulk queries instead of one tenant (and 11 queries) at a time
So that a backlog of any realistic size can be cleared well within the existing timeout budget, and the backlog stops growing

## Acceptance Criteria

- **AC1:** A new `purgeTenantsBatch(db, tenantIds)` function deletes all rows for a whole array of tenant IDs using one `DELETE ... WHERE tenant_id = ANY($1::text[])` query per table (11 queries total, matching `purgeTenant`'s own 11 per-table deletes), instead of one query per tenant per table.
- **AC2:** `purgeE2eTenants` chunks the found tenant IDs into batches of `BATCH_SIZE` (200) and calls `purgeTenantsBatch` once per chunk, instead of calling `purgeTenant` once per tenant -- reducing total round-trips for a 2260-tenant backlog from ~24,860 to ~132 (11 queries x ~12 chunks).
- **AC3 (regression guard):** `purgeTenant(db, tenantId)` (the existing single-tenant function) is left unchanged and still exported -- existing callers/tests that use it directly continue to work exactly as before; this story adds a new batch path alongside it, it does not remove or rewrite the existing one.
- **AC4 (regression guard):** `tests/check-alrf-s11-purge-e2e-tenants.js` (11 existing tests) still passes unmodified.
- **AC5 (regression guard):** `tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` (7 existing tests) still passes unmodified -- this story does not touch retry, timeout, or scheduling logic.
- **AC6 (real-world, RISK-ACCEPTed):** after merge and the next real CI/scheduled purge run, the existing backlog (2260+ tenants as of this story's own writing) is fully cleared within the existing timeout budget, confirmed via the real log's own success message (`Purged N e2e-test- tenant(s)`) rather than another timeout -- cannot be verified locally, only via a real run against the real backlog.

## Out of scope

- `stcs-s1`'s own connection-retry/timeout/scheduled-backstop logic -- untouched, still correct for what it addresses.
- Increasing `PURGE_E2E_TENANTS_TIMEOUT_MS` further -- the real fix is reducing round-trip count, not giving the old N+1-per-tenant approach more time (which would only delay, not solve, the growing-backlog problem).
- Investigating *why* so many `e2e-test-` tenants have accumulated in the first place (arrival rate vs. historical clearance rate) -- this story fixes the clearing mechanism; a separate future story could look at reducing tenant-creation volume if the backlog recurs even after this fix.
- Any change to `findE2eTenantIds`'s own query shape -- already returns the full array of tenant IDs needed for batching, no change required there.

## Benefit linkage

Closes an active, growing production data-hygiene problem discovered via real evidence during a CI/E2E performance investigation, not a hypothetical one -- 2260+ orphaned tenant rows in Neon as of this story's own writing, growing every run. No formal benefit-metric artefact -- short-track story, consistent with every other short-track delivery this session.
