# Test Plan — lab-s3.1 — Credits table + plan data model (Postgres)

**Story:** lab-s3.1
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s3.1-credits-model.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. The `credits.js` module uses an injectable Postgres adapter (D37). Unit tests inject a mock adapter that captures SQL calls and returns preset values. No real Neon Postgres calls in unit tests.

- Smoke tests (`scripts/smoke-test-credits.js`) hit a real database — skipped gracefully if `DATABASE_URL` is not set.
- Migration script (`scripts/migrate-schema-credits.js`) is tested with a mock Postgres client that captures SQL statements.
- The atomic `UPDATE` SQL pattern is verified by asserting the exact SQL string contains `balance = balance + $1`.

**PCI/sensitivity:** None — credits are integers, no personal data.

**Test data gaps:** The smoke test (AC3) requires a real `DATABASE_URL`. In CI without a real DB, this test is expected to emit "SKIP: DATABASE_URL not set" and exit 0.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | Migration creates `credits` and `stripe_events` tables | Unit (mock Postgres) | T1.1, T1.2, T1.3 | None |
| AC2 | Migration is idempotent (can run twice without error) | Unit | T2.1 | None |
| AC3 | Smoke test round-trip (real DB) | Integration (real DB, conditional) | IT3.1 | Conditional on `DATABASE_URL` |
| AC4 | `credits.js` exports `getBalance` and `adjustBalance` with injectable adapter | Unit | T4.1, T4.2, T4.3 | None |
| AC5 | Default adapter stub throws | Unit | T5.1, T5.2 | None |
| AC6 | Production DB adapter wired in `server.js` | Unit | T6.1 | None |
| AC7 | `DATABASE_URL` not in any committed file | Static (git grep) | T7.1 | None |

---

## Gap table

| AC | Gap type | Handling | Justification |
|----|----------|----------|---------------|
| AC3 | Requires real DB | Conditional integration test; skips if `DATABASE_URL` not set; must be run manually before first production deploy | Neon Postgres is a real external service. CI without `DATABASE_URL` skips gracefully. Must be verified in staging before go-live. |

---

## E2E / browser-layout detection

No browser-layout-dependent ACs. No E2E tooling required.

---

## Unit tests

### T1 — Migration script creates both tables (AC1)

**T1.1** — `migration-creates-credits-table`
Covers: AC1
Precondition: Mock Postgres client injected into migration script; captures all SQL strings
Action: Run `scripts/migrate-schema-credits.js` with mock client
Expected: SQL calls include a `CREATE TABLE IF NOT EXISTS credits` statement with columns `tenant_id TEXT PRIMARY KEY`, `balance INTEGER NOT NULL DEFAULT 0`, `updated_at TIMESTAMPTZ`
Edge case: `IF NOT EXISTS` is required — test verifies this clause is present

**T1.2** — `migration-creates-stripe-events-table`
Covers: AC1
Precondition: Same mock client
Action: Same migration run
Expected: SQL calls include `CREATE TABLE IF NOT EXISTS stripe_events` with columns `stripe_event_id TEXT PRIMARY KEY`, `event_type TEXT`, `processed_at TIMESTAMPTZ`
Edge case: none

**T1.3** — `migration-exits-0-on-success`
Covers: AC1
Precondition: Mock client returns success for all SQL calls
Action: Run migration; capture exit code
Expected: Exit code 0; console output confirms both tables created or already existing
Edge case: none

### T2 — Idempotent migration (AC2)

**T2.1** — `migration-second-run-does-not-error`
Covers: AC2
Precondition: Mock client configured to simulate "table already exists" (i.e. `CREATE TABLE IF NOT EXISTS` succeeds without error on re-run)
Action: Run migration script twice in sequence with same mock client
Expected: Both runs exit 0; no error thrown; output confirms idempotent run
Edge case: none

### T4 — `credits.js` module functions (AC4)

**T4.1** — `get-balance-calls-adapter-with-tenant-id`
Covers: AC4
Precondition: Mock DB adapter wired via `setCreditsAdapter(mockAdapter)`; `mockAdapter.query` returns `{ rows: [{ balance: 75 }] }`
Action: Call `getBalance('tenant-abc')`
Expected: Return value is `75`; mock adapter called with a SQL string containing `SELECT` and parameter `'tenant-abc'`
Edge case: If tenant not found (empty rows), return value is `0`

**T4.2** — `adjust-balance-uses-atomic-update-sql`
Covers: AC4
Precondition: Mock DB adapter wired; captures SQL
Action: Call `adjustBalance('tenant-abc', -50)`
Expected: SQL contains `balance = balance + $1` (atomic — not read-modify-write); parameters include `-50` and `'tenant-abc'`
Edge case: A `SELECT` then `UPDATE` pattern is incorrect — test fails if two separate queries are issued

**T4.3** — `adjust-balance-positive-delta-for-credit-provisioning`
Covers: AC4
Precondition: Same setup
Action: Call `adjustBalance('tenant-abc', 1000)` (credit provisioning scenario)
Expected: SQL parameters include `1000` and `'tenant-abc'`; same `balance = balance + $1` pattern
Edge case: none

### T5 — Default stub throws (AC5)

**T5.1** — `default-adapter-throws-on-get-balance`
Covers: AC5
Precondition: `credits.js` required fresh without calling `setCreditsAdapter()`
Action: Call `getBalance('any-tenant')`
Expected: Throws `Error` with message `Adapter not wired: creditsDb. Call setCreditsAdapter() before use.`
Edge case: Must throw — not return `null`, `0`, or `undefined`

**T5.2** — `default-adapter-throws-on-adjust-balance`
Covers: AC5
Precondition: Same as T5.1
Action: Call `adjustBalance('any-tenant', -1)`
Expected: Throws with same error message
Edge case: none

### T6 — Production wiring in `server.js` (AC6)

**T6.1** — `server-js-calls-set-credits-adapter-on-startup`
Covers: AC6
Precondition: `server.js` loaded in test mode (without binding to port); startup log captured
Action: Require server module; inspect log output or module state
Expected: `setCreditsAdapter` is called with a real Postgres adapter; log contains "Credits DB adapter wired"; calling `getBalance()` after server init does NOT throw
Edge case: If `setCreditsAdapter` is never called, `getBalance()` throws — this is the catching mechanism

### T7 — DATABASE_URL not committed (AC7)

**T7.1** — `no-database-url-in-committed-files`
Covers: AC7
Precondition: Running in git repository
Action: Run `git grep DATABASE_URL` (or equivalent file search on committed files)
Expected: Zero results — `DATABASE_URL` does not appear as a literal value in any committed file (`.env` is gitignored; env references in code as `process.env.DATABASE_URL` are acceptable)
Edge case: `process.env.DATABASE_URL` in source code is fine; `DATABASE_URL=postgres://...` as a literal value is a fail

---

## Integration tests

**IT3.1** — `smoke-test-round-trip-real-db` (conditional)
Covers: AC3
Precondition: `DATABASE_URL` set to real Neon Postgres URL; `credits` table exists (migration run first)
Action: Run `node scripts/smoke-test-credits.js`
Expected: Exit code 0; output shows "Credits smoke test PASSED"; balance read-back assertions pass (100, then 90)
Edge case: Without `DATABASE_URL`, script must emit "SKIP: DATABASE_URL not set" and exit 0

---

## NFR tests

No explicit NFR tests — idempotent migration (AC2) is the NFR for this story, covered by T2.1. Atomic balance update (NFR: no race condition) is covered by T4.2.

---

## State update fields

- `totalTests`: 9
- `acTotal`: 7
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false
