'use strict';

// credits-guard.js — middleware to enforce credit balance before each turn (lab-s3.3).
// Checks tenant credit balance via credits.js; returns HTTP 402 when balance <= 0.
// Audit-logs every blocked request with `credits_balance_check` event (AC6).
// Must be mounted AFTER session auth so req.session.tenantId is available (AC5).

const { getBalance } = require('../modules/credits');

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
  // arl-s2: admin users bypass the credits check entirely (strict equality only)
  if (req.session && req.session.role === 'admin') {
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
