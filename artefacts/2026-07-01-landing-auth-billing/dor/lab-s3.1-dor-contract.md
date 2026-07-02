# DoR Contract — lab-s3.1 — Credits table + plan data model (Postgres)

**Story:** lab-s3.1
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

An idempotent migration script `scripts/migrate-schema-credits.js` creating `credits` (tenant_id TEXT PK, balance INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ) and `stripe_events` (stripe_event_id TEXT PK, event_type TEXT, processed_at TIMESTAMPTZ) tables. A smoke-test script `scripts/smoke-test-credits.js` verifying round-trip read/write. A `src/web-ui/modules/credits.js` module exporting `getBalance(tenantId)`, `adjustBalance(tenantId, delta)`, and `setCreditsAdapter(impl)` (D37: default stub throws). Production DB adapter wired in `server.js` (separate task from module creation).

## What will NOT be built

- Credit provisioning logic (lab-s3.4)
- The 402 turn enforcement guard (lab-s3.3)
- Stripe integration (lab-s3.2 and lab-s3.4)
- Per-model pricing, balance history, or audit ledger

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Run mock migration twice (mock Postgres client captures SQL) → assert both CREATE TABLE IF NOT EXISTS statements present | Unit |
| AC2 | Run mock migration twice → assert no error on second run (idempotency) | Unit |
| AC3 | `DATABASE_URL=<neon> node scripts/smoke-test-credits.js` → exit 0, "Credits smoke test PASSED" | Manual/Integration (skips without DATABASE_URL) |
| AC4 | Mock DB adapter: assert `getBalance` returns 0 for unknown tenant; `adjustBalance(-50)` sends `UPDATE credits SET balance = balance + $1 WHERE tenant_id = $2` with delta=-50 | Unit |
| AC5 | `setCreditsAdapter()` NOT called → `getBalance()` call throws "Adapter not wired: creditsDb" | Unit |
| AC6 | `setCreditsAdapter(realImpl)` called in server.js startup → startup log "Credits DB adapter wired" | Unit |
| AC7 | `git grep DATABASE_URL` on committed files → 0 results | Static check |

## Assumptions

- Neon Postgres is already provisioned (`DATABASE_URL` available as Fly.io secret)
- `pg` npm package already installed
- No negative balance constraint at DB level (intentional — enforcement is at application layer in lab-s3.3)

## Estimated touchpoints

Files: `scripts/migrate-schema-credits.js` (new), `scripts/smoke-test-credits.js` (new), `src/web-ui/modules/credits.js` (new), `src/web-ui/server.js` (modified — wire credits DB adapter)
Services: Neon Postgres
APIs: none

## schemaDepends

None — lab-s3.1 has no upstream story dependencies (Neon Postgres is existing infrastructure, not a story dependency).
