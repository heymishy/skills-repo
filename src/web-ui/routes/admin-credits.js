'use strict';

// admin-credits.js — admin credits management handlers (arl-s3).
// GET /admin/credits — display all tenant balances.
// POST /api/admin/credits/adjust — adjust a tenant's balance.
// Protected by requireAdmin middleware (mounted in server.js).
// arl-s5 — adjust now writes an immutable audit row via adjustBalanceWithAudit
// (tenant_id, admin_id, delta, balance_before, balance_after, created_at).

const { getAllTenantBalances, getValidTenantIds, adjustBalanceWithAudit } = require('../modules/credits');

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Read and parse the request body (form-urlencoded).
 * @param {object} req
 * @returns {Promise<object>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var params = new URLSearchParams(raw);
      var obj = {};
      params.forEach(function(v, k) { obj[k] = v; });
      resolve(obj);
    });
  });
}

/**
 * GET /admin/credits — render admin credits page showing all tenant balances.
 */
async function adminCreditsGet(req, res) {
  const rows = await getAllTenantBalances();

  const tableRows = rows.map(function(r) {
    return (
      '<tr>' +
      '<td>' + escapeHtml(r.tenant_id) + '</td>' +
      '<td>' + escapeHtml(String(r.balance)) + '</td>' +
      '<td>' +
      '<form method="POST" action="/api/admin/credits/adjust">' +
      '<input type="hidden" name="tenantId" value="' + escapeHtml(r.tenant_id) + '">' +
      '<input type="number" name="amount" min="1" required>' +
      '<button type="submit">Adjust</button>' +
      '</form>' +
      '</td>' +
      '</tr>'
    );
  }).join('\n');

  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>Admin — Credits</title></head>',
    '<body>',
    '<h1>Admin: Credits</h1>',
    '<table>',
    '<thead><tr><th>Tenant ID</th><th>Balance</th><th>Top-up</th></tr></thead>',
    '<tbody>',
    tableRows,
    '</tbody>',
    '</table>',
    '</body>',
    '</html>',
  ].join('\n');

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/admin/credits/adjust — adjust a tenant's credit balance.
 * Validates: amount must be a positive integer (>0), tenantId must exist in credits table.
 * Redirects 302 to /admin/credits on success.
 */
async function adminCreditsPost(req, res) {
  const body = await _readBody(req);
  const tenantId = body && body.tenantId ? String(body.tenantId) : '';
  const rawAmount = body && body.amount !== undefined ? String(body.amount) : '';

  // Validate amount: must be a positive integer (>0), no negative, no zero, no non-numeric
  const amountNum = parseInt(rawAmount, 10);
  if (!rawAmount || isNaN(amountNum) || amountNum <= 0 || String(amountNum) !== rawAmount) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'amount must be a positive integer' }));
    return;
  }

  // Validate tenantId against allowlist
  const validIds = await getValidTenantIds();
  if (!validIds.includes(tenantId)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unknown tenantId' }));
    return;
  }

  // arl-s5 — resolve admin identity for the audit trail. Never req.session.accessToken (AC7).
  const adminId = String((req.session && (req.session.login || req.session.userId)) || 'unknown');

  await adjustBalanceWithAudit(tenantId, amountNum, adminId);

  res.writeHead(302, { Location: '/admin/credits' });
  res.end();
}

module.exports = { adminCreditsGet, adminCreditsPost };
