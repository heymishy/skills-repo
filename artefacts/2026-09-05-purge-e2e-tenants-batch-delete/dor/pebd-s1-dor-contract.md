# DoR Contract: purge-e2e-tenants uses batched deletes instead of per-tenant sequential loops

**Story reference:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/stories/pebd-s1-batch-delete-purge-e2e-tenants.md
**Test plan:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/test-plans/pebd-s1-test-plan.md
**Date:** 2026-09-05

---

## Scope

**MUST touch:**
- `scripts/purge-e2e-tenants.js` (add `purgeTenantsBatch`, `BATCH_SIZE`; change `purgeE2eTenants`'s own internal loop to chunk-and-batch; `purgeTenant` itself untouched)
- `tests/check-pebd-s1-purge-e2e-tenants-batch-delete.js` (new, with its own self-contained fake-DB fixture supporting `= ANY($1::text[])` queries)

**MUST NOT touch:**
- `purgeTenant(db, tenantId)` itself -- confirmed still needed and still exported (AC3); this story adds a batch path alongside it.
- `connectWithRetry`, `getConfiguredTimeoutMs`, `formatPurgeFailureMessage`, `withTimeout`, `DEFAULT_TIMEOUT_MS`, the CLI entrypoint's own retry/timeout wiring -- all `stcs-s1` territory, confirmed unaffected by this story's own scope (batching the delete queries, not the connection/timeout layer).
- `tests/check-alrf-s11-purge-e2e-tenants.js`'s own `makeFakeDb` fixture -- confirmed specific to that file, not shared/exported; this story's own new test file gets its own fixture, not a shared modification.
- `.github/workflows/purge-e2e-tenants-scheduled.yml`, `staging-deploy.yml`'s own purge-step wiring, `e2e.yml`'s own purge-step wiring -- no change needed, since `purgeE2eTenants`'s own public function signature/return shape is unchanged (AC2/T4), so every existing caller keeps working without modification.

## Assumptions verified before sign-off

1. **`tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` has zero calls to `purgeE2eTenants` or `purgeTenant`** -- confirmed by direct grep; it only tests `connectWithRetry`/`getConfiguredTimeoutMs`/`formatPurgeFailureMessage` in isolation, with literal argument values, never through the purge functions themselves. Zero collision risk.
2. **Postgres's own `= ANY($1::text[])` array-parameter syntax is the correct, idiomatic way to batch a `WHERE column = <one of these values>` condition into a single query** -- standard `pg` library / Postgres syntax, functionally equivalent to a large `IN (...)` list but avoids the positional-placeholder-per-value approach that would otherwise require dynamically building `$1, $2, $3, ...ᐧ` for each batch size.
3. **`findE2eTenantIds`'s own return shape (a plain `string[]`) is already exactly what batching needs** -- no change required there; only the consuming loop in `purgeE2eTenants` changes.
4. **The existing `check-alrf-s11` fixture's own regex-based fake DB cannot be reused as-is for batch queries** (it only matches single-`$1`-param `DELETE ... WHERE col = $1` patterns) -- confirmed by reading it in full; this story's own new test file needs its own fixture extending that same pattern-matching approach to also recognise `= ANY($1::text[])`.

## Risk

**Rating: 2** (the query-shape change is mechanical and well-understood, but it touches the actual DELETE logic against real production data with a real, currently-existing backlog -- getting the batched query wrong could either fail to delete anything, or (far worse, though structurally prevented by using the exact same WHERE-column semantics as the existing per-tenant deletes) delete rows it shouldn't. Mitigated by T2's own explicit "3rd tenant not in the batch is left untouched" assertion, and by the existing per-tenant `purgeTenant` staying untouched and available as a fallback/comparison).

**RISK-ACCEPT:** AC6 (does the real, currently-existing 2260+ tenant backlog actually clear) cannot be verified locally -- accepted via mandatory manual observation of the next real CI or scheduled run's own log output. Logged in this feature's own `decisions.md`.

## Coding Agent Instructions

1. Add `purgeTenantsBatch(db, tenantIds)` to `scripts/purge-e2e-tenants.js`, mirroring `purgeTenant`'s own 11-table deletion order exactly, but using `= ANY($1::text[])` (and `admin_tenant_id = ANY($1::text[]) OR target_tenant_id = ANY($1::text[])` for the one two-column table) with the whole `tenantIds` array as a single parameter, instead of one call per tenant.
2. Add a `BATCH_SIZE = 200` constant and a small chunking helper; change `purgeE2eTenants`'s own loop to chunk `tenantIds` into batches of `BATCH_SIZE` and call `purgeTenantsBatch` once per chunk, sequentially (chunk-level sequencing is fine -- the whole point is reducing round-trip COUNT, not eliminating all sequencing).
3. Export `purgeTenantsBatch` and `BATCH_SIZE` alongside the existing exports.
4. Write `tests/check-pebd-s1-purge-e2e-tenants-batch-delete.js` covering T1-T5, with its own self-contained fake-DB fixture.
5. Run `tests/check-alrf-s11-purge-e2e-tenants.js` and `tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` directly to confirm T6/T7 pass unmodified.
6. Run the full suite (`npm test`) before considering the task complete.
7. TDD RED-state verification: stash the script change, re-run the new test file, confirm it fails against pre-fix content, then restore.
8. After merge, watch the next real purge run's own log output (T8) -- this is the one check that actually proves the real backlog clears; do not skip it or treat it as optional, given the story's own stated urgency.

## Proceed: Yes
