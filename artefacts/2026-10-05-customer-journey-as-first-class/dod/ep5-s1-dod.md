# Definition of Done: Database migration — create journeys, journey_stages, and feature_journey_stage_mappings tables

**PR:** [#954](https://github.com/heymishy/skills-repo/pull/954) | **Merged:** 2026-10-07T22:58:56Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s1.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep5-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ COULD NOT VERIFY LIVE | `check-ep5-s1-migration.js` AC1 assertions written (column/nullability checks against `information_schema.columns`); test SKIPs without a real `DATABASE_URL` — none was available this session (no local Postgres, Docker Desktop not running) | `unit` (test exists, written to run for real); `code-review` (SQL hand-verified against the real `products` table schema) | No real-DB run performed |
| AC2 | ⚠️ COULD NOT VERIFY LIVE | `check-ep5-s1-migration.js` AC2 assertions written (`journey_stages` columns incl. `moment_of_truth` boolean default false) | `unit` (test exists); `code-review` | No real-DB run performed |
| AC3 | ⚠️ COULD NOT VERIFY LIVE | `check-ep5-s1-migration.js` AC3 assertions written (columns + FK constraints with cascade via `information_schema.referential_constraints`) | `unit` (test exists); `code-review` | No real-DB run performed |
| AC4 | ⚠️ COULD NOT VERIFY LIVE | `check-ep5-s1-migration.js` AC4 assertions written (idempotent second run, no duplicate tables/indexes) | `unit` (test exists); `code-review` (uses the proven `CREATE TABLE/INDEX IF NOT EXISTS` pattern from `migrate-schema-credits.js`) | No real-DB run performed |
| AC5 | ⚠️ COULD NOT VERIFY LIVE | `check-ep5-s1-migration.js` AC5 assertions written (named indexes via `pg_indexes`) | `unit` (test exists); `code-review` | No real-DB run performed |

**Verification strength note — this is the honest, weaker-than-usual evidence class for this story:** every AC's test was *written* and is believed correct by careful hand cross-checking against the real codebase (this is how the `products(id)` → `products(product_id)` FK bug, below, was caught before merge), but none was actually *executed* against a live Postgres instance during this session — no `DATABASE_URL` was available locally, and Docker Desktop was not running when checked. The PR body flagged this explicitly at merge time and recommended a staging spot-check. **This DoD does not claim AC1-AC5 are confirmed working against a real database — only that the implementation and its tests are complete, reviewed, and believed correct.**

---

## Scope Deviations

Three, all logged in `artefacts/2026-10-05-customer-journey-as-first-class/decisions.md` (D1-D3) at implementation time:
1. Migration script placed at `scripts/migrate-schema-journeys.js`, not the DoR's assumed `src/web-ui/migrations/` (that directory does not exist in this codebase) — matches the real `migrate-schema-*.js` convention.
2. `journeys.product_id` references `products(product_id)`, not the DoR's own `products(id)` — the real `products` table (`server.js`) has no column named `id`; the DoR's authored SQL would have failed at migration time.
3. Test file SKIPs (not fails) when `DATABASE_URL` is absent, diverging from the DoR's literal "all tests fail" instruction — that would have broken `npm test` for every future PR, since CI has no `DATABASE_URL` wired.

All three are corrections of DoR authoring defects against real codebase state, not scope creep — the ACs and their intent are unchanged.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 AC assertion groups written.
**Tests passing in CI:** `npm test` shows this file passing (0 failures) — but note it SKIPs its real assertions entirely in CI (no `DATABASE_URL`), so "passing" here means "ran and skipped cleanly," not "AC1-AC5 confirmed against real schema." See AC Coverage note above.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| ep5-s1 AC1 (journeys columns) | ✅ | ⚠️ skipped, not run | |
| ep5-s1 AC2 (journey_stages columns) | ✅ | ⚠️ skipped, not run | |
| ep5-s1 AC3 (mappings + FK cascade) | ✅ | ⚠️ skipped, not run | |
| ep5-s1 AC4 (idempotency) | ✅ | ⚠️ skipped, not run | |
| ep5-s1 AC5 (named indexes) | ✅ | ⚠️ skipped, not run | |

**Gaps (tests not implemented):** None implemented-wise; all 5 are gaps in *execution* evidence, not in test authorship.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Schema-only migration, no runtime code path |
| Security | ✅ | No new input surface; tenant scoping columns present on all 3 tables per design |
| Reliability (idempotency) | ⚠️ Believed correct, not live-verified | `CREATE TABLE/INDEX IF NOT EXISTS` pattern proven elsewhere in this codebase; this specific script's own idempotency was not run against a real DB this session |
| Accessibility | ✅ N/A | No UI |

---

## Metric Signal

No metrics tracked — this is a pure schema-migration story with no user-facing behaviour of its own; the feature's own `benefit-metric.md` metrics are measured once downstream stories (route handlers, UI) consume these tables.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | N/A |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions (blocking before this migration is actually run against staging or production):**
1. **Run `node scripts/migrate-schema-journeys.js` against a real staging/Neon `DATABASE_URL`, then run `DATABASE_URL=... node tests/check-ep5-s1-migration.js` against the same instance**, before any downstream story (ep1-s1, ep1-s2, etc.) that depends on these tables actually existing is implemented. This is the single most important unresolved item from this story — the migration has never been executed against a real database.
2. If that real run surfaces any further schema issues beyond the `products(product_id)` fix already made, correct them in a follow-up commit/PR, not silently — this DoD's own honesty about AC1-AC5 being unverified is specifically so this doesn't get missed.

---

## DoD Observations

1. **A DoR's own authored SQL was wrong, and a real deploy-time failure was avoided by cross-checking it against the actual running codebase before implementing, not after.** The DoR specified `journeys.product_id REFERENCES products(id)` — the real `products` table has no `id` column (its PK is `product_id`). Had this been implemented verbatim, the migration would have failed the first time anyone actually ran it against a database where `products` already exists (i.e., every real environment). `/improve` candidate: DoR sign-off for any story introducing a new FK to an *existing* table should include an explicit grep/read of that table's real current schema, not just trust the design artefact's own column naming.
2. **This story shipped without live-database verification, and that gap is recorded honestly rather than papered over.** The operator should treat `ep5-s1`'s own "done" status as "implementation complete, review complete, execution against a real database still outstanding" — not as "these tables now exist anywhere." Downstream stories that assume these tables are live should not proceed until follow-up action 1 above is actually done.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Database migration -- create
journeys, journey_stages, and feature_journey_stage_mappings tables" (ep5-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Pay particular attention to whether "COMPLETE WITH DEVIATIONS" is the right
verdict here, given AC1-AC5 were never actually run against a real database --
confirm you agree this should block the next story's start, not be waved through.
```
