'use strict';

// credits-guard.js — middleware to enforce credit balance before each turn (lab-s3.3).
// Checks tenant credit balance via credits.js; returns HTTP 402 when balance <= 0.
// Audit-logs every blocked request with `credits_balance_check` event (AC6).
// Must be mounted AFTER session auth so req.session.tenantId is available (AC5).
//
// d4 (NFR-security review, AC1/AC5): the admin bypass now reads the EFFECTIVE
// role via isEffectivelyAdmin() (modules/impersonation.js) instead of a raw,
// direct equality check against the cached session role field. Behaviourally
// identical today (D1's
// session swap already overwrites req.session.role to the target's role during
// an active impersonation, so the raw check happened to read the correct
// value) -- this closes the one remaining role-gate in the codebase that was
// not routed through the same canonical, audited helper as every other
// effective-role check (dashboard.js, journey.js, settings.js), removing the
// fragility flagged during this story's exhaustive AC1 enumeration: a future
// change to the swap mechanism that stops mutating session.role directly
// would otherwise silently reintroduce a privilege leak here with no test to
// catch it. See decisions.md (d4 AC1/AC5 finding).

const { getBalance } = require('../modules/credits');
const { isEffectivelyAdmin } = require('../modules/impersonation');

/**
 * creditsGuard — check tenant credit balance before the turn handler runs.
 * Returns 402 with topUpUrl when balance <= 0; calls next() when balance > 0.
 * The 402 body is exactly { "error": "Insufficient credits", "topUpUrl": "/settings/billing" }.
 * No grace period: any balance <= 0 blocks the turn (AC1, AC2, AC5 — lab-s3.3).
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
async function creditsGuard(req, res, next) {
  // arl-s2: admin users bypass the credits check entirely. d4: reads the
  // EFFECTIVE role (never the real admin's own role while impersonating a
  // non-admin target) via the same canonical helper used everywhere else.
  if (req.session && isEffectivelyAdmin(req.session)) {
    return next();
  }
  const tenantId = req.session && req.session.tenantId;
  const balance = await getBalance(tenantId);
  if (balance <= 0) {
    console.info('credits_balance_check', { tenantId, balance, result: 'blocked' });
    res.writeHead(402, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Insufficient credits', topUpUrl: '/settings/billing' }));
    return;
  }
  next();
}

module.exports = { creditsGuard };
