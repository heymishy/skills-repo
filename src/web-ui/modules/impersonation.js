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

var { writeImpersonationAudit, endImpersonationAudit } = require('../adapters/impersonation-audit-adapter');

// d2 — injectable logger for the exit-audit-failure fail-open path (NOT a D37
// throw-on-unwired adapter -- a logging failure must never block the actual
// session exit; mirrors the existing precedent in require-admin.js's _logger).
let _logger = {
  warn: function(/* event, data */) {}
};

/**
 * Replace the audit-failure logger (used in tests and production bootstrap).
 * @param {{ warn: Function }} logger
 */
function setLogger(logger) {
  _logger = logger;
}

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
 * Re-derive one candidate's login/tenantId/role directly from the DB by
 * person_id, the same join `listImpersonationCandidates` uses (AC1's data
 * source). This is the authoritative source for `startImpersonationSession` —
 * a client-submitted targetLogin/targetTenantId/targetRole is never trusted
 * for the actual swap or the audit write, only `targetId` is (fixed
 * post-review: the original implementation wrote client-submitted target
 * fields straight into both the session and the audit log with no
 * server-side re-verification against targetId, so a tampered hidden-form
 * submission could write a fabricated audit row and/or set session.role to
 * a value that didn't match the real target's DB role).
 * @param {object} pool
 * @param {*} personId
 * @returns {Promise<{tenantId:string, personId:number, role:string, login:string}|null>}
 */
async function getImpersonationCandidateById(pool, personId) {
  var r = await pool.query(
    `SELECT tm.tenant_id, tm.person_id, tm.role,
            COALESCE(
              (SELECT pi.identity_key FROM person_identities pi
                WHERE pi.person_id = tm.person_id
                ORDER BY pi.created_at ASC LIMIT 1),
              tm.tenant_id
            ) AS login
       FROM team_memberships tm
       WHERE tm.person_id = $1
       LIMIT 1`,
    [personId]
  );
  if (!r.rows.length) return null;
  var row = r.rows[0];
  return { tenantId: row.tenant_id, personId: row.person_id, role: row.role, login: row.login };
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

/**
 * d2 — Compute the EFFECTIVE role for a session: the impersonation target's
 * role while an impersonation session is active, else the session's own role.
 * This is the single, named, testable form of the story's core security
 * property (AC2/AC3): visibility of admin-only surfaces must key off the
 * effective role, never the real admin's underlying role.
 *
 * Redundant-by-design with D1's own swap (session.role is already overwritten
 * to the target's role during an active impersonation -- see
 * startImpersonationSession above) -- this function explicitly prefers
 * session.impersonation.target.role over session.role whenever impersonation
 * is active, rather than relying solely on that swap having happened. This
 * makes the security property self-evidently correct from this one function
 * alone, and robust to any future change in how the swap itself is
 * implemented -- exactly the explicit, auditable form D4's dedicated
 * NFR-security review (this story's primary subject) expects.
 * @param {object} session
 * @returns {string|undefined}
 */
function getEffectiveRole(session) {
  if (session && session.impersonation && session.impersonation.active && session.impersonation.target) {
    return session.impersonation.target.role;
  }
  return session && session.role;
}

/**
 * d2 — AC2/AC3: true only when the EFFECTIVE role is 'admin'. Never reads
 * session.impersonation.admin.role (the real admin's underlying role) for
 * this check -- doing so would leak admin-only surfaces while impersonating
 * a non-admin target, exactly the privilege-leakage property this epic's own
 * benefit metric measures.
 * @param {object} session
 * @returns {boolean}
 */
function isEffectivelyAdmin(session) {
  return getEffectiveRole(session) === 'admin';
}

/**
 * d2 — AC4: end an active impersonation session, restoring the real admin's
 * identity exactly from the snapshot D1 captured at start (session.impersonation.admin),
 * and removing session.impersonation entirely so no target-user session state
 * persists after exit (cookies/server-side session store both hold only
 * `session` itself -- deleting this key is sufficient for both).
 *
 * Never accepts or reads any identity field from a caller/request body --
 * the only input is the session itself, matching the D1 SEC fix's discipline
 * (re-derive identity from trustworthy server-side state, never trust
 * client-submitted values) applied to this new endpoint's own trust boundary.
 *
 * The audit end-timestamp write (Audit NFR) is best-effort: if it throws, the
 * error is logged but the session revert still proceeds (fail OPEN) -- see
 * decisions.md's SEC entry. Blocking the actual identity restoration on an
 * audit-log hiccup would trap the real admin inside the target's identity,
 * a worse security/availability outcome than a missed end-timestamp.
 * @param {object} session - req.session (mutated in place on success)
 * @returns {Promise<{exited:true}>}
 */
async function exitImpersonationSession(session) {
  if (!session || !session.impersonation || !session.impersonation.active) {
    var err = new Error('Not currently impersonating -- nothing to exit.');
    err.code = 'NOT_IMPERSONATING';
    throw err;
  }

  var admin = session.impersonation.admin || {};
  var auditId = session.impersonation.auditId;

  try {
    await endImpersonationAudit(auditId);
  } catch (auditErr) {
    _logger.warn('impersonation_exit_audit_failed', {
      auditId: auditId,
      reason: auditErr && auditErr.message,
      timestamp: new Date().toISOString()
    });
    // Fall through -- the session revert below must still happen.
  }

  // Restore exactly, single synchronous block (mirrors startImpersonationSession's
  // own atomicity discipline) -- then remove the sub-object entirely so no
  // target-user data of any kind (login, tenantId, role, auditId, reason,
  // startedAt) remains anywhere in the session after exit (AC4).
  session.tenantId = admin.tenantId;
  session.login = admin.login;
  session.role = admin.role;
  session.userId = admin.userId;
  delete session.impersonation;

  return { exited: true };
}

module.exports = {
  filterUsers,
  listImpersonationCandidates,
  getImpersonationCandidateById,
  startImpersonationSession,
  getEffectiveRole,
  isEffectivelyAdmin,
  exitImpersonationSession,
  setLogger
};
