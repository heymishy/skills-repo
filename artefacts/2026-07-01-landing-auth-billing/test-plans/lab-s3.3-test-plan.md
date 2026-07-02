# Test Plan — lab-s3.3 — Credit enforcement — 402 turn guard

**Story:** lab-s3.3
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s3.3-credit-enforcement.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. Both the credits adapter (`credits.js`) and the Anthropic API adapter are injectable. Tests inject:
- A mock credits adapter configured to return a preset balance
- A mock Anthropic adapter with an invocation counter (to verify it is NOT called on 402)

Session is populated with `{ accessToken: 'test-token', tenantId: 'tenant-abc' }`.

`TURN_CREDIT_COST` is set via `process.env` in test setup. Audit logger is monkeypatched to capture log calls.

**PCI/sensitivity:** None.

**Test data gaps:** None.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | balance=0 → 402, Anthropic adapter NOT called | Unit | T1.1, T1.2, T1.3 | None |
| AC2 | balance<0 → 402, Anthropic adapter NOT called | Unit | T2.1 | None |
| AC3 | balance>0 → `adjustBalance(-1)` called, Anthropic proceeds | Unit | T3.1, T3.2 | None |
| AC4 | `TURN_CREDIT_COST` env var configures per-turn cost | Unit | T4.1, T4.2 | None |
| AC5 | Enforcement fires before turn processing | Unit | T5.1 | None |
| AC6 | `credits_balance_check` audit-logged on every 402 | Unit | T6.1 | None |
| AC7 | Test explicitly asserts Anthropic adapter invocation count = 0 | Unit | T7.1 | None |

---

## Gap table

No gaps — all ACs are unit testable with injectable adapters.

---

## E2E / browser-layout detection

No browser-layout-dependent ACs. No E2E tooling required.

---

## Unit tests

### T1 — balance=0 → 402 (AC1)

**T1.1** — `balance-zero-returns-402`
Covers: AC1 §3
Precondition: Credits mock adapter returns `{ balance: 0 }` for `'tenant-abc'`; Anthropic adapter spy initialised with invocation counter = 0
Action: Call turn handler (`POST /api/turn` or equivalent) with authenticated session
Expected: Response is 402
Edge case: none

**T1.2** — `balance-zero-response-body-contains-error-and-top-up-url`
Covers: AC1 §3 (response body)
Precondition: T1.1 setup
Action: Parse response body as JSON
Expected: `{ "error": "Insufficient credits", "topUpUrl": "/settings/billing" }` — exact field names and values
Edge case: Body must be valid JSON; Content-Type must be `application/json`

**T1.3** — `balance-zero-anthropic-adapter-not-called`
Covers: AC1 §2, AC7
Precondition: T1.1 setup; Anthropic adapter spy
Action: Call turn handler; inspect spy invocation count
Expected: Anthropic adapter invocation count is exactly 0 after the handler returns 402
Edge case: This is the D7 assertion — explicit invocation count, not just "no error thrown"

### T2 — balance<0 → 402 (AC2)

**T2.1** — `negative-balance-returns-402-no-anthropic-call`
Covers: AC2
Precondition: Credits mock returns `{ balance: -10 }`; Anthropic spy
Action: Call turn handler
Expected: Response is 402 (identical to AC1); Anthropic adapter invocation count is 0
Edge case: A balance of exactly 0 vs exactly -10 must produce identical behaviour — this test confirms there is no "balance is -10 but we let it through" edge case

### T3 — balance>0 → proceed (AC3)

**T3.1** — `positive-balance-calls-adjust-balance`
Covers: AC3 §1
Precondition: Credits mock returns `{ balance: 50 }`; `adjustBalance` captured; `TURN_CREDIT_COST=1`
Action: Call turn handler
Expected: `adjustBalance('tenant-abc', -1)` was called (decrement by 1)
Edge case: Balance is decremented BEFORE or CONCURRENTLY with the Anthropic call — not after. The atomic DB update handles this.

**T3.2** — `positive-balance-anthropic-adapter-called`
Covers: AC3 §2
Precondition: T3.1 setup; Anthropic adapter spy
Action: Call turn handler
Expected: Anthropic adapter invocation count is 1; response is the normal turn response (not 402)
Edge case: none

### T4 — TURN_CREDIT_COST configurable (AC4)

**T4.1** — `turn-credit-cost-env-configures-deduct-amount`
Covers: AC4 §1
Precondition: `process.env.TURN_CREDIT_COST = '2'`; credits mock returns `{ balance: 50 }`
Action: Call turn handler
Expected: `adjustBalance('tenant-abc', -2)` called (not -1)
Edge case: none

**T4.2** — `turn-credit-cost-defaults-to-1-when-unset`
Covers: AC4 §2
Precondition: `delete process.env.TURN_CREDIT_COST`; credits mock returns `{ balance: 50 }`
Action: Call turn handler
Expected: `adjustBalance('tenant-abc', -1)` called
Edge case: none

### T5 — Enforcement fires before turn processing (AC5)

**T5.1** — `credits-check-is-first-operation-after-auth`
Covers: AC5
Precondition: Credits mock returns `{ balance: 0 }`; a mock "journey state" adapter that tracks if it was called; Anthropic adapter spy
Action: Call turn handler
Expected: Neither the journey state adapter NOR the Anthropic adapter is called before the 402 is returned; the credits check is the first logged operation
Edge case: If any side effect (journey state creation, input validation etc.) occurs before the credits check, AC5 fails

### T6 — Audit log on 402 (AC6)

**T6.1** — `credits-balance-check-audit-logged-on-402`
Covers: AC6
Precondition: Audit logger monkeypatched; credits mock returns `{ balance: 0 }`
Action: Call turn handler; inspect captured log calls
Expected: At least one log entry with key/event `credits_balance_check` and fields `{ tenantId: 'tenant-abc', balance: 0, result: 'blocked' }`; no `accessToken` field in the log entry
Edge case: none

### T7 — Explicit invocation count assertion in test (AC7)

**T7.1** — `test-suite-explicitly-asserts-anthropic-call-count-zero`
Covers: AC7
Precondition: This is a meta-test — the test verifies that T1.3 and T2.1 each contain an explicit `assert(anthropicSpy.callCount === 0, ...)` line
Action: Read the test file source or observe T1.3 and T2.1 pass (they contain the assertion)
Expected: The invocation count assertion is present and passes — "no error thrown" alone is insufficient; the count must be explicitly checked
Edge case: A test that only checks the response code (not the adapter call count) is insufficient for AC7

---

## Integration tests

**IT1** — `credits-guard-mounted-on-turn-route`
Covers: AC5 (integration — middleware ordering)
Precondition: Server or route module loaded with `credits-guard` middleware applied
Action: Send a turn request with no credits (balance=0) to the actual route
Expected: 402 returned before any business logic executes; no journey state created
Edge case: Middleware order matters — credits guard must appear BEFORE the turn handler in the route chain

---

## NFR tests

**NFR1** — `access-token-not-in-402-body-or-logs`
Covers: NFR — no `accessToken` in 402 body or logs
Precondition: Audit logger captured; 402 scenario
Action: Inspect 402 response body and all captured log entries
Expected: Neither the response body nor any log entry contains `req.session.accessToken` value or the word `accessToken`
Edge case: The `tenantId` is allowed in the 402 body as `topUpUrl` contains no token; the 402 body must only have `error` and `topUpUrl` fields

---

## State update fields

- `totalTests`: 9
- `acTotal`: 7
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false
