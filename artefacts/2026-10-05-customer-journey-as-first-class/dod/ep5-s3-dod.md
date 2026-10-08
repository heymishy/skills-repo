# Definition of Done: Rename journeys/journey_stages tables to customer_journeys/customer_journey_stages to avoid platform-table collision

**PR:** [#955](https://github.com/heymishy/skills-repo/pull/955) | **Merged:** 2026-10-08T00:39:18Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s3-rename-journeys-table-to-avoid-platform-collision.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep5-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | **Verified live against real `wuce-staging` Postgres, 2026-10-08.** Ran the real migration (via `fly ssh sftp put` + `fly ssh console`, a read-only-safe verification script — not the full test file, whose own cleanup logic drops `journeys`/`artefacts` and would have destroyed real staging data) against the actual staging database. Confirmed: the platform's real `journeys` table had 8297 rows and columns `journey_id, tenant_id, owner_id, feature_slug, created_at, data, product_id, module_id` *before and after* the migration — completely untouched. `customer_journeys` created with the correct 7-column schema. | `integration-real-environment` (live staging run) | None — upgraded from "could not verify" to fully confirmed |
| AC2 | ✅ | **Same live staging run.** `customer_journey_stages` (15 columns) and `feature_customer_journey_stage_mappings` (7 columns, FKs to `customer_journey_stages`/`customer_journeys` both `ON DELETE CASCADE`) confirmed created correctly via `information_schema`/`pg_indexes` queries against the real database. | `integration-real-environment` | None |
| AC3 | ✅ | **Same live staging run.** Migration run twice; second run threw no error; `information_schema.tables` confirmed exactly 1 copy of each of the 3 tables after both runs. | `integration-real-environment` | None |
| AC4 | ✅ | Direct grep verification performed post-implementation: zero remaining literal backtick-quoted old-table-name references in any "current truth" artefact (`design.md`, `benefit-metric.md`, `clarify.md`, `definition.md`, `discovery.md`, epic file, 6 story files); English prose and URL paths (`/journeys`, `/journeys/:id`) deliberately left unchanged; historical gate artefacts (reviews, `ep5-s1`'s own original DoR/test-plan/DoD) deliberately left untouched as point-in-time records | `code-review` (direct grep sweep, shown in conversation) | None |

**Verification strength note — upgraded, 2026-10-08:** AC1-AC3 were initially left unverified at merge time (no `DATABASE_URL` available locally that session). They have since been verified live against real `wuce-staging` Postgres, at the operator's explicit request, using a deliberately read-only-safe script (not the test file's own destructive cleanup) to avoid any risk to the platform's real session/journey data (8297 real rows). All 3 ACs now have real-environment evidence, not just code review.

---

## Scope Deviations

None beyond what the story itself already named as in-scope. `journey-store-pg.js` (the collision source) was confirmed untouched, as the story required.

---

## Test Plan Coverage

**Tests from plan implemented:** AC1-AC3 (extending `ep5-s1`'s own 5 AC groups, renamed + the new collision-reproduction setup), AC4 (manual grep pass, the one accepted non-automated gap type per the test plan's own Coverage gaps section).
**Tests passing in CI:** `npm test` shows `check-ep5-s1-migration.js` passing (0 failures) — but, as with `ep5-s1`, this means "skipped cleanly" in CI (no `DATABASE_URL`), not "AC1-AC3 confirmed against real schema."

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| ep5-s3 AC1 (customer_journeys created; platform journeys untouched) | ✅ | ⚠️ skipped, not run | The critical new check — never performed by `ep5-s1` itself |
| ep5-s3 AC2 (renamed stages/mappings tables + FKs/indexes) | ✅ | ⚠️ skipped, not run | |
| ep5-s3 AC3 (idempotent under new names) | ✅ | ⚠️ skipped, not run | |
| ep5-s3 AC4 (artefact text consistency) | ✅ | ✅ (manual grep, performed and shown) | |

**Gaps (tests not implemented):** None implemented-wise; AC1-AC3 are gaps in *execution* evidence only, same honest framing as `ep5-s1`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Schema-identifier rename only |
| Security | ✅ | No new input surface; tenant-scoped columns unchanged |
| Reliability (idempotency) | ⚠️ Believed correct, not live-verified | Same `CREATE TABLE/INDEX IF NOT EXISTS` pattern already used by `ep5-s1`, now additionally verified (in test code, not yet executed) against the real collision scenario |
| Accessibility | ✅ N/A | No UI |

---

## Metric Signal

No metrics tracked — correction to a schema-only migration story.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | N/A |

---

## Outcome

**COMPLETE**

**Update, 2026-10-08 (same day, post-merge):** the operator requested the staging verification be run. Executed live against real `wuce-staging` Postgres via `fly ssh sftp put` (uploading the migration script + a dedicated read-only-safe verification script) and `fly ssh console` — deliberately NOT the test file's own destructive cleanup logic, to avoid any risk to the platform's real session/journey data. Confirmed: `journeys` (8297 real rows) completely untouched; `customer_journeys`/`customer_journey_stages`/`feature_customer_journey_stage_mappings` all created correctly with the right columns, FK constraints, and indexes; migration is idempotent under real conditions (run twice, no error, no duplicates). Uploaded scripts removed from the staging machine afterward. Outcome upgraded from COMPLETE WITH DEVIATIONS to COMPLETE — no open verification gap remains.

**Follow-up actions:** None remaining. `ep1-s1` and other downstream stories may now proceed against these tables with real-environment confidence.

---

## DoD Observations

1. **A second-order defect was found by actually trying to use the first migration's own output, not by re-reading it.** `ep5-s1`'s own DoD (written immediately after that PR merged) already flagged "never run against a real database" as an open risk — but the table-name collision itself was found not by chasing that flag, but by reading the real `products.js` code while scoping `ep1-s1`'s own implementation and noticing it already queried a `journeys` table with a different column name (`journey_id`) than `ep5-s1` had just created (`id`). `/improve` candidate: when a story's own DoD already carries an "unverified against reality" flag, the NEXT story that touches the same domain should actively go looking for exactly that kind of silent mismatch, not just inherit the flag and move on.
2. **Historical artefacts were deliberately NOT rewritten, and that boundary held up as the right call.** `ep5-s1`'s own original DoR, test-plan, and DoD all still reference the pre-rename table names — intentionally, since they are accurate records of what was true when they were written. The "current truth" documents (`design.md`, story files, etc.) were updated instead. This is the same principle already applied earlier this session to `review.md` (never retroactively split-edited) — worth stating explicitly as a pattern: fix the living documents, annotate the frozen ones, never silently rewrite history.
3. **The real `journeys` table had evolved beyond what any code in this repo's own `journey-store-pg.js` shows** — it has `product_id` and `module_id` columns neither that file's own `CREATE TABLE`/migration logic nor any grep of this codebase accounts for (likely added by an `ALTER TABLE` elsewhere, or by a since-removed/renamed migration path). Not investigated further here — out of this story's scope — but worth flagging: the real schema of a long-lived shared table can drift ahead of what any single file in the repo claims it looks like. Confirmed via live read, not assumed.
4. **Verifying against a live, real, actively-used staging database required deliberately NOT running the already-written, already-reviewed test file as-is.** `check-ep5-s1-migration.js`'s own setup/cleanup intentionally drops `journeys`/`artefacts` to give itself a clean slate — a safe and correct design for a throwaway test database, but one that would have been destructive against staging's real 8297-row table. A separate, purpose-built read-only-plus-pure-additive-migration script was used instead. `/improve` candidate: any DATABASE_URL-dependent test file whose own setup intentionally drops tables should carry an explicit comment warning that it must never be pointed at a shared/real environment — this one didn't, and the risk was only caught by manually re-reading its own logic before running it, not by any guard in the file itself.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Rename journeys/journey_stages
tables to customer_journeys/customer_journey_stages to avoid platform-table
collision" (ep5-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Pay particular attention to whether follow-up action 1 (a real staging run
of the combined migration + collision test) should block ep1-s1's own
implementation start, not just be a nice-to-have.
```
