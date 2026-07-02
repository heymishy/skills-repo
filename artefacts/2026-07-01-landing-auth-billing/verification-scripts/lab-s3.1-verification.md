# AC Verification Script — lab-s3.1 — Credits table + plan data model (Postgres)

**Story:** lab-s3.1
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / Platform Engineer

---

## Setup

Ensure `DATABASE_URL` is set to the Neon Postgres connection string (Fly.io secret, also in local `.env` for this check).

**Run automated checks first:**
```
node tests/check-lab-s3.1-credits-model.js
```
Expected: all checks pass. Zero failures.

---

## Scenarios

### Scenario AC1 — Migration creates both database tables

1. Ensure `DATABASE_URL` is set.
2. Run the migration script:
   ```
   node scripts/migrate-schema-credits.js
   ```
3. **Expected:** Exit code is 0. Console output confirms both tables:
   - "credits table: OK" (or similar)
   - "stripe_events table: OK" (or similar)
4. Connect to the Neon database (via the Neon console or `psql`) and verify both tables exist with the correct columns:
   - `credits`: `tenant_id` (text, primary key), `balance` (integer, default 0), `updated_at` (timestamptz)
   - `stripe_events`: `stripe_event_id` (text, primary key), `event_type` (text), `processed_at` (timestamptz)
5. If either table is missing, or columns differ, AC1 fails.

---

### Scenario AC2 — Migration is safe to run twice

1. Run the migration script twice in a row:
   ```
   node scripts/migrate-schema-credits.js
   node scripts/migrate-schema-credits.js
   ```
2. **Expected:** Both runs exit with code 0. No error messages. The second run should say something like "tables already exist — skipping" or complete without error.
3. If the second run throws an error or exits non-zero, AC2 fails.

---

### Scenario AC3 — Smoke test confirms round-trip read/write

1. Ensure the migration from AC1 has been run.
2. Run the smoke test:
   ```
   node scripts/smoke-test-credits.js
   ```
3. **Expected:** Exit code 0. Console output shows all 5 steps passing:
   - "Upserted test tenant with balance 100 — OK"
   - "Read balance: 100 — OK"
   - "Decremented by 10 — OK"
   - "Read balance: 90 — OK"
   - "Deleted test row — OK"
   - "Credits smoke test PASSED"
4. If `DATABASE_URL` is not set, the script should print "SKIP: DATABASE_URL not set" and exit 0 (not fail).
5. If any step fails or prints a wrong balance, AC3 fails.

---

### Scenario AC4 — credits.js exports work with the real adapter

*Verified automatically by the unit tests. Manual verification:*

1. Run `node tests/check-lab-s3.1-credits-model.js`.
2. Check tests for "get-balance-calls-adapter-with-tenant-id" and "adjust-balance-uses-atomic-update-sql".
3. **Expected:** Both pass. The atomic update test is particularly important — a `SELECT` followed by `UPDATE` pattern (read-modify-write) is incorrect and would fail under concurrent load.

---

### Scenario AC5 — Default adapter stub throws (not silently returns)

*Verified automatically. Human verification:*

1. Look for tests named "default-adapter-throws-on-*" in the automated check output.
2. **Expected:** Both pass. This confirms that if `credits.js` is ever used without wiring the real adapter, a loud error is thrown immediately — not a silent null/undefined return.

---

### Scenario AC6 — Server starts with credits adapter wired

1. Start the server with `DATABASE_URL` set.
2. Check the console output for a message like "Credits DB adapter wired".
3. **Expected:** The message appears during startup. No "Adapter not wired" error appears.
4. Navigate to any page that would trigger a credits check (e.g. `GET /api/turn` if implemented). The request should not throw "Adapter not wired".

---

### Scenario AC7 — DATABASE_URL is not in any committed file

1. In a terminal at the repo root, run:
   ```
   git grep DATABASE_URL
   ```
2. **Expected:** Zero results — or only results in `.gitignore` or comments that reference the env var NAME (not a real value). A result showing `DATABASE_URL=postgres://...` as a literal value in a committed file is a FAIL.

---

## Reset instructions

After AC3 (smoke test), the test row is automatically deleted by the script. No manual cleanup needed.
