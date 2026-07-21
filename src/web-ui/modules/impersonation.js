'use strict';

// impersonation.js — d1
// Core session-swap logic. No new D37 adapter for this module itself (the
// D37 adapter is impersonation-audit-adapter.js, for the audit WRITE only) —
// filterUsers/listImpersonationCandidates/startImpersonationSession are
// app-layer logic, matching identity-links.js's own "direct DB access via a
// plain pool parameter, not a setter/getter pair" precedent for read-only
// helpers that aren't themselves a new adapter.
//
// See artefacts/2026-07-21-web-ui-experience-redesign/decisions.md ("d1
// implementation, mandatory Task 0 technical investigation") for the full
// session-swap design rationale, including the deliberate non-swap of
// req.session.accessToken/userId and the interaction with requireAdmin's
// live per-request role re-check.

var { writeImpersonationAudit } = require('../adapters/impersonation-audit-adapter');

/**
 * Filter a list of {login, tenantId} candidates by a case-insensitive
 * substring match against either field (AC1).
 * @param {Array<{login:string, tenantId:string}>} users
 * @param {string} query
 * @returns {Array<object>}
 */
function filterUsers(users, query) {
  var q = String(query == null ? '' : query).toLowerCase().trim();
  if (!q) return users.slice();
  return users.filter(function(u) {
    var login = String(u.login || '').toLowerCase();
    var tenantId = String(u.tenantId || '').toLowerCase();
    return login.indexOf(q) !== -1 || tenantId.indexOf(q) !== -1;
  });
}

/**
 * Real, cross-tenant candidate list for the search endpoint (AC1's real data
 * source). team_memberships is the only real table this platform has that
 * associates a role with a tenant/person; person_identities supplies a real
 * linked login when one exists. tenant_id itself is used as the login
 * fallback because, for a solo (non-TENANT_ORG_ALLOWLIST) tenant, tenant_id
 * IS the person's own original identity (routes/auth.js: req.session.tenantId
 * = user.login when no allowlist is configured) — this mirrors
 * identity-links.js's resolvePersonForIdentity fallback exactly, not a
 * fabricated value.
 * @param {object} pool
 * @returns {Promise<Array<{tenantId:string, personId:number, role:string, login:string}>>}
 */
async function listImpersonationCandidates(pool) {
  var r = await pool.query(
    `SELECT tm.tenant_id, tm.person_id, tm.role,
            COALESCE(
              (SELECT pi.identity_key FROM person_identities pi
                WHERE pi.person_id = tm.person_id
                ORDER BY pi.created_at ASC LIMIT 1),
              tm.tenant_id
            ) AS login
       FROM team_memberships tm
       ORDER BY tm.tenant_id ASC`
  );
  return r.rows.map(function(row) {
    return { tenantId: row.tenant_id, personId: row.person_id, role: row.role, login: row.login };
  });
}

/**
 * Start an impersonation session (AC2-AC5). Mutates `session` in place —
 * ONLY after the audit write succeeds (AC4), and only via one synchronous
 * block with no `await` in between (see decisions.md's atomicity note: this
 * is what guarantees no concurrent request can observe a partially-swapped
 * session, per Node's single-threaded event loop).
 * @param {object} session - req.session (mutated in place on success)
 * @param {{id:*, login:string, tenantId:string, role:string}} target
 * @param {string} reason
 * @returns {Promise<{auditId:*}>}
 */
async function startImpersonationSession(session, target, reason) {
  var trimmedReason = String(reason == null ? '' : reason).trim();
  if (!trimmedReason) {
    var reasonErr = new Error('A reason is required to start an impersonation session.');
    reasonErr.code = 'REASON_REQUIRED';
    throw reasonErr;
  }

  if (session && session.impersonation && session.impersonation.active) {
    var nestedErr = new Error('Already impersonating a user -- exit the current session before starting another.');
    nestedErr.code = 'ALREADY_IMPERSONATING';
    throw nestedErr;
  }

  var adminSnapshot = {
    userId: session.userId,
    login: session.login,
    tenantId: session.tenantId,
    role: session.role
  };

  // Audit write happens BEFORE any session mutation (AC4) — if this throws,
  // execution never reaches the assignment block below, so the session is
  // left completely untouched: a failed audit write is a failed session
  // start, not a silent gap.
  var auditRow = await writeImpersonationAudit({
    adminId: adminSnapshot.userId,
    adminLogin: adminSnapshot.login,
    adminTenantId: adminSnapshot.tenantId,
    targetId: target.id,
    targetLogin: target.login,
    targetTenantId: target.tenantId,
    reason: trimmedReason
  });

  // Single synchronous block, no `await` between these lines — this is what
  // makes the swap atomic from any concurrent request's perspective (AC3,
  // and the NFR: "no inconsistent state under concurrent requests during the
  // swap window"). req.session.accessToken and req.session.userId are
  // deliberately NOT touched — see decisions.md for why.
  session.impersonation = {
    active: true,
    admin: adminSnapshot,
    target: { id: target.id, login: target.login, tenantId: target.tenantId, role: target.role },
    reason: trimmedReason,
    auditId: auditRow.id,
    startedAt: auditRow.created_at
  };
  session.tenantId = target.tenantId;
  session.login = target.login;
  session.role = target.role;

  return { auditId: auditRow.id };
}

module.exports = { filterUsers, listImpersonationCandidates, startImpersonationSession };
