'use strict';

// client-login.js -- story-4-dual-path-authentication
// (artefacts/2026-07-30-agency-client-organisations)
//
// Domain logic for the Client-org ONGOING magic-link LOGIN path (AC2/AC3/AC4),
// distinct from Story 3's modules/client-invitations.js (first-user invitation
// issuance/redemption) but sharing the SAME Passport.js + passport-magic-login
// strategy instance (see auth/magic-link-strategy.js's module header). server.js's
// combined verify() dispatcher routes to THIS module's resolveLoginToken() when
// the redeemed JWT payload carries no invitationId, and to
// modules/client-invitations.js's redeemInvitation() when it does -- see
// server.js's story-4-dual-path-authentication wiring block.
//
// AC4 (single-use, time-limited): passport-magic-login's JWT is otherwise
// stateless -- this module tracks its OWN persisted single-use record
// (client_login_tokens), mirroring modules/client-invitations.js's exact
// `UPDATE ... WHERE redeemed_at IS NULL RETURNING *` atomic single-use
// convention, so a second, concurrent redemption attempt for the same login
// link can never both succeed. TTL is enforced at the application layer
// (created_at vs an injectable clock -- see _now()/_setNowForTesting(), the
// NFR test-plan's own "clock injection" tool) independently of the shared
// strategy's fixed 60-minute jwtOptions.expiresIn (which stays as-is for
// Story 3's invitation flow -- see decisions.md's "Revisit trigger" note on
// the shared jwtOptions, and this story's own implementation plan). This lets
// the login path apply its own, stricter NFR-mandated 15-30 minute window
// without touching the strategy's shared construction-time config.
//
// AC3 (org_type scoping): the SAME _resolveClientMembership() lookup gates
// BOTH request-time issuance (requestMagicLinkLogin) and redemption-time
// resolution (resolveLoginToken) -- re-checked at both ends so a Client-org
// membership revoked between request and redemption is caught too. This is
// the one dedicated lookup for "is this email a Client-org member," matching
// this epic's established precedent of routing org-relationship checks
// through a single module function rather than scattering ad hoc queries
// (modules/agency-client-grants.js's getRelationshipForAgencyAndClient).
//
// No D37 injectable adapter here (DoR H-ADAPTER: table lookups use the
// existing DB pool directly, not a swappable external integration) -- every
// function below takes `pool` as an explicit argument, mirroring
// modules/client-invitations.js's own precedent.

var crypto = require('crypto');
var identityLinks = require('./identity-links');

var _defaultLogger = { info: function(msg) { console.log(msg); } };

// NFR (Security): 15-30 minute window -- 20 minutes chosen as the midpoint.
var TTL_MS = 20 * 60 * 1000;

var _now = function() { return Date.now(); };

/** Test-only clock override (NFR test-plan tool: "clock injection"). */
function _setNowForTesting(fn) { _now = fn; }

/** Test-only clock reset. */
function _resetNowForTesting() { _now = function() { return Date.now(); }; }

function _genTokenId() {
  return 'lgtok-' + Date.now().toString(36) + '-' + crypto.randomBytes(8).toString('hex');
}

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching this codebase's existing CREATE TABLE IF NOT EXISTS
 * migration convention (see modules/client-invitations.js's
 * migrateClientInvitationsSchema).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateClientLoginTokensSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_login_tokens (
      token_id    VARCHAR     PRIMARY KEY,
      email       VARCHAR     NOT NULL,
      tenant_id   VARCHAR     NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      redeemed_at TIMESTAMPTZ
    )
  `);
}

/**
 * Resolve the Client-org team_membership (if any) for an email address --
 * AC3's single source of truth, used at BOTH request-time (gate) and
 * redemption-time (re-verify). Returns null if the email has no CLIENT-type
 * org membership -- this uniformly covers: unknown email, an agency-type
 * org, a standalone-type org, or no membership at all (AC3 rejects all of
 * these the same way).
 * @param {object} pool
 * @param {string} email
 * @returns {Promise<{personId:number, tenantId:string, role:string}|null>}
 */
async function _resolveClientMembership(pool, email) {
  var personId = await identityLinks.resolvePersonForIdentity(pool, email);
  if (personId == null) return null;

  var result = await pool.query(
    'SELECT tm.tenant_id, tm.role FROM team_memberships tm ' +
    'JOIN organisations o ON o.org_id = tm.tenant_id ' +
    "WHERE tm.person_id = $1 AND o.org_type = 'client' LIMIT 1",
    [personId]
  );
  if (!result.rows.length) return null;
  return { personId: personId, tenantId: result.rows[0].tenant_id, role: result.rows[0].role };
}

/**
 * AC3: true only when `email` belongs to a Client-org (org_type='client')
 * team_membership -- exposed so callers can check eligibility without
 * issuing a token (e.g. a future UI hint), though the request route itself
 * uses requestMagicLinkLogin's own {ok:false} return directly.
 * @param {object} pool
 * @param {string} email
 * @returns {Promise<boolean>}
 */
async function isClientOrgEligible(pool, email) {
  return (await _resolveClientMembership(pool, email)) !== null;
}

/**
 * AC2/AC3: issue a login token record for an eligible Client-org email.
 * Returns {ok:false, reason} WITHOUT creating any row if the email is not a
 * Client-org member (AC3) -- the caller (routes/client-login.js) must not
 * proceed to magicLinkStrategy.issueMagicLink() in that case, so no token is
 * ever issued and no send-callback is ever invoked for a rejected org_type.
 * @param {object} pool
 * @param {string} email
 * @param {{info:Function}} [logger]
 * @returns {Promise<{ok:true, tokenId:string, tenantId:string}|{ok:false, reason:string}>}
 */
async function requestMagicLinkLogin(pool, email, logger) {
  var log = logger || _defaultLogger;
  var membership = await _resolveClientMembership(pool, email);
  if (!membership) {
    return { ok: false, reason: 'not eligible for magic-link login' };
  }

  var tokenId = _genTokenId();
  await pool.query(
    'INSERT INTO client_login_tokens (token_id, email, tenant_id) VALUES ($1, $2, $3)',
    [tokenId, email, membership.tenantId]
  );

  // Audit (NFR): email + tenant + timestamp -- never the raw token.
  log.info(JSON.stringify({
    event: 'magic_link_login_requested',
    email: email,
    tenant_id: membership.tenantId,
    timestamp: new Date(_now()).toISOString()
  }));

  return { ok: true, tokenId: tokenId, tenantId: membership.tenantId };
}

/**
 * AC2/AC4: resolve a redeemed login-token payload into a session-shaped user
 * object, or a rejection reason. Rejects (in order): a missing/unknown
 * tokenId, a payload whose destination doesn't match the token's own
 * recorded email (address-binding NFR), an expired token (AC4 edge case --
 * checked BEFORE the atomic redeem so an expired-but-never-used token is
 * distinguishable from an already-used one), an already-redeemed token (AC4
 * -- atomic, mirrors modules/client-invitations.js's markInvitationRedeemed),
 * or a membership that is no longer Client-type (AC3, re-checked here too).
 * @param {object} pool
 * @param {{destination:string, loginTokenId:string}} payload
 * @param {{info:Function}} [logger]
 * @returns {Promise<{ok:true, user:{personId:number,tenantId:string,email:string,role:string}}|{ok:false, reason:string}>}
 */
async function resolveLoginToken(pool, payload, logger) {
  var log = logger || _defaultLogger;
  var tokenId = payload && payload.loginTokenId;
  if (!tokenId) return { ok: false, reason: 'missing login token' };

  var lookup = await pool.query(
    'SELECT token_id, email, tenant_id, created_at, redeemed_at FROM client_login_tokens WHERE token_id = $1',
    [tokenId]
  );
  var row = lookup.rows.length ? lookup.rows[0] : null;
  if (!row) return { ok: false, reason: 'login link not found' };

  // Address-binding NFR: the redeemed payload's destination must be the
  // exact email this token was issued for.
  if (row.email !== (payload && payload.destination)) {
    return { ok: false, reason: 'email mismatch' };
  }

  // AC4 (time-limited): checked BEFORE the atomic redeem below so an
  // expired-but-never-used token is rejected distinctly from an
  // already-used one, per the test plan's edge case.
  var createdAtMs = new Date(row.created_at).getTime();
  if (_now() - createdAtMs > TTL_MS) {
    return { ok: false, reason: 'login link expired' };
  }

  // AC4 (single-use): atomic UPDATE ... WHERE redeemed_at IS NULL, mirroring
  // modules/client-invitations.js's markInvitationRedeemed exactly -- a
  // second, concurrent redemption attempt can never both succeed.
  var redeemed = await pool.query(
    'UPDATE client_login_tokens SET redeemed_at = NOW() ' +
    'WHERE token_id = $1 AND redeemed_at IS NULL ' +
    'RETURNING token_id, email, tenant_id, created_at, redeemed_at',
    [tokenId]
  );
  if (!redeemed.rows.length) {
    return { ok: false, reason: 'login link already used' };
  }

  // AC3 (re-verified at redemption time): membership must still be
  // Client-type -- defence in depth against a membership change between
  // request and redemption.
  var membership = await _resolveClientMembership(pool, row.email);
  if (!membership) {
    return { ok: false, reason: 'not eligible for magic-link login' };
  }

  log.info(JSON.stringify({
    event: 'magic_link_login_redeemed',
    email: row.email,
    tenant_id: membership.tenantId,
    timestamp: new Date(_now()).toISOString()
  }));

  return {
    ok: true,
    user: {
      personId: membership.personId,
      tenantId: membership.tenantId,
      email: row.email,
      role: membership.role
    }
  };
}

module.exports = {
  migrateClientLoginTokensSchema: migrateClientLoginTokensSchema,
  isClientOrgEligible: isClientOrgEligible,
  requestMagicLinkLogin: requestMagicLinkLogin,
  resolveLoginToken: resolveLoginToken,
  TTL_MS: TTL_MS,
  _setNowForTesting: _setNowForTesting,
  _resetNowForTesting: _resetNowForTesting
};
