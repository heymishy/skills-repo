# Client-org dual-path authentication — Implementation Plan

**Goal:** Make every test in `test-plans/story-4-dual-path-authentication-test-plan.md` pass (17 tests across 5 ACs) without adding scope beyond the ACs.
**Branch:** `feature/story-4-dual-path-authentication`
**Worktree:** `.claude/worktrees/story-4-dual-path-authentication`
**Test command:** `node scripts/run-all-tests.js` (full suite); `node tests/check-story4-dual-path-authentication.js` (this story's file directly); `node tests/check-story3-self-service-provisioning.js` (must still pass 18/18 unmodified)

**Baseline (pre-code):** 453 files run, 38 failed (2026-08-01, this session, before any story-4 changes) — matches the DoR-expected ~38-failure baseline. `check-story3-self-service-provisioning.js` independently confirmed 18/18 passing before any story-4 changes.

---

## Key design decision: extending, not duplicating, Story 3's shared strategy

`auth/magic-link-strategy.js` (Story 3) registers exactly ONE `passport-magic-login` `MagicLoginStrategy` instance with a single, construction-time-fixed `callbackUrl: '/invite/redeem'` and a mutable `_verifyCallback` variable exposed via `setVerifyCallback(fn)`. Reading `node_modules/passport-magic-login/src/index.ts` confirms:
- `send(req, res)` builds the JWT payload as `{...req.body, code}` and calls `sendMagicLink(destination, href, code, req)` — the `href` always points at the ONE fixed `callbackUrl`. Both Story 3's invitation links and Story 4's login links will therefore redirect to the same `/invite/redeem` URL — this is a consequence of "one shared strategy instance," not a mistake. The EXISTING `handleGetInviteRedeem` route (routes/agency-provisioning.js) is already generic over the verify() result shape (`{personId, tenantId, email, role}`) and needs NO changes.
- `authenticate()` (redemption) calls `self._options.verify(payload, callback, req)`, which Story 3 wraps as a fixed indirection to whatever `_verifyCallback` currently is.

Story 4 therefore:
1. Adds a NEW combined verify() dispatcher in `server.js`, wired via `setVerifyCallback()` (never `registerMagicLinkStrategy()` again) — routes by payload shape: `payload.invitationId` present → delegate to Story 3's existing `_verifyInvitationRedemption`; absent → delegate to Story 4's own `resolveLoginToken` (via a new `modules/client-login.js`).
2. Reuses the EXISTING `sendMagicLink` wiring (→ `invitation-email.js`'s `sendInvitationEmail` → Resend) for login links too — AC5's "email-send callback" wiring is the SAME already-D37-wired adapter Story 3 built; Story 4 does not introduce a second send adapter.
3. Adds its OWN single-use + TTL enforcement at the application layer (`client_login_tokens` table, mirroring `client-invitations.js`'s exact atomic `UPDATE ... WHERE redeemed_at IS NULL RETURNING` convention) since passport-magic-login's JWT is otherwise stateless and Story 3's shared `jwtOptions.expiresIn` (60 min) is a strategy-level, single fixed value not overridable per-issuance — a stricter, NFR-mandated 15-30 minute window is enforced independently in `modules/client-login.js`, not by touching the shared `jwtOptions`.

---

## File map

```
Create:
  src/web-ui/modules/client-login.js         — client_login_tokens table; _resolveClientMembership
                                                (shared AC3 org_type gate); requestMagicLinkLogin (AC2/AC3);
                                                resolveLoginToken (AC2/AC4, single-use + TTL + email-binding)
  src/web-ui/routes/client-login.js          — createClientLoginHandlers(pool) factory: magic-link request
                                                form (GET) + request handler (POST, AC2/AC3), rate-limited (NFR)
  tests/check-story4-dual-path-authentication.js — 17 tests per test plan

Modify:
  src/web-ui/routes/auth-email.js  — extract the existing IP-only sliding-window rate limiter into a reusable,
                                      exported `checkSlidingWindowRateLimit(store, key, max, windowMs)` primitive
                                      (pure refactor -- `_checkRateLimit`'s own behaviour/threshold unchanged) so
                                      routes/client-login.js can reuse the SAME mechanism/threshold for its own
                                      per-IP AND per-target-email checks (NFR, resolves review run 1's [1-M1]),
                                      not a new bespoke limiter.
  src/web-ui/server.js — require modules/client-login.js + routes/client-login.js; wire the combined verify()
                          dispatcher via setVerifyCallback() (after Story 3's registerMagicLinkStrategy() call,
                          same .then() block for ordering); mount 2 new routes (GET /auth/magic-link,
                          POST /auth/magic-link/request)
```

---

## Task 1: `client_login_tokens` data model + AC3 org_type gate + AC4 single-use/TTL/binding

**Files:**
- Create: `src/web-ui/modules/client-login.js`
- Test: `tests/check-story4-dual-path-authentication.js` (unit section)

Functions: `migrateClientLoginTokensSchema(pool)`; `_resolveClientMembership(pool, email)` (person_identities → team_memberships JOIN organisations, filtered to `org_type='client'` — the ONE shared lookup used at BOTH request-time gate and redemption-time re-verification, per this epic's established "one dedicated module for org-type/relationship checks" precedent, `agency-client-grants.js`'s `getRelationshipForAgencyAndClient`); `isClientOrgEligible(pool, email)`; `requestMagicLinkLogin(pool, email, logger)` (AC3 gate + issues a `client_login_tokens` row); `resolveLoginToken(pool, payload, logger)` (AC4: email-binding check, TTL check via injectable `_now()`/`_setNowForTesting()` clock, atomic single-use `UPDATE ... WHERE redeemed_at IS NULL RETURNING`, then re-verifies AC3 membership before returning the session-shaped user).

No D37 adapter here (H-ADAPTER: internal DB access via explicit `pool` argument, same reasoning as `modules/client-invitations.js`).

## Task 2: Reusable rate-limiter extraction (NFR, resolves [1-M1])

**Files:**
- Modify: `src/web-ui/routes/auth-email.js`

Extract `_checkRateLimit`'s sliding-window Map logic into an exported `checkSlidingWindowRateLimit(store, key, max, windowMs)` pure function; `_checkRateLimit` calls it with the existing `_rateLimits` map/IP/RATE_MAX/RATE_WIN_MS — zero behaviour change for the existing signup/login callers. Export `RATE_MAX`/`RATE_WIN_MS` alongside it.

## Task 3: Magic-link request route (AC2, AC3, rate-limiting NFR, accessibility NFR)

**Files:**
- Create: `src/web-ui/routes/client-login.js` (factory `createClientLoginHandlers(pool)`, mirrors `agency-provisioning.js`'s factory convention)

`handleGetMagicLinkRequestForm`: real `<form>`/`<input type="email">` (NFR-accessibility). `handlePostMagicLinkRequest`: per-IP AND per-target-email rate limiting via `auth-email.js`'s `checkSlidingWindowRateLimit` (two independent Maps/windows, same threshold); AC3 gate via `client-login.js`'s `requestMagicLinkLogin`; issues the magic link via the EXISTING shared `magic-link-strategy.js`'s `issueMagicLink(email, {loginTokenId})` (never `registerMagicLinkStrategy()` again); explicit `sent.success` check (mirrors `agency-provisioning.js`'s own handling of passport-magic-login's swallowed adapter-failure shape).

## Task 4: Combined verify() dispatcher + server.js wiring (separate task per D37 rule)

**Files:**
- Modify: `src/web-ui/server.js`

Migrate `client_login_tokens` schema; construct `createClientLoginHandlers(_userRolesPool)`; define `_verifyClientLogin(payload, callback)` (delegates to `clientLogin.resolveLoginToken`); define `_combinedMagicLinkVerify(payload, callback, req)` (dispatches on `payload.invitationId` presence); call `magicLinkStrategy.setVerifyCallback(_combinedMagicLinkVerify)` — placed inside the SAME `.then()` callback as Story 3's `registerMagicLinkStrategy()` call, immediately after it, guaranteeing the strategy is already registered (`setVerifyCallback` throws otherwise). Mount 2 new routes:
- `GET /auth/magic-link` (unauthenticated, public — request form)
- `POST /auth/magic-link/request` (unauthenticated, public — issues the link)

AC1: NO changes to `routes/auth.js` or the OAuth mechanism — non-regression test only.

## Task 5: Test file — 17 tests across 5 ACs + 4 NFR tests

**Files:**
- Create: `tests/check-story4-dual-path-authentication.js`

Follows `tests/check-story3-self-service-provisioning.js`'s hand-rolled `test()`/fake-pool/`freshRequire`/`mockRes()` harness convention exactly, extended with a `team_memberships JOIN organisations` fake-pool query branch for `_resolveClientMembership`, and `tests/check-story1-organisation-entity.js`'s `mockAuthReq`/`mockAuthRes`/GitHub-fixture convention for AC1's non-regression test.

## Task 6: Full suite verification

Run `node scripts/run-all-tests.js`; confirm 453+1 files run (454), 38 failed (no new failures beyond baseline) plus the new file passing 100%. Independently re-run `node tests/check-story3-self-service-provisioning.js` standalone; confirm 18/18 unmodified.
