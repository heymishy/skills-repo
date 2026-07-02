# Story lab-s3.3 — Credit enforcement — 402 turn guard

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e3-billing-credits
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## User story

As the platform operator,
I want every turn attempt by a tenant with zero or negative credit balance to be rejected with HTTP 402 before any Anthropic API call is made,
So that no Anthropic API costs are incurred for unpaid usage and the operator's cost exposure is bounded.

## Metric linkage

- **M2** (Credits enforcement, benefit-metric.md §M2): This story is the primary delivery vehicle for M2. The target is 100% enforcement: zero turns processed when balance ≤ 0. The minimum validation signal is the automated test suite asserting 402 returned on every turn attempt with balance = 0 and no Anthropic API call made (verified via adapter stub).

## Acceptance criteria

**AC1** — Turn attempt with balance = 0 returns 402 with no Anthropic API call
Given a tenant has `balance = 0` in the `credits` table,
When the turn handler (`POST /api/turn` or equivalent) receives a request from that tenant,
Then: (1) the credits balance is checked before any other processing, (2) the Anthropic API adapter is NOT called (verified by stub assertion), (3) the response is HTTP 402 with JSON body `{ "error": "Insufficient credits", "topUpUrl": "/settings/billing" }`.

**AC2** — Turn attempt with balance < 0 returns 402 with no Anthropic API call
Given a tenant has `balance = -10` in the `credits` table (race condition scenario where balance went negative),
When the turn handler receives a request,
Then the behaviour is identical to AC1: 402 returned, Anthropic API not called.

**AC3** — Turn attempt with balance > 0 decrements balance and proceeds normally
Given a tenant has `balance = 50`,
When the turn handler receives a request,
Then: (1) `adjustBalance(tenantId, -1)` is called (or the configured per-turn credit cost), (2) the Anthropic API adapter IS called, (3) the response is the normal turn response.

**AC4** — The per-turn credit cost is configurable via environment variable
Given `TURN_CREDIT_COST` is set to `2` (for example),
When a successful turn is processed (AC3),
Then `adjustBalance(tenantId, -2)` is called — not `-1`.
When `TURN_CREDIT_COST` is not set, the default is `1`.

**AC5** — Enforcement fires before turn processing: no partial processing on 402
Given a tenant with balance = 0,
When the turn handler runs,
Then the balance check is the first operation after session authentication — no turn state is created, no journey is updated, and no Anthropic API adapter call occurs before the 402 is returned.

**AC6** — `credits_balance_check` is audit-logged on every 402 response
Given the enforcement fires and returns 402,
When the audit logger records the event,
Then a `credits_balance_check` event is logged with `{ tenantId, balance, result: 'blocked' }` — with no personal data beyond the tenantId.

**AC7** — Automated test suite asserts Anthropic adapter is NOT called on 402
Given the test for AC1 runs with a mock Anthropic adapter that tracks invocations,
When the turn handler returns 402,
Then the mock adapter invocation count is 0 — the test explicitly asserts this.

## Out of scope

- Credit top-up UI or flow (that is lab-s3.5 and the Stripe Customer Portal)
- Grace period (discovery is explicit: no grace period in MVP)
- Per-model credit rates (single credit rate per turn in MVP; per-model rates deferred)
- The `topUpUrl` link in the 402 response actually working (the billing portal is lab-s3.5 — in this story `/settings/billing` exists as a string in the JSON body but the route itself is not yet live)

## Dependencies

- **lab-s3.1 must be complete** — `credits` table and `credits.js` module must exist before this story can wire into the turn handler
- Turn handler must exist (already present in `src/web-ui/` — the existing journey/turn processing route)

## Implementation touchpoints

- `src/web-ui/middleware/credits-guard.js` (new): middleware that reads `req.session.tenantId`, calls `getBalance(tenantId)`, and either calls `next()` (balance > 0) or returns 402 (balance ≤ 0)
- `src/web-ui/routes/` (modified): mount `credits-guard` middleware on the turn route before the Anthropic API adapter call
- `src/web-ui/server.js` (modified): ensure `credits-guard` is wired correctly in the route chain
- `src/web-ui/modules/credits.js` (from lab-s3.1): `getBalance` and `adjustBalance` called from the guard

## Architecture Constraints

- **D37 (Injectable adapter rule, CLAUDE.md)**: The credits guard uses `getBalance`/`adjustBalance` from `credits.js`, which already has a throwing stub (lab-s3.1 AC5). The Anthropic adapter is already injectable in the existing turn handler — this story must verify the guard fires before that adapter call.
- **ADR-011 (Artefact-first)**: `src/web-ui/middleware/credits-guard.js` is a new `src/` module — covered by this story artefact.
- **Enforcement before any side effects (AC5)**: The credits check must be the first operation after session authentication. No exceptions.
- **No grace period**: The discovery is explicit. Any balance ≤ 0 blocks the turn. This is not configurable in MVP.

## NFRs

- **Performance**: The balance check adds one Postgres query per turn. This is the intended MVP behaviour — no caching in MVP. The Neon connection string already supports connection pooling if needed.
- **No `accessToken` in 402 body or logs**: The audit log event (AC6) must not include the session token.

## Test

Node.js tests: `tests/check-lab-s3.3-credit-enforcement.js` (new) — verify (1) balance = 0 → 402, Anthropic adapter call count = 0 (AC1, AC7), (2) balance = -10 → 402, no API call (AC2), (3) balance = 50 → Anthropic adapter called, `adjustBalance(-1)` called, response passes through (AC3), (4) `TURN_CREDIT_COST=2` env → `adjustBalance(-2)` (AC4), (5) audit log event emitted on 402 (AC6). Monkeypatch both `credits.js` adapter and Anthropic adapter.
