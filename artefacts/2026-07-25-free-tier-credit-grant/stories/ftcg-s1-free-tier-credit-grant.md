## Story: Grant every brand-new tenant a free-tier credit balance at signup

**Short-track:** bug fix -- a business-critical gap found via capture-log review (originally flagged 2026-07-23, never fixed).

## User Story

As **a brand-new user signing up for the product**,
I want **to receive a small free credit balance the moment my account is created**,
So that **I can actually try the product (run a few real skill turns) before being asked to pay, instead of hitting "Insufficient credits" on my very first action**.

## Background / Investigation

`creditsGuard` (`src/web-ui/middleware/credits-guard.js`) blocks any turn with HTTP 402 whenever `getBalance(tenantId) <= 0`. `getBalance` (`src/web-ui/modules/credits.js`) returns `0` for any tenant with no row in the `credits` table -- which is every tenant today, immediately after signup, regardless of auth method (GitHub OAuth, Google OAuth, or email/password). Confirmed via a full-repo grep: zero references to any credit-granting logic exist anywhere in `auth.js` or `auth-email.js`. This was first found and flagged 2026-07-23 during the E2E-coverage feature's own live-staging verification (capture-log: "no free-tier credit grant exists anywhere in the signup path... every real skill turn is blocked with HTTP 402 until a real Stripe checkout completes or an admin manually adjusts credits") and re-confirmed tonight (2026-07-25) via tonight's own dss-s1 live verification, which hit the identical `credits_balance_check ... result: 'blocked'` log line for fresh E2E test tenants.

**Business impact:** every single organic signup today -- via any of the 3 supported auth methods -- is blocked from using any part of the product on their first action, unless an admin manually runs a credit top-up first. There is no self-serve trial path at all.

## Architecture Constraints

- **Atomic, race-free grant -- no check-then-write.** Add a new `grantFreeTierIfNew(tenantId, amount)` function to `credits.js` using `INSERT INTO credits (tenant_id, balance) VALUES ($1, $2) ON CONFLICT (tenant_id) DO NOTHING RETURNING balance` -- the `ON CONFLICT DO NOTHING` makes this safe to call on every login (not just a detected "first" login) without double-granting or racing a concurrent request. Returns whether a grant was actually applied (a new row was inserted), for logging/audit purposes only -- the caller must never branch signup behaviour on this value.
- **Call it identically across all 3 signup/login paths** (`handleAuthCallback` for GitHub, `handleAuthGoogleCallback` for Google, `handleEmailSignup` for email/password) rather than relying on each path's own, inconsistent first-login detection. GitHub has `isFirstLogin`/`_userFlags` (a GitHub-specific `github_first_login` table); Google has no first-login detection at all today; email/password's signup handler is inherently one-time (a fresh `INSERT INTO users`). Using the atomic upsert removes the need to unify these three different mechanisms just to grant credits correctly.
- **The grant amount is a configurable env var** (`CREDITS_FREE_TIER_GRANT`, default `10`), matching the existing `TURN_CREDIT_COST` and `CREDITS_PLAN_<PLAN>` env-var-driven convention in this same codebase -- never hardcoded.
- **Admin users are unaffected.** `creditsGuard` already bypasses the balance check entirely for admins (`isEffectivelyAdmin`) -- granting free-tier credits to an admin tenant is harmless (never read) but the grant call itself is unconditional and simple; no special-casing needed.
- **Do not touch the existing GitHub-specific `isFirstLogin`/`/welcome` plan-selection flow.** That mechanism still runs exactly as today; the credit grant is a separate, additive call alongside it, not a replacement.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant with no existing `credits` row, When `grantFreeTierIfNew(tenantId, amount)` is called, Then a new row is inserted with `balance = amount`, and the function returns `true`.

**AC2:** Given a tenant that already has a `credits` row (any balance, including 0), When `grantFreeTierIfNew(tenantId, amount)` is called again, Then the existing balance is completely unchanged (never re-added, never reset), and the function returns `false`.

**AC3:** Given two concurrent calls to `grantFreeTierIfNew` for the same brand-new tenant (simulating a race between overlapping requests), When both execute, Then the tenant ends up with exactly one grant applied (`balance = amount`, not `2 * amount`) -- proven via the same atomic `ON CONFLICT DO NOTHING` semantics already used elsewhere in this file, not a new pattern.

**AC4:** Given a brand-new GitHub OAuth signup (`handleAuthCallback`), When the callback completes successfully, Then the resulting tenant has a `credits` balance of `CREDITS_FREE_TIER_GRANT` (default 10).

**AC5:** Given a brand-new Google OAuth signup (`handleAuthGoogleCallback`), When the callback completes successfully, Then the resulting tenant has a `credits` balance of `CREDITS_FREE_TIER_GRANT` (default 10) -- this auth path has no existing first-login detection at all, so this AC is this story's only mechanism for granting Google signups anything.

**AC6:** Given a brand-new email/password signup (`handleEmailSignup`), When the signup completes successfully, Then the resulting tenant has a `credits` balance of `CREDITS_FREE_TIER_GRANT` (default 10).

**AC7:** Given a RETURNING user via any of the 3 auth methods (not a new signup), When they log in again, Then their existing balance is unchanged by the grant call (re-confirms AC2 at the integration level, once per auth method).

**AC8:** Given the credits adapter is not wired (`DATABASE_URL` unset, matching the existing D37 stub-throws convention), When any signup path calls `grantFreeTierIfNew`, Then the signup itself does not fail -- the grant call is wrapped in a try/catch that logs and swallows the error, matching the existing fire-and-forget pattern already used for non-critical post-signup side effects in this codebase (e.g. `clearFirstLoginFlag(...).catch(...)`), since a missing credits grant must never block account creation itself.

## Out of Scope

- Any change to the existing GitHub-specific `isFirstLogin`/`github_first_login` table or `/welcome` plan-selection redirect flow.
- Adding first-login detection to the Google OAuth path (out of scope -- the atomic upsert grant works without it).
- Any change to paid-plan credit grants (`CREDITS_PLAN_<PLAN>`, Stripe webhook handling) -- those already work correctly (fixed by `cuf-s1`).
- Time-limiting or expiring the free-tier grant -- a flat, one-time balance only.

## NFRs

- **Data integrity:** The grant must be exactly-once per tenant regardless of concurrent requests or repeated logins (AC2, AC3) -- enforced at the database level (`ON CONFLICT`), not application-level locking.
- **Reliability:** A failure to grant credits (e.g. DB adapter not wired, transient DB error) must never block or fail the signup itself (AC8).
- **Observability:** Log when a grant is actually applied (not on every no-op call), so a real free-tier grant is auditable alongside the existing `login`/`credits_balance_check` log lines.

## Complexity Rating

**Rating:** 2 -- one new atomic DB function plus three call sites, each in an already-well-understood auth handler; the main risk is race-condition correctness (AC3), which the existing `ON CONFLICT` pattern in this same file already proves safe.
**Scope stability:** Stable.
