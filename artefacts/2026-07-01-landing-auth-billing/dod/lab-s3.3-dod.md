# Definition of Done: lab-s3.3 — Credit enforcement — 402 turn guard

**PR:** https://github.com/heymishy/skills-repo/pull/427 | **Merged:** 2026-07-02
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s3.3-credit-enforcement.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s3.3-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s3.3-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Turn attempt with balance = 0 returns 402 `{ "error": "Insufficient credits", "topUpUrl": "/settings/billing" }`, Anthropic API not called | ✅ | Test mocks both credits adapter (returns 0) and Anthropic adapter (tracks call count). Asserts 402 JSON response and Anthropic call count = 0. 36/36 pass. | Automated test | None |
| AC2 — Turn attempt with balance < 0 returns 402, Anthropic API not called | ✅ | Test sets mock balance = -10. Same assertions as AC1. | Automated test | None |
| AC3 — Turn attempt with balance > 0: `adjustBalance(tenantId, -1)` called, Anthropic API called, normal response | ✅ | Test sets balance = 50. Asserts `adjustBalance` called with `-1` (or configured cost), Anthropic adapter called, response passes through. | Automated test | None |
| AC4 — Per-turn credit cost configurable via `TURN_CREDIT_COST` env var; default = 1 | ✅ | Test sets `TURN_CREDIT_COST=2` and asserts `adjustBalance(tenantId, -2)` called. Default test asserts `adjustBalance(tenantId, -1)` when unset. | Automated test | None |
| AC5 — Enforcement fires before turn processing: no partial processing on 402 | ✅ | Test order verified: balance check is first assertion in guard; Anthropic adapter mock is never invoked (call count = 0). | Automated test (AC1/AC7 combined) | None |
| AC6 — `credits_balance_check` audit-logged on every 402 with `{ tenantId, balance, result: 'blocked' }` | ✅ | Test asserts log event emitted with correct fields. No personal data beyond tenantId in payload. | Automated test | None |
| AC7 — Automated test explicitly asserts Anthropic adapter NOT called on 402 | ✅ | Test for AC1 and AC2 both assert Anthropic mock call count = 0 after 402 is returned. | Automated test | None |

## Scope Deviations

None. No grace period implemented (explicitly out of scope), no per-model rates, no top-up UI. `topUpUrl: "/settings/billing"` present in 402 body as a string reference only (route delivered by s3.5).

---

## Test Plan Coverage

**Tests from plan implemented:** 36 / 36
**Tests passing:** 36 / 36

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: one Postgres query per turn (no caching in MVP) | ✅ | Credits guard makes a single `getBalance` call per turn. Neon connection pooling available if needed. Intentional MVP behaviour. |
| No `accessToken` in 402 body or logs | ✅ | Test asserts 402 body contains only `{ error, topUpUrl }`. Audit log event asserts no `accessToken` field. Test for this NFR passes (final test in suite). |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M2 — Credits enforcement (100% 402 on zero balance; zero turns processed when balance ≤ 0) | on-track | Minimum validation signal met: automated test suite asserts 402 on every turn attempt with balance = 0 and no Anthropic API call made (AC1, AC7). 36/36 tests green. CI passes. Production query ("tenants with balance ≤ 0 who have turns logged after" — expected: zero rows) cannot run until platform is live. | 2026-07-03 |

---

## Outcome: COMPLETE ✅

ACs satisfied: 7/7
Scope deviations: None
Test gaps: None
