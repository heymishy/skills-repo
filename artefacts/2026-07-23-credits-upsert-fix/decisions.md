# Decisions: Credits Upsert Fix

## DECISION — `adjustBalance`/`adjustBalanceWithAudit`: UPDATE-only to atomic upsert (2026-07-23)

**Context:** `tests/e2e/fixtures/admin-credits-topup.js`'s header comment (written while building the `b1-formed-idea-outer-loop-story-map` E2E story) documented that `POST /api/admin/credits/adjust` fails with HTTP 400 "unknown tenantId" for a brand-new e2e-test tenant, because `getValidTenantIds()` only allowlists tenants with an existing `credits` row, and `adjustBalance`/`adjustBalanceWithAudit` (`src/web-ui/modules/credits.js`) are both plain `UPDATE ... WHERE tenant_id = $2` statements — no row-creation fallback exists anywhere in the runtime application. Critically, the real Stripe `checkout.session.completed` webhook handler (`src/web-ui/routes/billing.js`) calls the same `adjustBalance()` directly, with no allowlist gate — meaning a genuine, real, first-time paying customer's checkout was silently provisioning zero credits.

**Decision:** Change both `adjustBalance` and `adjustBalanceWithAudit` to use `INSERT INTO credits (tenant_id, balance) VALUES ($2, $1) ON CONFLICT (tenant_id) DO UPDATE SET balance = credits.balance + EXCLUDED.balance, updated_at = now()` (with `RETURNING balance` for the audited variant), instead of a plain `UPDATE`.

**Rationale:**
1. The `credits` table's `tenant_id` column is the primary key (`scripts/migrate-schema-credits.js`), so `ON CONFLICT (tenant_id)` is the correct, indexed, single-round-trip atomic-upsert target.
2. `ON CONFLICT DO UPDATE SET balance = credits.balance + EXCLUDED.balance` (not `SET balance = EXCLUDED.balance`) preserves the additive semantics of the original `UPDATE ... SET balance = balance + $1` — an existing tenant's balance is added to, never reset. Verified directly: `tests/check-cuf-s1-credits-upsert-fix.js` UT2/UT4 assert `100 + 50 = 150` and `100 + 25 = 125`, not `50`/`25`.
3. Params stay in the same `[delta, tenantId]` order as the original query (`VALUES ($2, $1)` maps `$1`→delta, `$2`→tenantId onto the same param array), so every existing caller/mock/test that destructures `params[0]` as delta and `params[1]` as tenantId is unaffected — the only thing that changed for existing tests was the SQL-string dispatch predicate their mocks use to recognise the call (`sql.includes('UPDATE credits')` → `sql.includes('INSERT INTO credits') && sql.includes('ON CONFLICT')`), not the params contract.
4. Confirmed via a full-repo grep that no other code path (`INSERT INTO credits`) creates an initial row for a new tenant — the only matches are `scripts/seed-staging.js` and `scripts/smoke-test-credits.js`, both manual one-off scripts outside any request path, and `auth-email.js`'s signup handler only inserts into `users`.

**Consequence:** A brand-new tenant's first `adjustBalance`/`adjustBalanceWithAudit` call now actually creates their `credits` row with the correct balance, instead of silently affecting zero rows. This fully resolves the real production defect described above (the Stripe webhook path, which has no allowlist gate in front of `adjustBalance`). Five existing test files whose mocks pattern-matched the old literal `UPDATE credits` SQL string were updated to recognise the new upsert shape, with their behavioural assertions unchanged: `tests/check-lab-s3.1-credits-model.js`, `tests/check-lab-s3.4-stripe-webhook.js`, `tests/check-arl-s5-credit-audit-log.js`, `tests/check-bri-s3.4-cross-tenant-isolation.js`, `tests/check-bri-s3.5-billing-webhook.js`.

**Source:** `cuf-s1` implementation, 2026-07-23; corroborating investigation: `src/web-ui/modules/credits.js`, `src/web-ui/routes/admin-credits.js`, `src/web-ui/routes/billing.js`, `scripts/migrate-schema-credits.js`, `tests/e2e/fixtures/admin-credits-topup.js` header comment.

---

## GAP — `admin-credits.js`'s `getValidTenantIds()` allowlist remains a separate, unresolved blocker for the admin-UI top-up path (2026-07-23)

**Context:** `admin-credits.js`'s `POST /api/admin/credits/adjust` handler calls `getValidTenantIds()` (`SELECT tenant_id FROM credits`) and rejects with HTTP 400 "unknown tenantId" **before** ever calling `adjustBalanceWithAudit` — this check runs independently of, and earlier than, the SQL fix above. A genuinely brand-new tenant (zero prior `credits` activity of any kind) is still rejected by this allowlist check today, even after this story's fix, because the allowlist's own definition of "known tenant" is circular with the very bug being fixed: it only contains tenants that already have a `credits` row.

**Decision:** Not fixed in this story. Flagged here as a deliberate, transparent scope boundary rather than silently left unresolved or silently expanded into scope.

**Rationale:**
1. This story's scope (per `cuf-s1`'s Architecture Constraints and Out of Scope sections) is narrowly the two `credits.js` data-path functions — a data-path fix, not an API/validation-contract change to `admin-credits.js`.
2. The actual, more serious production defect this story was dispatched to fix — a real paying customer's first Stripe checkout silently provisioning zero credits — is **fully** resolved by the SQL fix alone, because `billing.js`'s webhook handler calls `adjustBalance()` directly with no allowlist gate in front of it. The admin-UI path's residual gate does not affect that defect.
3. Loosening or removing `getValidTenantIds()`'s gate is a distinct design decision (e.g., should the admin UI allow topping up literally any string as a tenantId, with no existence check at all? Or should it check `users` instead of `credits`?) that deserves its own story and ACs, not a scope-creep addition to a narrowly-scoped SQL fix.

**Consequence:** `tests/e2e/fixtures/admin-credits-topup.js`'s underlying flow, which goes through the admin UI (`POST /api/admin/credits/adjust`), is expected to still return HTTP 400 for a genuinely brand-new e2e-test tenant with no prior `credits` row, even after this fix deploys — this is reported honestly in this story's own verification step, not glossed over. A follow-up story is recommended if the admin-UI top-up flow for brand-new tenants is needed (e.g., relaxing `getValidTenantIds()` or checking tenant existence against `users` instead of `credits`).

**Source:** `cuf-s1` investigation, 2026-07-23; `src/web-ui/routes/admin-credits.js` lines implementing `adminCreditsPost`.
