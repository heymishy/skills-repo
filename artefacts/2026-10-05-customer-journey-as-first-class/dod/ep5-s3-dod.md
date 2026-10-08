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
| AC1 | ⚠️ COULD NOT VERIFY LIVE | `check-ep5-s1-migration.js` AC1 now creates the platform's own `journeys` table first (via `journey-store-pg.js`'s real `migrateSchema()`) before asserting `customer_journeys` is created correctly and the platform's table is untouched — the exact collision scenario. Test written and reviewed; no real-DB run performed this session (no `DATABASE_URL` available, same constraint as `ep5-s1`). | `unit` (test exists); `code-review` | No real-DB run performed |
| AC2 | ⚠️ COULD NOT VERIFY LIVE | `customer_journey_stages`/`feature_customer_journey_stage_mappings` assertions renamed and extended from `ep5-s1`'s own already-reviewed logic | `unit` (test exists); `code-review` | No real-DB run performed |
| AC3 | ⚠️ COULD NOT VERIFY LIVE | Idempotency assertions renamed, unchanged logic from `ep5-s1`'s own AC4 | `unit` (test exists); `code-review` | No real-DB run performed |
| AC4 | ✅ | Direct grep verification performed post-implementation: zero remaining literal backtick-quoted old-table-name references in any "current truth" artefact (`design.md`, `benefit-metric.md`, `clarify.md`, `definition.md`, `discovery.md`, epic file, 6 story files); English prose and URL paths (`/journeys`, `/journeys/:id`) deliberately left unchanged; historical gate artefacts (reviews, `ep5-s1`'s own original DoR/test-plan/DoD) deliberately left untouched as point-in-time records | `code-review` (direct grep sweep, shown in conversation) | None |

**Verification strength note — same honest gap as `ep5-s1` itself:** AC1-AC3 were never executed against a live Postgres instance this session (no `DATABASE_URL` available locally, Docker Desktop not running when checked). This DoD does not claim the rename is confirmed working against a real database — only that the implementation, its tests, and the artefact-consistency sweep are complete and reviewed.

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

**COMPLETE WITH DEVIATIONS**

**Follow-up actions (carried forward from `ep5-s1`'s own DoD, now sharper):**
1. **Run `node scripts/migrate-schema-journeys.js` against a real staging/Neon `DATABASE_URL`, then run `DATABASE_URL=... node tests/check-ep5-s1-migration.js` against the same instance, with the platform's own `journeyPg.migrateSchema()` having already run at least once (the realistic boot-order case).** This single combined test now covers what `ep5-s1` and `ep5-s3` both separately left unverified — it should be the one remaining gate before any downstream story (`ep1-s1` etc.) is implemented against these tables.
2. If that real run surfaces any further issues, correct them in a follow-up commit, not silently.

---

## DoD Observations

1. **A second-order defect was found by actually trying to use the first migration's own output, not by re-reading it.** `ep5-s1`'s own DoD (written immediately after that PR merged) already flagged "never run against a real database" as an open risk — but the table-name collision itself was found not by chasing that flag, but by reading the real `products.js` code while scoping `ep1-s1`'s own implementation and noticing it already queried a `journeys` table with a different column name (`journey_id`) than `ep5-s1` had just created (`id`). `/improve` candidate: when a story's own DoD already carries an "unverified against reality" flag, the NEXT story that touches the same domain should actively go looking for exactly that kind of silent mismatch, not just inherit the flag and move on.
2. **Historical artefacts were deliberately NOT rewritten, and that boundary held up as the right call.** `ep5-s1`'s own original DoR, test-plan, and DoD all still reference the pre-rename table names — intentionally, since they are accurate records of what was true when they were written. The "current truth" documents (`design.md`, story files, etc.) were updated instead. This is the same principle already applied earlier this session to `review.md` (never retroactively split-edited) — worth stating explicitly as a pattern: fix the living documents, annotate the frozen ones, never silently rewrite history.

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
