# Self-service Agency-to-Client provisioning — Implementation Plan

**Goal:** Make every test in `test-plans/story-3-self-service-provisioning-test-plan.md` pass (16 tests across 5 ACs) without adding scope beyond the ACs.
**Branch:** `feature/story-3-self-service-provisioning`
**Worktree:** current session worktree
**Test command:** `node scripts/run-all-tests.js` (full suite); `node tests/check-story3-self-service-provisioning.js` (this story's file directly)

**Baseline (pre-code):** 451 files run, 38 failed (2026-07-31, this session, before any story-3 changes) — matches the DoR-expected ~38-failure baseline with Stories 1/2's own tests passing on top.

---

## File map

```
Create:
  src/web-ui/modules/client-invitations.js   — client_invitations table, createInvitation/getInvitationById/
                                                markInvitationRedeemed, createClientOrgUserAndAdminMembership
  src/web-ui/modules/invitation-email.js     — D37 adapter: sendInvitationEmail/setSendInvitationEmail (AC5)
  src/web-ui/auth/magic-link-strategy.js     — ONE shared Passport.js + passport-magic-login strategy
                                                registration point (Story 3 + Story 4 share this file)
  src/web-ui/routes/agency-provisioning.js   — createAgencyProvisioningHandlers(pool) factory: Create-Client
                                                form/submit (AC1/AC2/AC4), Invite-User form/submit (AC3/AC5),
                                                Invitation-redeem GET handler (AC3)
  tests/check-story3-self-service-provisioning.js — 16 tests per test plan

Modify:
  package.json    — add passport, passport-magic-login, resend as real dependencies (ARCH decision, decisions.md 2026-07-31)
  src/web-ui/server.js — wire pool into agency-provisioning handlers, register the magic-link strategy,
                          wire sendInvitationEmail to the real Resend SDK, mount 5 new routes
```

---

## Task 1: `client_invitations` data model + first-user account/membership creation

**Files:**
- Create: `src/web-ui/modules/client-invitations.js`
- Test: `tests/check-story3-self-service-provisioning.js` (unit section)

Functions: `migrateClientInvitationsSchema(pool)`, `createInvitation(pool, clientOrgId, email, invitedByOrgId, logger)`, `getInvitationById(pool, invitationId)`, `markInvitationRedeemed(pool, invitationId, logger)` (atomic `WHERE redeemed_at IS NULL`, mirrors `agency-client-grants.js`'s `revokeGrant`), `createClientOrgUserAndAdminMembership(pool, clientOrgId, email, logger)` (creates a `people` row + `person_identities` link if none exists, then inserts `team_memberships(person_id, tenant_id, role='admin')` using the exact insert statement shape from `team-management.js`'s `addOrUpdateTeammate` — NOT that function itself, since it throws `UnknownIdentityError` for an identity with no existing person, a precondition that does not hold for a brand-new invitee. Documented as a decision in `decisions.md`).

No D37 adapter here (H-ADAPTER: internal DB access via explicit `pool` argument, same reasoning as `modules/organisations.js` / `modules/agency-client-grants.js`).

## Task 2: `sendInvitationEmail` D37 adapter (AC5)

**Files:**
- Create: `src/web-ui/modules/invitation-email.js`

Stub throws `'Adapter not wired: sendInvitationEmail. Call setSendInvitationEmail() with a real implementation before use.'`. `setSendInvitationEmail(fn)` setter. Never logs the link/token itself.

## Task 3: Shared Passport.js + passport-magic-login strategy registration

**Files:**
- Create: `src/web-ui/auth/magic-link-strategy.js`

`registerMagicLinkStrategy({secret, callbackUrl, sendMagicLink, verify})` — constructs ONE real `passport-magic-login` `MagicLoginStrategy` instance and calls `passport.use('magiclogin', strategy)`. `setVerifyCallback(fn)` — Story 4's extension point (reuses the same registered instance, never re-registers). `issueMagicLink(destination, extra)` — calls the real strategy's own `.send()` via a minimal req/res shim (Express-shaped, matching the npm package's actual signature; verified by reading `node_modules/passport-magic-login/src/index.ts`). `verifyMagicLinkToken(token, req)` — invokes the real strategy's `.authenticate()` JWT-decode + registered `verify()` callback by binding a minimal `{fail, success, error}` context object, since this app has no Express/Passport middleware pipeline (raw `http.createServer`, per `web-ui-patterns.md`'s "no Express" stack constraint) — this is the same underlying JWT-sign/verify code path the real npm package ships, just invoked directly rather than through `passport.authenticate()` Express middleware.

## Task 4: Create-Client route (AC1, AC2, AC4)

**Files:**
- Create: `src/web-ui/routes/agency-provisioning.js` (factory `createAgencyProvisioningHandlers(pool)`, mirrors `team-management.js`'s factory convention)

`handleGetCreateClient` / `handlePostCreateClient`: server-side `org_type === 'agency'` check (never client-side only, AC2/NFR-security) via `organisations.resolveOrganisationForTenant`; blank/invalid name validation matching `handlePostProductNew`'s convention (AC4); on success, `organisations` row (`org_type='client'`) + `agency_client_relationships` row via Story 2's `createRelationship` (AC1).

## Task 5: Invite-User route + invitation redemption (AC3, AC5)

**Files:**
- Modify: `src/web-ui/routes/agency-provisioning.js`

`handlePostInviteUser`: creates the `client_invitations` row, issues the magic link via `magic-link-strategy.issueMagicLink`, sends it via `modules/invitation-email.js`'s `sendInvitationEmail` (through the strategy's `sendMagicLink` wiring). `handleGetInviteRedeem`: verifies the token, resolves the invitation + creates the account/membership (inside the registered `verify()` callback, wired in server.js so it closes over `pool`), then sets `req.session.*` fields and rotates the session ID exactly like `routes/auth.js`/`routes/auth-email.js` do.

## Task 6: server.js wiring (separate task per D37 rule)

**Files:**
- Modify: `src/web-ui/server.js`

Migrate `client_invitations` schema; construct `createAgencyProvisioningHandlers(_userRolesPool)`; `registerMagicLinkStrategy({...})` with `verify` closing over the pool; `setSendInvitationEmail(...)` wired to the real `resend` SDK (guarded by `RESEND_API_KEY` presence, matching this codebase's "never blocks the caller's flow" convention for optional external services); mount 5 new routes in the dispatch table:
- `GET /agency/clients/new`
- `POST /agency/clients/new`
- `GET /agency/clients/:id/invite`
- `POST /agency/clients/:id/invite`
- `GET /invite/redeem`

## Task 7: Test file — 16 tests across 5 ACs + 4 NFR tests

**Files:**
- Create: `tests/check-story3-self-service-provisioning.js`

Follows `tests/check-story2-relationship-grants-enforcement.js`'s hand-rolled `test()`/fake-pool harness convention exactly (`freshRequire`, in-memory fake pool with narrow explicit query branches, `mockRes()`).

## Task 8: Full suite verification

Run `node scripts/run-all-tests.js`; confirm 451+1 files run (452), 38 failed (no new failures beyond baseline) plus the new file passing 100%.
