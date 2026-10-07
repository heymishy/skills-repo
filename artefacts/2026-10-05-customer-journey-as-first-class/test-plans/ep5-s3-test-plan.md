## Test Plan: Rename journeys/journey_stages tables to customer_journeys/customer_journey_stages

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s3-rename-journeys-table-to-avoid-platform-collision.md
**Epic reference:** database-migration-and-tenant-isolation-hardening
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- `scripts/migrate-schema-journeys.js` — the migration to rename tables within.
- `tests/check-ep5-s1-migration.js` — the existing integration test to update table names within (same file, not a new one — this is a correction of `ep5-s1`, not a new independent test suite).
- `src/web-ui/adapters/journey-store-pg.js:79-87` — confirmed, unrelated, untouched by this story (the collision source, not the fix target).

**E2E/browser-layout detection (Step 3a):** N/A — pure schema/SQL identifier rename.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | customer_journeys created correctly, platform's journeys table untouched | 1 test (extends ep5-s1's own AC1) | — | — | — | — | 🟢 |
| AC2 | customer_journey_stages + feature_customer_journey_stage_mappings created with FKs/indexes | 2 tests (extends ep5-s1's AC2/AC3/AC5) | — | — | — | — | 🟢 |
| AC3 | idempotent under the new names | 1 test (extends ep5-s1's AC4) | — | — | — | — | 🟢 |
| AC4 | artefact text references updated | — | — | — | manual grep review | — | 🟡 (documentation consistency, not independently unit-testable) |

---

## Coverage gaps

AC4 (artefact prose consistency) is verified by a direct grep/read pass during implementation, not an automated test — this repo has no automated prose-consistency checker for markdown artefacts, and building one is out of scope for a 1-point correction story.

---

## Test Data Strategy

**Source:** Real Postgres integration test, same convention as `ep5-s1` (SKIP, not fail, when `DATABASE_URL` is absent — `check-idp-s1-persist-ideas-in-postgres.js` convention).
**PCI/sensitivity in scope:** No.
**Availability:** Available now (same test file, extended).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A real Postgres connection with the platform's own `journeys` table ALSO created first (via `journey-store-pg.js`'s own `migrateSchema()`), to genuinely reproduce the collision scenario | Real DB when `DATABASE_URL` set | None | This is the critical new check `ep5-s1` never performed — it must prove `customer_journeys` is created correctly even when the platform's own `journeys` table already exists with its own different shape |
| AC2 | Same connection | Real DB | None | |
| AC3 | Same connection, migration run twice | Real DB | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond AC4 noted above.

---

## Unit Tests

### customer_journeys created correctly; platform's journeys table is provably untouched

- **Verifies:** AC1
- **Action:** In the test's setup, first call `journey-store-pg.js`'s own `migrateSchema()` against the same test database (reproducing the real collision scenario), THEN run `scripts/migrate-schema-journeys.js`'s `migrate()`. Query `information_schema.columns` for both `journeys` and `customer_journeys`.
- **Expected result:** `journeys` still has its platform shape (`journey_id`, `owner_id`, `feature_slug`, `data` — unchanged); `customer_journeys` has the feature's own shape (`id`, `tenant_id`, `name`, `description`, `product_id`, `created_at`, `updated_at`)
- **Edge case:** Yes — this is the exact scenario `ep5-s1` never tested and that caused the defect

### customer_journey_stages and feature_customer_journey_stage_mappings created with FKs/indexes

- **Verifies:** AC2
- **Action:** Same setup; query columns, FK constraints (cascade), and `pg_indexes` for both renamed tables
- **Expected result:** Same assertions `ep5-s1` already made, now against the new table/index names
- **Edge case:** No — direct rename of existing, already-passing assertions

### Idempotent under the new names

- **Verifies:** AC3
- **Action:** Run the migration twice; assert no error, no duplicate tables/indexes
- **Edge case:** No — direct rename of `ep5-s1`'s own AC4

### Artefact text consistency

- **Verifies:** AC4
- **Action:** Manual grep pass (`grep -rn "journeys\`\|journey_stages\`\|feature_journey_stage_mappings\`" artefacts/2026-10-05-customer-journey-as-first-class/`) during implementation, confirming every remaining backtick-quoted SQL-identifier reference uses the new names, while English prose is untouched
- **Edge case:** No
