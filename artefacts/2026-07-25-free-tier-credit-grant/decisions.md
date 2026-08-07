# Decisions: Free-Tier Credit Grant

## RESOLVED — free-tier grant amount is 10 credits (2026-07-25)

**Context:** No free-tier credit grant existed anywhere in the signup path (found 2026-07-23, re-confirmed 2026-07-25) -- every brand-new signup got 0 credits and was blocked with HTTP 402 on their very first action. `TURN_CREDIT_COST` defaults to 1 credit/turn; paid plans (`CREDITS_PLAN_<PLAN>`) default to 100 credits/cycle in the code's own fallback.
**Decision:** 10 credits, configurable via a new `CREDITS_FREE_TIER_GRANT` env var (matching the existing `TURN_CREDIT_COST`/`CREDITS_PLAN_<PLAN>` convention).
**Rationale:** Roughly a 10% taste of a full paid cycle -- enough to genuinely try the product across a few real turns without giving away meaningful paid-plan value. Operator confirmed via explicit question (options were 5 / 10 / 20).
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.

## RESOLVED — atomic `INSERT ... ON CONFLICT DO NOTHING`, not first-login detection (2026-07-25)

**Context:** GitHub OAuth already has its own first-login detection (`isFirstLogin`/`_userFlags`, backed by a GitHub-specific `github_first_login` table). Google OAuth has no first-login detection at all. Email/password signup is inherently one-time (a fresh `INSERT INTO users`, duplicate emails rejected earlier in the handler).
**Decision:** Rather than building or reusing three different "is this genuinely new" mechanisms, `credits.js` gets one new atomic function, `grantFreeTierIfNew(tenantId, amount)`, using `INSERT INTO credits ... ON CONFLICT (tenant_id) DO NOTHING RETURNING balance`. Called unconditionally on every login/signup across all 3 auth paths -- safe because the grant only ever actually applies once per tenant, enforced at the database level, not application logic.
**Rationale:** This is simpler and more robust than unifying three different "first login" signals, and it is the exact same defensive pattern already established in this file (`adjustBalance`'s own `ON CONFLICT DO UPDATE` upsert, from `cuf-s1`) -- just with `DO NOTHING` instead of `DO UPDATE`, since re-granting an existing tenant (including one who has spent their free credits down to exactly 0) must never happen, unlike a turn deduction or paid top-up which legitimately adds to an existing balance every time.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.
