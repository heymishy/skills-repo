# DoR Contract — lab-s3.3 — Credit enforcement — 402 turn guard

**Story:** lab-s3.3
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

A new `src/web-ui/middleware/credits-guard.js` middleware that reads `req.session.tenantId`, calls `getBalance(tenantId)` from `credits.js` (lab-s3.1), and either calls `next()` (balance > 0) or returns 402 with JSON body `{ "error": "Insufficient credits", "topUpUrl": "/settings/billing" }` (balance ≤ 0). The middleware is mounted on the turn route (`POST /api/turn` or equivalent) BEFORE the Anthropic API adapter call. The `adjustBalance(tenantId, -TURN_CREDIT_COST)` call is made after a successful turn (Anthropic adapter called). An audit log event `credits_balance_check` is emitted on every 402 response. Wired in `server.js`.

## What will NOT be built

- Credit top-up UI or flow (lab-s3.5 + Stripe Customer Portal)
- Grace period (explicitly no grace period in MVP — any balance ≤ 0 blocks)
- Per-model credit rates (single rate per turn in MVP)
- The `/settings/billing` route being live (that string is the body of the 402 response — the route itself is lab-s3.5)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Turn with balance=0: mock credits adapter returns 0 → assert 402, body `{ "error": "Insufficient credits", "topUpUrl": "/settings/billing" }`, Anthropic adapter invocation count = 0 | Unit |
| AC2 | Turn with balance=-10: same 402 result, Anthropic adapter count = 0 | Unit |
| AC3 | Turn with balance=50: Anthropic adapter called, `adjustBalance(-1)` called, response passes through | Unit |
| AC4 | `TURN_CREDIT_COST=2` in env: successful turn → `adjustBalance(-2)` called; no env var → `adjustBalance(-1)` default | Unit |
| AC5 | Balance check is first operation after auth: no journey state, no API call before 402 (enforced by test structure — credits-guard middleware is the first thing called) | Unit |
| AC6 | 402 response: audit log contains `credits_balance_check` event with `{ tenantId, balance, result: 'blocked' }` | Unit |
| AC7 | Anthropic adapter mock tracks invocations; test explicitly asserts `anthropicAdapter.callCount === 0` on 402 | Unit |

## Assumptions

- lab-s3.1 is complete — `credits.js` module with injectable adapter exists
- Turn handler already exists at `POST /api/turn` or equivalent path — this story mounts middleware on it
- Anthropic adapter in the turn handler is already injectable (existing pattern in codebase)
- `TURN_CREDIT_COST` env var is read at request time (not cached at module load time) to allow test overrides

## Estimated touchpoints

Files: `src/web-ui/middleware/credits-guard.js` (new), `src/web-ui/routes/` (modified — mount credits-guard on turn route), `src/web-ui/server.js` (modified — verify credits-guard is wired correctly in route chain)
Services: Neon Postgres (via credits.js adapter — monkeypatched in tests)
APIs: Anthropic (monkeypatched in tests)

## schemaDepends

`dorStatus` — upstream story lab-s3.1 must be `dorStatus: "signed-off"` before implementation begins. `dorStatus` is a valid field in `pipeline-state.schema.json`.
