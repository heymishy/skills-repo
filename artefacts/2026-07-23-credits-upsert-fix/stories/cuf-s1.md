# Story: Fix credits.js UPDATE-only balance adjustment silently dropping a brand-new tenant's first credit provisioning

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live, real-code-verified defect documented in `tests/e2e/fixtures/admin-credits-topup.js`'s header comment (written while building the `b1-formed-idea-outer-loop-story-map` E2E story), which found the underlying `credits.js` gap while trying to top up a brand-new e2e-test tenant's credits.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below rather than fabricating a metric artefact.

## User Story

As **any tenant (test or real) whose very first credit-affecting event occurs before any `credits` row exists for them — a brand-new paying customer's first successful Stripe checkout, or an admin's first top-up of a newly-signed-up tenant**,
I want **that first credit adjustment to actually create my balance row and set the correct balance**,
So that **I am not silently left with zero credits (or, for the admin path, an outright rejected request) despite a successful payment or a deliberate admin top-up**.

## Benefit Linkage

**Metric moved:** Regression-prevention / production correctness for this repo's own quality gates — not a formal benefit-metric artefact (short-track, per CLAUDE.md guidance to state this explicitly rather than fabricate a metric reference).
**How:** `tests/e2e/fixtures/admin-credits-topup.js`'s header comment documents finding this while building a real E2E flow against `wuce-staging`: `POST /api/admin/credits/adjust` returned HTTP 400 "unknown tenantId" for a brand-new e2e-test tenant, because `getValidTenantIds()` allowlists only tenants with an existing `credits` row, and `adjustBalance`/`adjustBalanceWithAudit` (`src/web-ui/modules/credits.js`) are both plain `UPDATE ... WHERE tenant_id = $2` statements with no row-creation fallback. Critically, the same `adjustBalance()` function is called directly by the real Stripe `checkout.session.completed` webhook handler (`src/web-ui/routes/billing.js`), with no allowlist gate in front of it — meaning a genuine, real, first-time paying customer's checkout silently provisions zero credits today. This is a live revenue-correctness defect, independent of the E2E story that surfaced it.

## Architecture Constraints

- The `credits` table schema (`scripts/migrate-schema-credits.js`) is: `tenant_id TEXT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT now()`. `tenant_id` is the primary key, so `ON CONFLICT (tenant_id)` is the correct atomic-upsert target — no separate unique index is needed.
- **Confirmed no other code path creates an initial `credits` row anywhere in the runtime application.** Grepped `INSERT INTO credits` across the whole repo: the only matches are `scripts/seed-staging.js` (a manual one-off seeding script, not part of any request path) and `scripts/smoke-test-credits.js` (a manual smoke-test script, also not part of any request path, and its own upsert overwrites rather than adds — not a precedent to copy). `src/web-ui/routes/auth-email.js`'s signup handler only inserts into the `users` table; it never creates a `credits` row. So a brand-new tenant genuinely has zero `credits` rows until the first `adjustBalance`/`adjustBalanceWithAudit` call — which today silently no-ops for that tenant.
- **The fix is atomic upsert**, replacing both `UPDATE`-only statements in `src/web-ui/modules/credits.js`:
  - `adjustBalance(tenantId, delta)` → `INSERT INTO credits (tenant_id, balance) VALUES ($2, $1) ON CONFLICT (tenant_id) DO UPDATE SET balance = credits.balance + EXCLUDED.balance, updated_at = now()`, params `[delta, tenantId]` (same param order as today, so any caller/mock relying on `params[0]` = delta / `params[1]` = tenantId is unaffected).
  - `adjustBalanceWithAudit(tenantId, delta, adminId)` → same upsert with `RETURNING balance` appended, so `balanceAfter`/`balanceBefore` are still captured atomically in one round trip (no read-then-write race is introduced).
- **A second, narrower, out-of-scope finding:** `admin-credits.js`'s `getValidTenantIds()` allowlist check runs *before* `adjustBalanceWithAudit` is ever called, and independently rejects a tenant with HTTP 400 if it has no existing `credits` row — this check is not touched by this story (see Out of Scope). This means the SQL fix here fully resolves the real production defect (the Stripe webhook path, which never consults this allowlist), but the **admin UI's own top-up flow for a genuinely brand-new tenant remains blocked by this separate, pre-existing gate** unless a human operator has already caused a `credits` row to exist for that tenant by some other means (e.g. that tenant's own first real Stripe payment). This asymmetry is recorded in `decisions.md` as a flagged residual gap, not silently fixed or silently hidden.
- Do not touch `getValidTenantIds()`, the CSRF guard, or any other logic in `admin-credits.js` beyond what's needed to keep its existing tests passing against the new SQL shape.
- Do not touch Stripe webhook signature verification, idempotency (`stripe_events`), or any other billing logic beyond the fact that `billing.js` calls the now-fixed `adjustBalance()`.
- Several existing tests assert on the *literal SQL string* of the old `UPDATE credits` statement as their mock's dispatch predicate (`tests/check-lab-s3.1-credits-model.js`, `tests/check-lab-s3.4-stripe-webhook.js`, `tests/check-arl-s5-credit-audit-log.js`, `tests/check-bri-s3.4-cross-tenant-isolation.js`, `tests/check-bri-s3.5-billing-webhook.js`) — these must be updated to recognise the new upsert SQL shape, preserving their existing behavioural assertions (they are not weakened, only re-pointed at the new literal string).

## Dependencies

- **Upstream:** None.
- **Downstream:** `tests/e2e/fixtures/admin-credits-topup.js` (owned by a different story, not modified here) documents that once this fix lands, its own blocker #2 is resolved for the Stripe-webhook path; its blocker #1 (provisioning an e2e-test admin identity) and the residual `getValidTenantIds()` gap for the admin-UI path (see Architecture Constraints) remain separate, already-documented follow-ups outside this story's scope.

## Acceptance Criteria

**AC1:** Given a tenant with no existing `credits` row, When `adjustBalance(tenantId, delta)` is called, Then a `credits` row is created for that tenant with `balance = delta` (not silently no-op'd), verified via a subsequent `getBalance(tenantId)` call returning `delta`.

**AC2:** Given a tenant with an existing `credits` row at balance `B`, When `adjustBalance(tenantId, delta)` is called, Then the resulting balance is `B + delta` (added, not overwritten/reset to just `delta`) — regression protection against a naive `ON CONFLICT DO UPDATE SET balance = EXCLUDED.balance` mistake.

**AC3:** Given a tenant with no existing `credits` row, When `adjustBalanceWithAudit(tenantId, delta, adminId)` is called, Then a `credits` row is created with `balance = delta`, the returned `{balanceBefore, balanceAfter}` reflects `0 → delta`, and one `credit_audit_log` row is written with `balance_before = 0` (not `null`) and `balance_after = delta`.

**AC4:** Given a tenant with an existing `credits` row at balance `B`, When `adjustBalanceWithAudit(tenantId, delta, adminId)` is called, Then the resulting balance is `B + delta` and the audit row's `balance_before`/`balance_after` reflect `B → B + delta` — unchanged from today's correct behaviour for existing tenants.

**AC5:** Given the real Stripe webhook handler (`handlePostStripeWebhook` in `src/web-ui/routes/billing.js`) receiving a `checkout.session.completed` event for a brand-new tenant with no existing `credits` row, When the event is processed, Then that tenant's resulting `credits` balance equals the provisioned plan amount (non-zero, correct) — proving the actual production defect (a new paying customer's first checkout silently provisioning zero credits) is fixed.

**AC6:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced) — this includes updating the handful of existing tests whose mocks pattern-match the old literal `UPDATE credits` SQL string so they correctly recognise the new upsert statement.

## Out of Scope

- `admin-credits.js`'s `getValidTenantIds()` allowlist logic — this remains a separate, narrower gap for the admin-UI top-up path specifically (a genuinely brand-new tenant with zero prior `credits` activity is still rejected with HTTP 400 by this pre-existing check, which runs before `adjustBalanceWithAudit` is ever reached). Flagged in `decisions.md`, not fixed here, since fixing it would be a behavioural/API-surface change to the admin endpoint's validation contract, not a data-path fix.
- Any change to Stripe webhook signature verification, event idempotency (`stripe_events` table), or checkout-session creation.
- Any change to `scripts/seed-staging.js` or `scripts/smoke-test-credits.js` (manual one-off scripts, not part of any request path, not touched).
- `tests/e2e/fixtures/admin-credits-topup.js` itself — owned by a different story; not modified by this one.
- A general audit of every other `UPDATE`-only statement in the codebase for the same class of bug — this story fixes the one confirmed, code-verified instance (the `credits` table).

## NFRs

- **Performance:** Negligible — one SQL statement replaces another; `ON CONFLICT DO UPDATE` on a primary-key column is a standard, indexed, single-round-trip Postgres operation, no slower in practice than the `UPDATE` it replaces.
- **Security:** No new attack surface — no new user input reaches the query beyond what already reached the old `UPDATE` (tenantId, delta are unchanged inputs, still fully parameterized).
- **Accessibility:** Not applicable — no UI change.
- **Audit:** Central to AC3/AC4 — `adjustBalanceWithAudit`'s audit trail must reflect `balance_before = 0` (not `null`) for a brand-new tenant's first adjustment, matching real financial-audit expectations.

## Complexity Rating

**Rating:** 1 — well understood; root cause, schema, and correct upsert pattern are all already identified and confirmed against the actual table schema. The remaining work is a narrow, mechanical SQL change plus updating a known, enumerated set of existing tests' mock predicates.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic
