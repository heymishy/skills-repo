# Definition of Ready — ep5-s1: Database migration: create journeys, journey_stages, and feature_journey_stage_mappings tables

**Feature:** 2026-10-05-customer-journey-as-first-class
**Story:** ep5-s1
**Date:** 2026-10-05
**Sign-off:** Hamish King — Platform Owner — 2026-10-05

---

## Hard Block Results

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given/When/Then format | ✅ PASS — 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references a named metric | ✅ PASS — M1 |
| H6 | Complexity rated | ✅ PASS — Rating: 1 |
| H7 | No unresolved HIGH findings from review | ✅ PASS — 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS |
| H8-ext | Cross-story schema dependency check | ✅ PASS — no upstream dependencies |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — migration script only, no UI ACs |
| H-NFR | NFR profile or explicit NFRs in story | ✅ PASS |
| H-NFR2 | Compliance NFR human sign-off | ✅ PASS — no regulatory clause |
| H-NFR3 | Data classification not blank | ✅ PASS — schema only, no regulated data |
| H-NFR-profile | NFR profile existence check | ✅ PASS — inline NFRs govern |
| H-GOV | Approved By: Hamish King — Platform Owner | ✅ PASS |
| H-ADAPTER | Injectable adapter check | ✅ PASS — no adapters introduced |
| H-INF | Infra-plan gate | ✅ PASS — not applicable |
| H-MIG | Migration-review gate | ✅ PASS — not applicable |
| H-DESIGN | Design-token compliance | ✅ PASS — not applicable |

**Hard blocks: 20/20 passed**

---

## Warnings

| # | Check | Outcome |
|---|-------|---------|
| W1 | NFRs populated | ✅ Present |
| W2 | Scope stability declared | ✅ Stable |
| W3 | MEDIUM findings acknowledged | ✅ Resolved — ACs expanded to cover FK cascades (12-M2) and full idempotency definition (12-M1) |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT — solo operator posture; standard for this repo |
| W5 | No UNCERTAIN items in test plan gap table | ✅ No gaps |

---

## Oversight

**Level:** High
**Sign-off:** Hamish King — Platform Owner — 2026-10-05

---

## Contract Proposal (Approved)

**What will be built:**
A new Postgres migration script (`migrate-schema-journeys.js` or equivalent, following the existing `migrate-schema-*.js` naming convention) that creates three new tables (`journeys`, `journey_stages`, `feature_journey_stage_mappings`) with all required columns, foreign key constraints with cascade delete behaviours, and indexes. The script must be idempotent. No route handlers, no UI, no seed data.

**What will NOT be built:**
- Any route handler or UI code (Epics 1–4)
- A rollback script (deferred)
- Seed data
- Additional columns or tables beyond the MVP schema defined in the design artefact
- Any write to `pipeline-state.json`

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: `journeys` table exists with all required columns and types | Query `information_schema.columns`; assert 7 columns with correct nullability and types | Integration |
| AC2: `journey_stages` table exists with all 17 columns | Query `information_schema.columns`; assert all columns including `moment_of_truth boolean default false`, `emotion text nullable`, `channel text nullable` | Integration |
| AC3: `feature_journey_stage_mappings` exists with columns AND FK constraints with cascade delete | Query `information_schema.columns` + `information_schema.referential_constraints`; assert `metric_keys jsonb default '[]'`; assert `journey_stage_id` FK → `journey_stages(id)` ON DELETE CASCADE; assert `journey_id` FK → `journeys(id)` ON DELETE CASCADE | Integration |
| AC4: Migration is idempotent — no error on second run AND no duplicate schema objects | Run migration script twice; assert exit code 0 on second run; query `information_schema.tables` and `pg_indexes` to assert exactly one copy of each table and index | Integration |
| AC5: Named indexes exist | Query `pg_indexes`; assert indexes on `journeys(tenant_id)`, `journey_stages(journey_id)`, `journey_stages(tenant_id)`, `feature_journey_stage_mappings(journey_stage_id)`, `feature_journey_stage_mappings(tenant_id)` | Integration |

**Assumptions:**
- `DATABASE_URL` environment variable points to a running Postgres test database before the test suite runs
- The `products` table already exists (for the FK from `journeys.product_id`)
- The migration follows the same execution pattern as existing `migrate-schema-*.js` scripts (run via `node` directly)
- Idempotency is implemented via `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`

**Estimated touch points:**
Files: `src/web-ui/migrations/migrate-schema-journeys.js` (new), `tests/check-ep5-s1-migration.js` (new)
Services: Postgres (existing connection pool or direct `pg` client)
APIs: None

---

## Acceptance Criteria (as signed off — expanded from story to address W3 resolution)

**AC1:** Given the migration script is run against a Postgres database, When the migration completes, Then the `journeys` table exists with columns: `id` (UUID PK), `tenant_id` (text, not null), `name` (text, not null), `description` (text, nullable), `product_id` (UUID, nullable, FK → products), `created_at` (timestamptz), `updated_at` (timestamptz).

**AC2:** Given the migration script is run, When the migration completes, Then the `journey_stages` table exists with all columns from the design artefact: `id` (UUID PK), `journey_id` (UUID, not null), `tenant_id` (text, not null), `name` (text, not null), `position` (integer, not null), `description` (text, nullable), `customer_actions` (text, nullable), `touchpoints` (text, nullable), `channel` (text, nullable — enum: web, mobile, in-person, phone, email, other), `emotion` (text, nullable — enum: positive, neutral, negative, mixed), `pain_points` (text, nullable), `opportunities` (text, nullable), `moment_of_truth` (boolean, default false), `created_at` (timestamptz), `updated_at` (timestamptz).

**AC3 (expanded — W3/12-M2 resolution):** Given the migration script is run, When the migration completes, Then the `feature_journey_stage_mappings` table exists with columns: `id` (UUID PK), `journey_stage_id` (UUID, not null), `journey_id` (UUID, not null), `tenant_id` (text, not null), `feature_slug` (text, not null), `metric_keys` (JSONB, default `[]`), `created_at` (timestamptz). Foreign keys are in place: `journey_stage_id` references `journey_stages(id)` with `ON DELETE CASCADE`, and `journey_id` references `journeys(id)` with `ON DELETE CASCADE`.

**AC4 (expanded — W3/12-M1 resolution):** Given the migration is run on a database that already has data, When the migration completes, Then existing data is unaffected AND the migration is idempotent — running it a second time completes without error AND produces no duplicate tables, indexes, or constraints. `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` (or equivalent) are used throughout.

**AC5:** Given the migration script is run, When the migration completes, Then indexes exist on: `journeys(tenant_id)`, `journey_stages(journey_id)`, `journey_stages(tenant_id)`, `feature_journey_stage_mappings(journey_stage_id)`, `feature_journey_stage_mappings(tenant_id)`.

---

## Coding Agent Instructions

### Your task

Implement `migrate-schema-journeys.js` — a Postgres migration script that creates three new tables for the customer journey feature. Write a corresponding test file `tests/check-ep5-s1-migration.js`.

### Scope contract

**Files you MUST touch:**
- `src/web-ui/migrations/migrate-schema-journeys.js` — create this file (new)
- `tests/check-ep5-s1-migration.js` — create this file (new)

**Files you MUST NOT touch:**
- Any existing route handler, UI file, or template
- `pipeline-state.json` or `workspace/state.json`
- Any existing migration script
- Any file under `artefacts/` or `.github/skills/`

### What to build

**Migration script** (`src/web-ui/migrations/migrate-schema-journeys.js`):

Create three tables in this order (to satisfy FK dependencies):

1. **`journeys`** table:
```sql
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journeys_tenant_id ON journeys(tenant_id);
```

2. **`journey_stages`** table:
```sql
CREATE TABLE IF NOT EXISTS journey_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  description TEXT,
  customer_actions TEXT,
  touchpoints TEXT,
  channel TEXT,
  emotion TEXT,
  pain_points TEXT,
  opportunities TEXT,
  moment_of_truth BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journey_stages_journey_id ON journey_stages(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_stages_tenant_id ON journey_stages(tenant_id);
```

3. **`feature_journey_stage_mappings`** table:
```sql
CREATE TABLE IF NOT EXISTS feature_journey_stage_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_stage_id UUID NOT NULL REFERENCES journey_stages(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  feature_slug TEXT NOT NULL,
  metric_keys JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fjs_mappings_stage_id ON feature_journey_stage_mappings(journey_stage_id);
CREATE INDEX IF NOT EXISTS idx_fjs_mappings_tenant_id ON feature_journey_stage_mappings(tenant_id);
```

The script must read `DATABASE_URL` from `process.env` and use the existing `pg` client pattern in this codebase. If `DATABASE_URL` is not set, exit with a clear error message. Log each table creation step. Exit with code 0 on success, non-zero on error.

**Test file** (`tests/check-ep5-s1-migration.js`):

Use the existing Node.js `async test()` helper pattern. All tests require `DATABASE_URL` to be set — if absent, all tests fail with "DATABASE_URL not set — cannot run migration tests."

Tests must cover:

- **AC1:** Query `information_schema.columns` for `journeys` — assert 7 columns with correct names and nullability
- **AC2:** Query `information_schema.columns` for `journey_stages` — assert all 15 columns including `moment_of_truth` (boolean, default false)
- **AC3:** Query `information_schema.columns` for `feature_journey_stage_mappings` — assert 7 columns; query `information_schema.referential_constraints` to assert both FK constraints with cascade delete exist
- **AC4:** Run the migration script a second time programmatically (or via `child_process.execSync`) — assert exit code 0; query `information_schema.tables` to assert exactly one row per table name; query `pg_indexes` to assert no duplicate index names
- **AC5:** Query `pg_indexes` — assert all 5 named indexes exist

### Constraints

- Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` throughout — no conditional existence checks via separate queries
- Do not use any new npm dependencies — use the `pg` module already present in `package.json`
- Do not add enum types (TEXT columns with application-layer validation are sufficient for `channel` and `emotion`)
- Follow the file naming convention for existing migration scripts in this codebase
- The `products` table is assumed to exist — do not create it

### Definition of Done for this story

Your PR is complete when:
1. `node src/web-ui/migrations/migrate-schema-journeys.js` runs successfully against a Postgres database and creates all three tables
2. Running it a second time exits with code 0 and produces no duplicate schema objects
3. `node tests/check-ep5-s1-migration.js` passes all assertions with zero failures
4. No files outside the declared touch points are modified
5. `npm test` continues to pass (no regressions in existing test suite)

Open the PR as a draft. Do not mark ready for review. Do not merge.