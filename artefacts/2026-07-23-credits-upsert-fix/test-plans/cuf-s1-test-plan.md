## Test Plan: Fix credits.js UPDATE-only balance adjustment silently dropping a brand-new tenant's first credit provisioning

**Story reference:** artefacts/2026-07-23-credits-upsert-fix/stories/cuf-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | new tenant, `adjustBalance` creates row with balance = delta | 1 | — | — | — | — | 🟢 |
| AC2 | existing tenant, `adjustBalance` adds delta (not overwrite) | 1 | — | — | — | — | 🟢 |
| AC3 | new tenant, `adjustBalanceWithAudit` creates row + correct audit (0 → delta) | 1 | — | — | — | — | 🟢 |
| AC4 | existing tenant, `adjustBalanceWithAudit` adds delta + correct audit (B → B+delta) | 1 | — | — | — | — | 🟢 |
| AC5 | real Stripe webhook, brand-new tenant, correct non-zero balance | — | 1 | — | — | — | 🟢 |
| AC6 | full regression pass, no new baseline failures, existing mocks updated | — | 1 | — | — | — | 🟢 |
| AC5 (real-world) | real `wuce-staging` admin top-up / webhook flow confirms fix | — | — | 1 | — | Deploy-dependent | 🟡 |

---

## Test Data Strategy

**Source:** Fixtures — a stateful in-memory fake Postgres query executor that actually implements both the OLD (buggy, `UPDATE`-only) and NEW (upsert) SQL shapes' real semantics against a `{tenantId: balance}` map, so the same test can prove RED against today's code and GREEN against the fix, not just "a certain SQL keyword was present."
**PCI/sensitivity in scope:** No — no real Stripe API keys, no real Postgres connection.
**Availability:** Available now for all unit/integration rows. The real-world row requires a live `flyctl deploy` and is tracked separately.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fake DB with zero rows, tenant `tenant-brand-new` | Fixture | None | |
| AC2 | Fake DB seeded with `tenant-existing: 100` | Fixture | None | |
| AC3 | Fake DB with zero rows, tenant `tenant-brand-new-audit` | Fixture | None | |
| AC4 | Fake DB seeded with `tenant-existing-audit: 100` | Fixture | None | |
| AC5 | Real `handlePostStripeWebhook` (billing.js) + fake credits DB with zero rows for a new tenant + `CREDITS_PLAN_STARTER` env var | Fixture, reusing lab-s3.4's webhook-test pattern | None | Reuses the existing `checkout.session.completed` event shape from `tests/check-lab-s3.4-stripe-webhook.js` rather than inventing a new one |
| AC6 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |

### PCI / sensitivity constraints

None — no real payment data anywhere in this story's own tests.

### Gaps

The real-world row (confirming a previously-blocked top-up now succeeds against real `wuce-staging`) depends on a live `flyctl deploy` succeeding within this session. If it cannot complete, this row is reported as pending, not claimed as passing.

---

## Unit Tests

### UT1 — `adjustBalance` creates a row for a brand-new tenant (AC1)
- **Verifies:** AC1
- **Component:** `src/web-ui/modules/credits.js` — `adjustBalance`
- **Action:** Call `adjustBalance('tenant-brand-new', 500)` against a fake DB with zero existing rows, then `getBalance('tenant-brand-new')`
- **Expected result:** `getBalance` returns `500` (not `0`)
- **RED against current code:** the current `UPDATE ... WHERE tenant_id = $2` affects zero rows when none exists; the row is never created; `getBalance` still returns `0`.

### UT2 — `adjustBalance` adds to an existing tenant's balance, does not overwrite (AC2)
- **Verifies:** AC2
- **Component:** `src/web-ui/modules/credits.js` — `adjustBalance`
- **Action:** Seed fake DB with `tenant-existing: 100`; call `adjustBalance('tenant-existing', 50)`; then `getBalance('tenant-existing')`
- **Expected result:** `150` (both before the fix and after — this is the regression guard proving the upsert's `ON CONFLICT DO UPDATE SET balance = credits.balance + EXCLUDED.balance` adds rather than a naive `SET balance = EXCLUDED.balance` which would wrongly reset to `50`)

### UT3 — `adjustBalanceWithAudit` creates a row and correct audit trail for a brand-new tenant (AC3)
- **Verifies:** AC3
- **Component:** `src/web-ui/modules/credits.js` — `adjustBalanceWithAudit`
- **Action:** Call `adjustBalanceWithAudit('tenant-brand-new-audit', 500, 'alice')` against a fake DB with zero existing rows
- **Expected result:** Returned `{balanceBefore: 0, balanceAfter: 500}` (not `{balanceBefore: null, balanceAfter: null}`); one `credit_audit_log` row written with `balance_before = 0`, `balance_after = 500`
- **RED against current code:** `UPDATE ... RETURNING balance` returns zero rows for a nonexistent tenant, so `balanceAfter` is computed as `null`, `balanceBefore` is `null`, and the audit row is written with nonsensical null balances while the `credits` table itself still has no row.

### UT4 — `adjustBalanceWithAudit` regression: existing tenant unaffected (AC4)
- **Verifies:** AC4
- **Component:** `src/web-ui/modules/credits.js` — `adjustBalanceWithAudit`
- **Action:** Seed fake DB with `tenant-existing-audit: 100`; call `adjustBalanceWithAudit('tenant-existing-audit', 25, 'alice')`
- **Expected result:** Returned `{balanceBefore: 100, balanceAfter: 125}`; audit row matches

---

## Integration Tests

### IT1 — real Stripe webhook path provisions credits for a brand-new tenant (AC5)
- **Verifies:** AC5
- **Components involved:** `handlePostStripeWebhook` (`src/web-ui/routes/billing.js`), `adjustBalance` (`src/web-ui/modules/credits.js`), fake credits DB, fake webhook-idempotency DB
- **Precondition:** `CREDITS_PLAN_STARTER=1000`; fake credits DB has zero rows for `tenant-webhook-new`
- **Action:** Dispatch a `checkout.session.completed` event with `client_reference_id: 'tenant-webhook-new'`, `metadata.planName: 'STARTER'` through `handlePostStripeWebhook`, reusing the same mock shapes as `tests/check-lab-s3.4-stripe-webhook.js`
- **Expected result:** `getBalance('tenant-webhook-new')` returns `1000` (not `0`) — this is the actual real-world production defect, reproduced and fixed at the integration level without needing a live Stripe account
- **RED against current code:** balance stays `0` because the row is never created

### IT2 — full existing regression suite (AC6)
- **Verifies:** AC6
- **Action:** Run `npm test`
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`. This requires updating 5 existing test files whose mocks pattern-match the literal old SQL string (`tests/check-lab-s3.1-credits-model.js`, `tests/check-lab-s3.4-stripe-webhook.js`, `tests/check-arl-s5-credit-audit-log.js`, `tests/check-bri-s3.4-cross-tenant-isolation.js`, `tests/check-bri-s3.5-billing-webhook.js`) to recognise the new upsert SQL shape — their behavioural assertions are unchanged, only the dispatch predicate inside each mock.

---

## E2E Tests

### E2E1 — real `wuce-staging` confirmation (real-world, deploy-dependent)
- **Verifies:** AC5 (real-world)
- **Components involved:** Real `wuce-staging` deployment
- **Precondition:** This fix is deployed via `flyctl deploy`
- **Action:** Re-run the flow underlying `tests/e2e/fixtures/admin-credits-topup.js` (or the relevant portion of `b1-formed-idea-outer-loop-story-map.spec.js`) against real staging
- **Expected result:** A credit top-up that was previously blocked (HTTP 400 or silently zero balance) now succeeds for a tenant with no prior `credits` row — **noting the admin-UI path specifically may still be blocked by the separate, out-of-scope `getValidTenantIds()` gap documented in the story's Architecture Constraints; if so, this is reported honestly, not glossed over.**
- **Contingency:** If deploy cannot complete this session, reported as not run.

---

## NFR Tests

### NFR-Audit — `balance_before` is `0`, never `null`, for a brand-new tenant's first audited adjustment
Covered by UT3 directly — this is a real correctness property for the audit trail, not just a side effect.

---

## Out of Scope for This Test Plan

- `getValidTenantIds()` / admin endpoint allowlist behaviour — unchanged, not tested here (already covered by existing `check-arl-s3-admin-credits.js`).
- Stripe signature verification, idempotency, checkout-session creation.
- `scripts/seed-staging.js`, `scripts/smoke-test-credits.js` — untouched manual scripts.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-staging E2E confirmation (E2E1) depends on a live `flyctl deploy` succeeding within this session | Deploy environment availability is not guaranteed at test-plan-authoring time | E2E1's contingency clause requires explicit "not run" reporting rather than a fabricated pass |
| Admin-UI top-up for a genuinely brand-new tenant may still 400 due to the out-of-scope `getValidTenantIds()` gap | Documented, deliberate scope boundary — see story's Architecture Constraints and Out of Scope | Reported honestly in the final verification step; not silently fixed or hidden |
