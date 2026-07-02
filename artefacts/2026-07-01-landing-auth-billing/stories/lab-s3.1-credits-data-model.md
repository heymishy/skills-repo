# Story lab-s3.1 — Credits table + plan data model (Postgres)

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e3-billing-credits
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 1
**Scope stability:** Stable

## User story

As the platform operator,
I want a `credits` table in Postgres that tracks each tenant's current credit balance,
So that credit enforcement (402 turn guard) and credit provisioning (Stripe webhook) have a durable, queryable data source.

## Metric linkage

- **M2** (Credits enforcement, benefit-metric.md §M2): The `credits` table is the data source for the weekly production query "tenants with balance ≤ 0 who have turns logged after balance reached zero — expected: zero rows." Without this table, M2 cannot be measured.
- **M3** (Monthly cost recovery rate, benefit-metric.md §M3): The credits table records credit allocations from Stripe payments — it is the source of truth for how many credits were provisioned versus consumed.

## Acceptance criteria

**AC1** — `scripts/migrate-schema-credits.js` creates the `credits` table and `stripe_events` table
Given `DATABASE_URL` is set,
When `node scripts/migrate-schema-credits.js` is run,
Then exit code is 0 and the output confirms both tables created (or already exist):
- `credits` table: columns `tenant_id` (TEXT PRIMARY KEY), `balance` (INTEGER NOT NULL DEFAULT 0), `updated_at` (TIMESTAMPTZ)
- `stripe_events` table: columns `stripe_event_id` (TEXT PRIMARY KEY), `event_type` (TEXT), `processed_at` (TIMESTAMPTZ) — used for webhook idempotency in lab-s3.4

**AC2** — Migration is idempotent: running twice does not fail
Given the migration script has been run once,
When it is run a second time,
Then exit code is still 0 and no error is thrown — `CREATE TABLE IF NOT EXISTS` semantics.

**AC3** — `scripts/smoke-test-credits.js` confirms round-trip read/write
Given `DATABASE_URL` is set,
When `node scripts/smoke-test-credits.js` is run,
Then the script: (1) upserts a test `tenant_id` with `balance = 100`, (2) reads it back and asserts balance is 100, (3) decrements balance by 10, (4) reads again and asserts balance is 90, (5) deletes the test row, (6) exits 0 with "Credits smoke test PASSED".

**AC4** — `src/web-ui/modules/credits.js` exports `getBalance(tenantId)` and `adjustBalance(tenantId, delta)` with injectable Postgres adapter
Given the credits module is loaded,
When `getBalance('test-tenant')` is called with the real DB adapter,
Then the current balance for that tenant is returned (or 0 if not found).
When `adjustBalance('test-tenant', -50)` is called,
Then the balance is decremented atomically (Postgres `UPDATE credits SET balance = balance + $1 WHERE tenant_id = $2` pattern — negative delta for decrement).

**AC5** — Default DB adapter stub throws (D37 compliance)
Given `credits.js` is loaded without calling `setCreditsAdapter()`,
When `getBalance()` or `adjustBalance()` is called,
Then the call throws `Error('Adapter not wired: creditsDb. Call setCreditsAdapter() before use.')`.

**AC6** — Production DB adapter is wired in `server.js`
Given the server starts with `DATABASE_URL` set,
When `server.js` initialises the credits module,
Then `setCreditsAdapter(realPgAdapter)` is called before any route handler can invoke `getBalance` or `adjustBalance`. A startup log message confirms "Credits DB adapter wired".

**AC7** — `DATABASE_URL` does not appear in any committed file
Given the credits migration and module are committed,
When `git grep DATABASE_URL` is run on the commit,
Then zero results are returned — `DATABASE_URL` is an environment variable only.

## Out of scope

- Credit provisioning logic (that is lab-s3.4 webhook handler)
- The 402 turn enforcement (lab-s3.3)
- Stripe integration (lab-s3.2 and lab-s3.4)
- Per-model pricing or granular token tracking (deferred per discovery)
- Balance history or audit ledger (balance is a running total — no history rows in MVP)

## Dependencies

- Neon Postgres already provisioned (established in wuce multi-tenancy sprint-3 work: `DATABASE_URL` secret exists in Fly.io)
- `pg` npm package already installed

## Implementation touchpoints

- `scripts/migrate-schema-credits.js` (new): idempotent migration for `credits` and `stripe_events` tables
- `scripts/smoke-test-credits.js` (new): round-trip smoke test
- `src/web-ui/modules/credits.js` (new): `getBalance`, `adjustBalance`, `setCreditsAdapter`
- `src/web-ui/server.js` (modified): wire credits DB adapter on startup (D37 AC6)

## Architecture Constraints

- **D37 (Injectable adapter rule, CLAUDE.md)**: Default stub MUST throw. Production wiring in `server.js` is a separate implementation task and explicit DoR AC (AC6). Enforced by AC5 and AC6.
- **ADR-011 (Artefact-first)**: `src/web-ui/modules/credits.js` is a new `src/` module — covered by this story artefact.
- **No credentials committed (CLAUDE.md)**: `DATABASE_URL` must never appear in committed code. AC7 enforces this.
- **Atomic balance updates**: `adjustBalance` must use a Postgres `UPDATE ... SET balance = balance + $delta` statement — not read-modify-write — to prevent race conditions between concurrent turn decrements.
- **CJS-only (Style Guide)**: `credits.js` uses `require()`/`module.exports`.

## NFRs

- **No negative balance writes enforced at DB layer**: The `credits` table does not constrain balance ≥ 0 at the Postgres level (enforcement is at the application layer in lab-s3.3). This is intentional — the webhook handler must be able to write credits even when a race condition briefly drove balance below zero.
- **Idempotent migration (AC2)**: Required because Fly.io deploy may run migration logic on each deploy startup.

## Test

Node.js tests: `tests/check-lab-s3.1-credits-model.js` (new) — verify (1) default adapter stub throws (AC5), (2) `getBalance` returns 0 for unknown tenant when wired with mock adapter, (3) `adjustBalance(-50)` sends correct Postgres `UPDATE` statement (verify SQL parameter via mock), (4) idempotent migration script (AC2 — run mock migration twice, assert no error). Smoke test: `DATABASE_URL=<neon-url> node scripts/smoke-test-credits.js` (real DB, skips gracefully without `DATABASE_URL`).
